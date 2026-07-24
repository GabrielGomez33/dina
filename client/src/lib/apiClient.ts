// ============================================================================
// DINA client — HTTP transport for the DUMP-compliant API
// ============================================================================
// One hardened request() primitive (timeout, external-abort composition, typed
// JSON, normalized errors) that every capability method flows through. No
// component ever calls fetch() directly — separation of concerns and a single
// place to harden.

import { API_BASE, DEFAULT_TIMEOUT_MS, LLM_TIMEOUT_MS } from './apiConfig';
import { authStore } from './authStore';
import type {
  AuthSession,
  AuthUser,
  GraphResult,
  HistoryPage,
  IntelligenceLevel,
  LoginInput,
  NodeInsight,
  RegisterInput,
  ResearchRecord,
  ResearchRunResult,
  SemanticResult,
} from './types';

/** A normalized error every caller can rely on (status 0 = network/timeout). */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly detail?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
  get isTimeout(): boolean {
    return this.status === 0 && /timeout|abort/i.test(this.message);
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  timeoutMs?: number;
  /** Caller-owned signal (e.g. React cleanup) composed with the timeout. */
  signal?: AbortSignal;
  /** Skip attaching the bearer token (login/register/refresh/public flows). */
  skipAuth?: boolean;
  /** Internal: prevents infinite 401→refresh→retry loops. */
  _isRetry?: boolean;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
  if (!query) return url;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
  }
  const s = qs.toString();
  return s ? `${url}?${s}` : url;
}

/** Compose an external signal with a timeout into one signal + cleanup. */
function withTimeout(timeoutMs: number, external?: AbortSignal): { signal: AbortSignal; done: () => void } {
  const ctrl = new AbortController();
  const onAbort = () => ctrl.abort(external?.reason);
  if (external) {
    if (external.aborted) ctrl.abort(external.reason);
    else external.addEventListener('abort', onAbort, { once: true });
  }
  const timer = setTimeout(() => ctrl.abort(new DOMException('Request timed out', 'TimeoutError')), timeoutMs);
  return {
    signal: ctrl.signal,
    done: () => {
      clearTimeout(timer);
      external?.removeEventListener('abort', onAbort);
    },
  };
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, timeoutMs = DEFAULT_TIMEOUT_MS, signal, skipAuth, _isRetry } = opts;
  const { signal: composed, done } = withTimeout(timeoutMs, signal);

  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (!skipAuth) {
    const token = authStore.getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: 'include', // harmless; bearer token is the primary auth
      signal: composed,
    });
  } catch (err) {
    done();
    if (err instanceof DOMException && (err.name === 'AbortError' || err.name === 'TimeoutError')) {
      throw new ApiError('Request timed out or was cancelled', 0, err);
    }
    throw new ApiError('Network error — could not reach the DINA API', 0, err);
  }
  done();

  // Access token expired → transparently refresh ONCE and replay the request.
  // Guarded so the refresh call itself (skipAuth) and an already-retried request
  // can't recurse. If refresh fails, the session is dead → clear + surface 401.
  if (res.status === 401 && !skipAuth && !_isRetry && authStore.getRefreshToken()) {
    const refreshed = await tryRefresh();
    if (refreshed) return request<T>(path, { ...opts, _isRetry: true });
    authStore.clear();
  }

  const text = await res.text();
  let data: unknown = undefined;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      // non-JSON body (e.g. an HTML error page from a proxy)
      if (!res.ok) throw new ApiError(`HTTP ${res.status}`, res.status, text.slice(0, 500));
      throw new ApiError('Malformed JSON response from the API', res.status, text.slice(0, 500));
    }
  }

  if (!res.ok) {
    const serverMsg =
      data && typeof data === 'object' && 'message' in data ? String((data as { message: unknown }).message) : '';
    throw new ApiError(serverMsg || `HTTP ${res.status}`, res.status, data);
  }

  // A disabled subsystem returns 200 with { status: 'disabled' } — surface it.
  if (data && typeof data === 'object' && (data as { status?: string }).status === 'disabled') {
    throw new ApiError(
      String((data as { message?: string }).message ?? 'This DINA subsystem is disabled'),
      503,
      data,
    );
  }

  return data as T;
}

// A single in-flight refresh shared by all concurrent 401s, so a burst of
// requests hitting an expired token triggers exactly one /auth/refresh.
let refreshInFlight: Promise<boolean> | null = null;

