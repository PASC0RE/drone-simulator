import { useEffect, useState } from 'react';
import SimulatorCanvas from './features/simulator/SimulatorCanvas.jsx';
import { fetchDrone } from './features/catalog/api/droneApi.js';

// Phase 3 has no router yet: choose the drone with  http://localhost:5173/?id=2
const droneId = new URLSearchParams(window.location.search).get('id') || '1';

export default function App() {
  const [drone, setDrone] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    fetchDrone(droneId, controller.signal)
      .then((data) => {
        setDrone(data);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setApiError(err.message);
        setLoading(false);
      });

    return () => controller.abort();
  }, []);

  if (loading) {
    return <div className="fullscreen-msg">Loading drone data…</div>;
  }

  return (
    <SimulatorCanvas
      droneName={drone?.name ?? 'Unknown drone'}
      modelUrl={drone?.modelUrl ?? null}
      apiWarning={apiError ? `Could not reach the API: ${apiError}` : null}
    />
  );
}
