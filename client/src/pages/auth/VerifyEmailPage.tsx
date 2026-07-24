import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import { AuthShell } from './AuthShell';
import { auth as authApi, ApiError } from '../../lib/apiClient';

type State = 'verifying' | 'ok' | 'error';

// Consumes an email-verification link (?token=…). Runs once on mount and reports
// the outcome. StrictMode double-invokes effects in dev, so a ref guards against
// a duplicate consume of the single-use token.
export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [state, setState] = useState<State>('verifying');
  const [message, setMessage] = useState('');
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    if (!token) {
      setState('error');
      setMessage('This verification link is missing its token.');
      return;
    }
    (async () => {
      try {
        const res = await authApi.verifyEmail(token);
        setState('ok');
        setMessage(res.message || 'Your email is verified.');
      } catch (err) {
        setState('error');
        setMessage(err instanceof ApiError ? err.message : 'This verification link is invalid or has expired.');
      }
    })();
  }, [token]);

  return (
    <AuthShell
      title={state === 'ok' ? 'Email verified' : state === 'error' ? 'Verification failed' : 'Verifying…'}
      footer={<Link to="/">Go to DINA</Link>}
    >
      {state === 'verifying' && (
        <div className="auth-gate" role="status" aria-live="polite">
          <span className="spinner" aria-hidden />
          <span className="muted">Confirming your email…</span>
        </div>
      )}
      {state === 'ok' && <p className="auth-notice">{message}</p>}
      {state === 'error' && <p className="auth-error">{message}</p>}
    </AuthShell>
  );
}
