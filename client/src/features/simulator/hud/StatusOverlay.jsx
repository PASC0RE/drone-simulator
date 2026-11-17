const LABELS = {
  loading: 'Loading model…',
  ready: 'Model loaded',
  fallback: 'Placeholder drone',
};

export default function StatusOverlay({
  droneName,
  specs,
  modelStatus,
  modelError,
  apiWarning,
  onRetry,
}) {
  return (
    <div className="overlay-top">
      <div className="panel">
        <h1>{droneName}</h1>
        {specs && (
          <div>
            <small>
              {specs.weight} kg · {specs.maxSpeed} km/h · {specs.batteryLife} min
            </small>
          </div>
        )}
        <span className={`badge ${modelStatus}`}>{LABELS[modelStatus]}</span>
      </div>

      {apiWarning && (
        <div className="panel warn">
          <strong>API problem</strong>
          <p>{apiWarning}</p>
        </div>
      )}

      {modelStatus === 'fallback' && modelError && (
        <div className="panel warn">
          <strong>Could not load the 3D model</strong>
          <p>{modelError}</p>
          {onRetry && <button onClick={onRetry}>Retry</button>}
        </div>
      )}
    </div>
  );
}
