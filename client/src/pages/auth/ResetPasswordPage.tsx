import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthShell } from './AuthShell';
import { auth as authApi, ApiError } from '../../lib/apiClient';
import { checkPassword } from './passwordPolicy';

// Set a new password from an emailed reset link (?token=…). On success the
// server revokes all sessions, so we send the user to sign in fresh.
export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const policy = checkPassword(password);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await authApi.resetPassword(token, password);
      navigate('/login?reset=1', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reset your password. The link may have expired.');
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <AuthShell title="Invalid reset link" footer={<Link to="/forgot-password">Request a new link</Link>}>
        <p className="auth-notice">This reset link is missing its token. Request a fresh one to continue.</p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Choose a new password" footer={<Link to="/login">Back to sign in</Link>}>
      <form className="auth-form" onSubmit={onSubmit} noValidate>
        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}
        <label className="field">
          <span className="field-label">New password</span>
          <input
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={busy}
          />
        </label>
        {password.length > 0 && (
          <ul className="policy-list" aria-label="Password requirements">
            {policy.rules.map((r) => (
              <li key={r.label} className={r.met ? 'met' : ''}>
                <span aria-hidden>{r.met ? '✓' : '○'}</span> {r.label}
              </li>
            ))}
          </ul>
        )}
        <button type="submit" className="btn primary block" disabled={busy || !policy.ok}>
          {busy ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </AuthShell>
  );
}
