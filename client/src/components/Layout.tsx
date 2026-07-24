import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ErrorBoundary } from './ErrorBoundary';
import { MODULES } from '../lib/modules';
import { APP_NAME } from '../lib/apiConfig';
import { applyTheme, initTheme, type Theme } from '../lib/theme';
import { useAuth } from '../auth/AuthContext';

// The shared console shell: a persistent left rail of DINA modules + a theme
// toggle, with the active page rendered in the main area inside an error
// boundary so a page crash can't blank the whole app.
export function Layout() {
  const [theme, setTheme] = useState<Theme>(() => initTheme());
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const toggleTheme = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    setTheme(next);
  };

  const onLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const initial = (user?.username || user?.email || '?').charAt(0).toUpperCase();

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
              <span className="nav-glyph">⌂</span> <span className="nav-label">Overview</span>
            </NavLink>
          </li>
          {MODULES.map((m) => (
            <li key={m.key}>
              <NavLink
                to={m.path}
                className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
                aria-disabled={m.status === 'planned'}
                title={m.label}
                onClick={(e) => m.status === 'planned' && e.preventDefault()}
              >
                <span className="nav-glyph">{m.glyph}</span>
                <span className="nav-label">{m.label}</span>
                {m.status === 'planned' && <span className="soon">soon</span>}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="rail-foot">
          {user && (
            <div className="rail-user" title={user.email}>
              <span className="avatar" aria-hidden>
                {initial}
              </span>
              <span className="rail-user-meta">
                <span className="rail-user-name">{user.username || user.email}</span>
                {!user.emailVerified && <span className="rail-user-note">Unverified email</span>}
              </span>
            </div>
          )}
          <div className="rail-actions">
            <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle color theme" title="Toggle theme">
              {theme === 'dark' ? '☀' : '☾'}
            </button>
            {user && (
              <button className="btn small" onClick={onLogout} title="Sign out">
                Sign out
              </button>
            )}
          </div>
        </div>
      </nav>
      <main className="stage">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
}
