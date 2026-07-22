import { isRouteErrorResponse, useRouteError, Link } from 'react-router-dom';

// Rendered by the router when a route throws (navigation/loader/action). Keeps
// the failure contained and gives the user a way back.
export function RouteError() {
  const error = useRouteError();
  let title = 'Unexpected error';
  let detail = 'An unexpected error occurred while loading this view.';

  if (isRouteErrorResponse(error)) {
    title = `${error.status} ${error.statusText}`;
    detail = typeof error.data === 'string' ? error.data : detail;
  } else if (error instanceof Error) {
    detail = error.message;
  }

  return (
    <div className="route-error">
      <div className="panel error-panel" role="alert">
        <h2>{title}</h2>
        <p className="muted">{detail}</p>
        <Link className="btn" to="/">
          Back to console
        </Link>
      </div>
    </div>
  );
}
