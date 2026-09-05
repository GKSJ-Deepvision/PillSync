import { useCallback, useEffect, useState } from 'react';

/**
 * Run an API call and expose `{ data, error, loading, reload }`.
 *
 * `fetcher` must be stable - wrap it in `useCallback` at the call site. That is
 * what makes the dependency explicit: the request re-runs exactly when the
 * values it closes over change, and never on an unrelated re-render.
 *
 * The `active` flag guards against setting state after unmount, which happens
 * routinely here: navigating away from a list while its request is in flight
 * would otherwise resurrect stale data on a screen that is already gone.
 */
export function useApi(fetcher) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;
    fetcher().then(
      (data) => {
        if (active) setState({ data, error: null, loading: false });
      },
      (error) => {
        if (active) setState({ data: null, error, loading: false });
      }
    );
    return () => {
      active = false;
    };
  }, [fetcher, reloadToken]);

  const reload = useCallback(() => {
    setState((current) => ({ ...current, loading: true, error: null }));
    setReloadToken((token) => token + 1);
  }, []);

  return { ...state, reload };
}

/**
 * Run a mutation on demand: `{ submit, submitting, error, reset }`.
 *
 * `submit` resolves to `{ ok, data | error }` rather than throwing, so a form
 * handler can branch on the result without a try/catch around every call.
 */
export function useMutation(mutator) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const submit = useCallback(
    async (...args) => {
      setSubmitting(true);
      setError(null);
      try {
        const data = await mutator(...args);
        return { ok: true, data };
      } catch (caught) {
        setError(caught);
        return { ok: false, error: caught };
      } finally {
        setSubmitting(false);
      }
    },
    [mutator]
  );

  const reset = useCallback(() => setError(null), []);

  return { submit, submitting, error, reset };
}

export default useApi;
