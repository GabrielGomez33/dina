import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { RouteError } from './components/RouteError';
import { HomePage } from './pages/HomePage';
import { DigimPage } from './pages/DigimPage';
import { NotFound } from './pages/NotFound';

// Served under a base path (/dina) in production; Vite exposes it as BASE_URL
// ('/dina/'). React Router's basename must match (no trailing slash) so links
// and browser history resolve under the same prefix as the deployed assets.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

// A single place that declares the app's pages. New DINA modules become new
// routes here; the Layout renders the shared shell (nav + theme) around them.
export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <Layout />,
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
