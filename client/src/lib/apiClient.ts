// ============================================================================
// DINA client — HTTP transport for the DUMP-compliant API
// ============================================================================
// One hardened request() primitive (timeout, external-abort composition, typed
// JSON, normalized errors) that every capability method flows through. No
// component ever calls fetch() directly — separation of concerns and a single
// place to harden.

import { API_BASE, DEFAULT_TIMEOUT_MS, LLM_TIMEOUT_MS } from './apiConfig';
import type {
  GraphResult,
  HistoryPage,
  IntelligenceLevel,
  NodeInsight,
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
  const { method = 'GET', body, query, timeoutMs = DEFAULT_TIMEOUT_MS, signal } = opts;
  const { signal: composed, done } = withTimeout(timeoutMs, signal);

  let res: Response;
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: 'include', // carry the auth cookie/session
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
