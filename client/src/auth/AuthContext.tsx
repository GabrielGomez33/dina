// ============================================================================
// DINA client — AuthProvider + useAuth
// ============================================================================
// The React-facing auth state. Mirrors authStore (the transport-layer source of
// truth) into React state, bootstraps the session on mount (if a token is
// stored, validate it via /auth/me), and exposes login/register/logout actions.
// Components read `user`/`status` and call actions; they never touch tokens.
// ============================================================================

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { auth as authApi, ApiError } from '../lib/apiClient';
import { authStore } from '../lib/authStore';
import type { AuthUser, LoginInput, RegisterInput } from '../lib/types';

type Status = 'loading' | 'authenticated' | 'anonymous';

interface AuthContextValue {
  status: Status;
  user: AuthUser | null;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => authStore.get().user);
  const [status, setStatus] = useState<Status>(() => (authStore.getAccessToken() ? 'loading' : 'anonymous'));

  // Keep React state in lockstep with the token store (e.g. a 401 refresh
  // failure elsewhere clears the store → we drop to anonymous).
  useEffect(() => {
    return authStore.subscribe((s) => {
      setUser(s.user);
      if (!s.accessToken) setStatus('anonymous');
    });
  }, []);

  // Bootstrap: if we have a token, confirm it's still good and refresh the user.
  useEffect(() => {
    let cancelled = false;
    if (!authStore.getAccessToken()) {
      setStatus('anonymous');
      return;
    }
    (async () => {
      try {
        const { user: fresh } = await authApi.me();
        if (cancelled) return;
        authStore.setUser(fresh);
        setStatus('authenticated');
      } catch (err) {
        if (cancelled) return;
        // 401 → token dead (refresh already attempted in the transport). Any
        // other error (network) → stay optimistic with the cached user so a
        // flaky connection doesn't sign the user out.
        if (err instanceof ApiError && err.status === 401) {
          authStore.clear();
          setStatus('anonymous');
        } else {
          setStatus(authStore.get().user ? 'authenticated' : 'anonymous');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      async login(input) {
        const s = await authApi.login(input);
        authStore.setSession(s.accessToken, s.refreshToken, s.user);
        setStatus('authenticated');
      },
      async register(input) {
        const s = await authApi.register(input);
        authStore.setSession(s.accessToken, s.refreshToken, s.user);
        setStatus('authenticated');
      },
      async logout() {
        try {
          await authApi.logout();
        } catch {
          /* best-effort: revoke server-side, but always clear locally */
        }
        authStore.clear();
        setStatus('anonymous');
      },
      async refreshUser() {
        const { user: fresh } = await authApi.me();
        authStore.setUser(fresh);
      },
    }),
    [status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
