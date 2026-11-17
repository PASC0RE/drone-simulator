import { useEffect, useState } from 'react';
import { fetchDrone, fetchDrones } from '../api/droneApi.js';
import { FALLBACK_DRONES } from '../data/fallbackDrones.js';

// One cache for the whole session, so moving between pages does not refetch.
let cache = null;

/**
 * status: 'loading' | 'ready' | 'offline'
 * 'offline' means the API could not be reached and the built-in copy is shown.
 */
export function useDrones() {
  const [state, setState] = useState(
    cache ? { status: 'ready', drones: cache, error: null } : { status: 'loading', drones: [], error: null }
  );

  useEffect(() => {
    if (cache) return undefined;
    const controller = new AbortController();

    fetchDrones(controller.signal)
      .then((drones) => {
        cache = drones;
        setState({ status: 'ready', drones, error: null });
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setState({ status: 'offline', drones: FALLBACK_DRONES, error: err.message });
      });

    return () => controller.abort();
  }, []);

  return state;
}

export function useDrone(id) {
  const [state, setState] = useState({ status: 'loading', drone: null, error: null });

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading', drone: null, error: null });

    const fromCache = cache?.find((d) => String(d.id) === String(id));
    if (fromCache) {
      setState({ status: 'ready', drone: fromCache, error: null });
      return undefined;
    }

    fetchDrone(id, controller.signal)
      .then((drone) => setState({ status: 'ready', drone, error: null }))
      .catch((err) => {
        if (err.name === 'AbortError') return;
        if (err.status === 404) {
          setState({ status: 'missing', drone: null, error: err.message });
          return;
        }
        const local = FALLBACK_DRONES.find((d) => String(d.id) === String(id));
        if (local) setState({ status: 'offline', drone: local, error: err.message });
        else setState({ status: 'missing', drone: null, error: err.message });
      });

    return () => controller.abort();
  }, [id]);

  return state;
}
