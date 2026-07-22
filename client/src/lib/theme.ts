// Theme persistence — stamps data-theme on <html> so tokens.css overrides the
// OS media query in both directions. Stored so the choice survives reloads.

export type Theme = 'light' | 'dark';
const KEY = 'dina-theme';

export function getStoredTheme(): Theme | null {
  const v = localStorage.getItem(KEY);
  return v === 'light' || v === 'dark' ? v : null;
}

export function systemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(KEY, theme);
}

export function initTheme(): Theme {
  const t = getStoredTheme() ?? systemTheme();
  document.documentElement.setAttribute('data-theme', t);
  return t;
}
