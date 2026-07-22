// ============================================================================
// useAsync — run an abortable async task tied to component lifecycle
// ============================================================================
// Every network read in the app goes through this so we get consistent
// loading/error state, automatic cancellation on unmount or dependency change
// (no setState-after-unmount, no races between overlapping requests), and a
// manual refetch. Separation of concerns: components describe *what* to fetch;
// this owns *how* it's run safely.

import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../lib/apiClient';

export interface AsyncState<T> {
  data: T | null;
  error: ApiError | Error | null;
  loading: boolean;
  refetch: () => void;
}

export function useAsync<T>(
  task: (signal: AbortSignal) => Promise<T>,
  deps: readonly unknown[],
): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | Error | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [nonce, setNonce] = useState(0);
  // Keep the latest task without retriggering the effect on every render.
  const taskRef = useRef(task);
  taskRef.current = task;

  const refetch = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    const ctrl = new AbortController();
    let active = true;
    setLoading(true);
    setError(null);
    taskRef
      .current(ctrl.signal)
      .then((result) => {
        if (active) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!active || ctrl.signal.aborted) return; // cancelled — ignore
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      });
    return () => {
      active = false;
      ctrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  return { data, error, loading, refetch };
}
