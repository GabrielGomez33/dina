import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { ErrorBoundary } from './ErrorBoundary';
import { MODULES } from '../lib/modules';
import { APP_NAME } from '../lib/apiConfig';
import { applyTheme, initTheme, type Theme } from '../lib/theme';

// The shared console shell: a persistent left rail of DINA modules + a theme
// toggle, with the active page rendered in the main area inside an error
// boundary so a page crash can't blank the whole app.
export function Layout() {
  const [theme, setTheme] = useState<Theme>(() => initTheme());

  const toggleTheme = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    setTheme(next);
  };

  return (
    <div className="shell">
      <nav className="rail" aria-label="DINA modules">
        <div className="brand">
          <span className="brand-mark">◆</span>
          <span className="brand-name">{APP_NAME}</span>
        </div>
        <ul className="rail-nav">
          <li>
            <NavLink to="/" end className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
              <span className="nav-glyph">⌂</span> Overview
            </NavLink>
          </li>
          {MODULES.map((m) => (
            <li key={m.key}>
              <NavLink
                to={m.path}
                className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
                aria-disabled={m.status === 'planned'}
                onClick={(e) => m.status === 'planned' && e.preventDefault()}
              >
                <span className="nav-glyph">{m.glyph}</span> {m.label}
                {m.status === 'planned' && <span className="soon">soon</span>}
              </NavLink>
            </li>
          ))}
        </ul>
        <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle color theme" title="Toggle theme">
          {theme === 'dark' ? '☀' : '☾'}
        </button>
      </nav>
      <main className="stage">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
}
