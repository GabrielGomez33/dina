// Shared visual scaffold for the standalone auth pages (login/signup/etc.).
// A centered card on the app's charcoal surface, brand at the top. Kept
// presentational so each page owns only its form logic.
import type { ReactNode } from 'react';
import { APP_NAME } from '../../lib/apiConfig';

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand-mark">◆</span>
          <span className="brand-name">{APP_NAME}</span>
        </div>
        <h1 className="auth-title">{title}</h1>
        {subtitle && <p className="auth-subtitle muted">{subtitle}</p>}
        {children}
        {footer && <div className="auth-footer">{footer}</div>}
      </div>
    </div>
  );
}
