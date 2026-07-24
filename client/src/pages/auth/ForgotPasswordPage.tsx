import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AuthShell } from './AuthShell';
import { auth as authApi, ApiError } from '../../lib/apiClient';

// Request a password-reset link. The server always answers the same way (no
// account enumeration), so we show a generic confirmation regardless.
export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle={sent ? undefined : 'Enter your email and we’ll send you a reset link.'}
      footer={<Link to="/login">Back to sign in</Link>}
    >
      {sent ? (
        <p className="auth-notice">
          If an account exists for <strong>{email}</strong>, a reset link is on its way. Check your inbox (and spam).
        </p>
      ) : (
        <form className="auth-form" onSubmit={onSubmit} noValidate>
          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}
          <label className="field">
            <span className="field-label">Email</span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
            />
          </label>
          <button type="submit" className="btn primary block" disabled={busy}>
            {busy ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
