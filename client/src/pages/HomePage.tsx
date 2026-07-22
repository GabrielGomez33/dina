import { Link } from 'react-router-dom';
import { MODULES } from '../lib/modules';
import { APP_NAME } from '../lib/apiConfig';

// Landing overview — a grid of DINA modules. Live modules link in; planned ones
// read as forthcoming without being dead ends.
export function HomePage() {
  return (
    <div className="page">
      <header className="page-head">
        <h1>{APP_NAME} Console</h1>
        <p className="muted">One surface for DINA's intelligence modules.</p>
      </header>
      <div className="module-grid">
        {MODULES.map((m) => {
          const inner = (
            <>
              <span className="module-glyph">{m.glyph}</span>
              <span className="module-label">
                {m.label}
                {m.status === 'planned' && <span className="soon">soon</span>}
              </span>
              <span className="module-blurb">{m.blurb}</span>
            </>
          );
          return m.status === 'live' ? (
            <Link key={m.key} to={m.path} className="module-card">
              {inner}
            </Link>
          ) : (
            <div key={m.key} className="module-card disabled" aria-disabled>
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}
