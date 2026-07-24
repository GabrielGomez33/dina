import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthShell } from './AuthShell';
import { useAuth } from '../../auth/AuthContext';
import { ApiError } from '../../lib/apiClient';
import { checkPassword } from './passwordPolicy';

// Account creation. Mirrors the server policy for instant feedback; the server
// re-validates and owns uniqueness.
export function SignupPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next') || '/';

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const policy = checkPassword(password);
  const usernameOk = /^[a-zA-Z0-9_]{3,20}$/.test(username);
  const canSubmit = usernameOk && email.length > 3 && policy.ok && !busy;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await register({ username, email, password });
      navigate(next, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create your account. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="One account for every DINA module."
      footer={
        <>
          <span className="muted">Already have an account?</span> <Link to="/login">Sign in</Link>
        </>
      }
    >
      <form className="auth-form" onSubmit={onSubmit} noValidate>
        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}
        <label className="field">
          <span className="field-label">Username</span>
          <input
            type="text"
            autoComplete="username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={busy}
            aria-invalid={username.length > 0 && !usernameOk}
          />
          {username.length > 0 && !usernameOk && (
            <span className="field-hint">3–20 characters — letters, numbers, underscores.</span>
          )}
        </label>
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
        <label className="field">
          <span className="field-label">Password</span>
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
        <button type="submit" className="btn primary block" disabled={!canSubmit}>
          {busy ? 'Creating…' : 'Create account'}
        </button>
      </form>
    </AuthShell>
  );
}
