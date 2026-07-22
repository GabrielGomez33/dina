import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="page">
      <div className="panel error-panel">
        <h2>Not found</h2>
        <p className="muted">That view doesn't exist.</p>
        <Link className="btn" to="/">
          Back to console
        </Link>
      </div>
    </div>
  );
}
