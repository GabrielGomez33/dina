// ============================================================================
// DINA client — ProtectedRoute
// ============================================================================
// Gates its children behind authentication. While the session bootstraps it
// shows a quiet placeholder; once resolved it either renders the page or
// redirects to /login, preserving where the user was headed (?next=) so they
// land back there after signing in.
// ============================================================================

import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div className="auth-gate" role="status" aria-live="polite">
        <span className="spinner" aria-hidden />
        <span className="muted">Checking your session…</span>
      </div>
    );
  }

  if (status === 'anonymous') {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  return <>{children}</>;
}
