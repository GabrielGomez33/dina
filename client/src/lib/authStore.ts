// ============================================================================
// DINA client — auth token store (single source of truth for tokens)
// ============================================================================
// Holds the access + refresh tokens and the current user. Persists to
// localStorage so a reload keeps you signed in, and notifies subscribers on
// change so React state (AuthContext) stays in sync. The apiClient reads the
// access token from here to set the Authorization header; nothing else touches
// storage directly. Keeping this OUTSIDE React means the transport layer
// (apiClient) can read/refresh tokens without importing React.
// ============================================================================

import type { AuthUser } from './types';

const ACCESS_KEY = 'dina.accessToken';
const REFRESH_KEY = 'dina.refreshToken';
const USER_KEY = 'dina.user';

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
}

function read(): AuthState {
  try {
    const userRaw = localStorage.getItem(USER_KEY);
    return {
      accessToken: localStorage.getItem(ACCESS_KEY),
      refreshToken: localStorage.getItem(REFRESH_KEY),
      user: userRaw ? (JSON.parse(userRaw) as AuthUser) : null,
    };
  } catch {
    return { accessToken: null, refreshToken: null, user: null };
  }
}

let state: AuthState = read();
const listeners = new Set<(s: AuthState) => void>();

function emit(): void {
  for (const l of listeners) l(state);
}

export const authStore = {
  get(): AuthState {
    return state;
  },

  getAccessToken(): string | null {
    return state.accessToken;
  },

  getRefreshToken(): string | null {
    return state.refreshToken;
  },

  /** Persist a full session (login/register). */
  setSession(accessToken: string, refreshToken: string, user: AuthUser): void {
    state = { accessToken, refreshToken, user };
    try {
      localStorage.setItem(ACCESS_KEY, accessToken);
      localStorage.setItem(REFRESH_KEY, refreshToken);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch {
      /* storage may be unavailable (private mode) — memory still works */
    }
    emit();
  },

  /** Replace just the access token (after a refresh). */
  setAccessToken(accessToken: string): void {
    state = { ...state, accessToken };
    try {
      localStorage.setItem(ACCESS_KEY, accessToken);
    } catch {
      /* ignore */
    }
    emit();
  },

  /** Update the cached user (e.g. after email verification). */
  setUser(user: AuthUser | null): void {
    state = { ...state, user };
    try {
      if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
      else localStorage.removeItem(USER_KEY);
    } catch {
      /* ignore */
    }
    emit();
  },

  /** Wipe everything (logout). */
  clear(): void {
    state = { accessToken: null, refreshToken: null, user: null };
    try {
      localStorage.removeItem(ACCESS_KEY);
      localStorage.removeItem(REFRESH_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {
      /* ignore */
    }
    emit();
  },

  subscribe(fn: (s: AuthState) => void): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
