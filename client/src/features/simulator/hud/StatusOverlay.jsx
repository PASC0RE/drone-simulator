const LABELS = {
  loading: 'Loading model…',
  ready: 'Model loaded',
  fallback: 'Placeholder drone',
};

export default function StatusOverlay({
  droneName,
  modelStatus,
  modelError,
  apiWarning,
  autopilot,
  onToggleAutopilot,
  onRetry,
}) {
  return (
    <div className="overlay-top">
      <div className="panel">
        <h1>{droneName}</h1>
        <span className={`badge ${modelStatus}`}>{LABELS[modelStatus]}</span>
        <div className="row" style={{ marginTop: 8 }}>
          <button onClick={onToggleAutopilot}>
            {autopilot ? 'Pause demo flight' : 'Resume demo flight'}
          </button>
        </div>
        <small>Phase 3: demo flight only. Keyboard controls come next.</small>
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