function tryRefresh(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  const refreshToken = authStore.getRefreshToken();
  if (!refreshToken) return Promise.resolve(false);
  refreshInFlight = (async () => {
    try {
      const data = await request<{ accessToken: string }>('/auth/refresh', {
        method: 'POST',
        body: { refreshToken },
        skipAuth: true,
      });
      if (data?.accessToken) {
        authStore.setAccessToken(data.accessToken);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

// ---------------------------------------------------------------------------
// Auth methods — user identity for the DINA console (see src/modules/auth).
// ---------------------------------------------------------------------------
export const auth = {
  register(input: RegisterInput, signal?: AbortSignal): Promise<AuthSession> {
    return request<AuthSession>('/auth/register', { method: 'POST', body: input, skipAuth: true, signal });
  },
  login(input: LoginInput, signal?: AbortSignal): Promise<AuthSession> {
    return request<AuthSession>('/auth/login', { method: 'POST', body: input, skipAuth: true, signal });
  },
  /** Fetch the current user (validates the access token + live session). */
  me(signal?: AbortSignal): Promise<{ user: AuthUser }> {
    return request<{ user: AuthUser }>('/auth/me', { signal });
  },
  logout(signal?: AbortSignal): Promise<{ message: string }> {
    return request('/auth/logout', { method: 'POST', signal });
  },
  logoutAll(signal?: AbortSignal): Promise<{ message: string }> {
    return request('/auth/logout-all', { method: 'POST', signal });
  },
  checkUsername(username: string, signal?: AbortSignal): Promise<{ available: boolean; reason?: string }> {
    return request('/auth/check-username', { query: { username }, skipAuth: true, signal });
  },
  verifyEmail(token: string, signal?: AbortSignal): Promise<{ message: string }> {
    return request('/auth/verify-email', { method: 'POST', body: { token }, skipAuth: true, signal });
  },
  resendVerification(signal?: AbortSignal): Promise<{ message: string }> {
    return request('/auth/resend-verification', { method: 'POST', signal });
  },
  forgotPassword(email: string, signal?: AbortSignal): Promise<{ message: string }> {
    return request('/auth/forgot-password', { method: 'POST', body: { email }, skipAuth: true, signal });
  },
  resetPassword(token: string, password: string, signal?: AbortSignal): Promise<{ message: string }> {
    return request('/auth/reset-password', { method: 'POST', body: { token, password }, skipAuth: true, signal });
  },
  changePassword(
    currentPassword: string,
    newPassword: string,
    signal?: AbortSignal,
  ): Promise<{ message: string; accessToken: string; refreshToken: string }> {
    return request('/auth/change-password', { method: 'POST', body: { currentPassword, newPassword }, signal });
  },
  changeEmail(newEmail: string, currentPassword: string, signal?: AbortSignal): Promise<{ message: string }> {
    return request('/auth/change-email', { method: 'POST', body: { newEmail, currentPassword }, signal });
  },
  confirmEmailChange(token: string, signal?: AbortSignal): Promise<{ message: string }> {
    return request('/auth/confirm-email-change', { method: 'POST', body: { token }, skipAuth: true, signal });
  },
};

// ---------------------------------------------------------------------------
// Capability methods — one thin, typed wrapper per API.md endpoint.
// ---------------------------------------------------------------------------
export const dina = {
  /** List past researches (history sidebar). */
  history(
    params: { limit?: number; offset?: number; type?: string; search?: string } = {},
    signal?: AbortSignal,
  ): Promise<HistoryPage> {
    return request<HistoryPage>('/digim/history', { query: params, signal });
  },

  /** Open one past research by id (optionally with its source documents). */
  getResearch(id: string, withDocuments = false, signal?: AbortSignal): Promise<{ research: ResearchRecord }> {
    return request('/digim/research/' + encodeURIComponent(id), {
      query: { with_documents: withDocuments || undefined },
      signal,
    });
  },

  /** Run a research (gather → synthesize). Long-running. */
  research(
    body: { query: string; intelligence_level?: IntelligenceLevel; graph?: boolean; browser_mode?: string },
    signal?: AbortSignal,
  ): Promise<ResearchRunResult> {
    return request('/digim/research', { method: 'POST', body, timeoutMs: LLM_TIMEOUT_MS, signal });
  },

  /** Multi-facet investigation. Long-running. */
  investigate(
    body: { query: string; intelligence_level?: IntelligenceLevel },
    signal?: AbortSignal,
  ): Promise<ResearchRunResult> {
    return request('/digim/investigate', { method: 'POST', body, timeoutMs: LLM_TIMEOUT_MS, signal });
  },

  /** Query the relationship graph (network + timeline views). */
  graph(body: { query: string; max_nodes?: number }, signal?: AbortSignal): Promise<GraphResult> {
    return request('/digim/graph', { method: 'POST', body, signal });
  },

  /** Project stored embeddings to the 3D semantic cloud. */
  semantic(body: { filter?: string; limit?: number } = {}, signal?: AbortSignal): Promise<SemanticResult> {
    return request('/digim/semantic', { method: 'POST', body, signal });
  },

  /** On-demand grounded insight for one entity/node. Long-running. */
  nodeInsight(body: { entity: string; max_sources?: number }, signal?: AbortSignal): Promise<NodeInsight> {
    return request('/digim/node-insight', { method: 'POST', body, timeoutMs: LLM_TIMEOUT_MS, signal });
  },

  /** Recall from semantic memory (no gathering). */
  recall(body: { query: string; top_k?: number; min_score?: number }, signal?: AbortSignal): Promise<unknown> {
    return request('/digim/recall', { method: 'POST', body, signal });
  },

  /** Discovery inspection — candidate URLs without fetching. */
  search(body: { query: string }, signal?: AbortSignal): Promise<unknown> {
    return request('/digim/search', { method: 'POST', body, signal });
  },

  /** Subsystem status/health (gate the UI on what's enabled). */
  status(signal?: AbortSignal): Promise<Record<string, unknown>> {
    return request('/digim/status', { signal });
  },
};
