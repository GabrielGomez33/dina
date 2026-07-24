import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { RouteError } from './components/RouteError';
import { HomePage } from './pages/HomePage';
import { DigimPage } from './pages/DigimPage';
import { NotFound } from './pages/NotFound';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage';
import { ConfirmEmailChangePage } from './pages/auth/ConfirmEmailChangePage';

// Served under a base path (/dina) in production; Vite exposes it as BASE_URL
// ('/dina/'). React Router's basename must match (no trailing slash) so links
// and browser history resolve under the same prefix as the deployed assets.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

// Two route groups:
//   - Standalone auth pages (no app shell), reachable while signed out.
//   - The console (Layout + modules), gated behind ProtectedRoute so the whole
//     DINA workspace requires a signed-in user. Anonymous hits bounce to /login
//     with ?next= preserved.
export const router = createBrowserRouter(
  [
    { path: '/login', element: <LoginPage />, errorElement: <RouteError /> },
    { path: '/signup', element: <SignupPage />, errorElement: <RouteError /> },
    { path: '/forgot-password', element: <ForgotPasswordPage />, errorElement: <RouteError /> },
    { path: '/reset-password', element: <ResetPasswordPage />, errorElement: <RouteError /> },
    { path: '/verify-email', element: <VerifyEmailPage />, errorElement: <RouteError /> },
    { path: '/confirm-email-change', element: <ConfirmEmailChangePage />, errorElement: <RouteError /> },
    {
      path: '/',
      element: (
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      ),
      errorElement: <RouteError />,
      children: [
        { index: true, element: <HomePage /> },
        { path: 'digim', element: <DigimPage /> },
        { path: 'digim/:researchId', element: <DigimPage /> },
        { path: '404', element: <NotFound /> },
        { path: '*', element: <Navigate to="/404" replace /> },
      ],
    },
  ],
  { basename },
);
