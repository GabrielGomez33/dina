import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AuthShell } from './AuthShell';
import { auth as authApi, ApiError } from '../../lib/apiClient';

type State = 'working' | 'ok' | 'error';

// Consumes an email-change confirmation link (?token=…) sent to the NEW address.
export function ConfirmEmailChangePage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [state, setState] = useState<State>('working');
  const [message, setMessage] = useState('');
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    if (!token) {
      setState('error');
      setMessage('This confirmation link is missing its token.');
      return;
    }
    (async () => {
      try {
        const res = await authApi.confirmEmailChange(token);
        setState('ok');
        setMessage(res.message || 'Your email has been updated.');
      } catch (err) {
        setState('error');
        setMessage(err instanceof ApiError ? err.message : 'This confirmation link is invalid or has expired.');
      }
    })();
  }, [token]);

  return (
    <AuthShell
      title={state === 'ok' ? 'Email updated' : state === 'error' ? 'Confirmation failed' : 'Confirming…'}
      footer={<Link to="/">Go to DINA</Link>}
    >
      {state === 'working' && (
        <div className="auth-gate" role="status" aria-live="polite">
          <span className="spinner" aria-hidden />
          <span className="muted">Applying your new email…</span>
        </div>
      )}
      {state === 'ok' && <p className="auth-notice">{message}</p>}
      {state === 'error' && <p className="auth-error">{message}</p>}
    </AuthShell>
  );
}
