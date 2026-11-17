import { useT } from '../../../i18n/index.js';
import { kg, mins } from '../../catalog/lib/droneInfo.js';

const BADGE = { loading: 'badge.loading', ready: 'badge.ready', fallback: 'badge.fallback' };

export default function StatusOverlay({ droneName, specs, modelStatus, modelError, apiWarning, onRetry }) {
  const t = useT();
  return (
    <div className="overlay-top">
      <div className="panel">
        <h1>{droneName}</h1>
        {specs && (
          <div>
            <small>
              {kg(specs.weight)} · {specs.maxSpeed} {t('u.kmh')} · {mins(specs.batteryLife)}
            </small>
          </div>
        )}
        <span className={`badge ${modelStatus}`}>{t(BADGE[modelStatus])}</span>
      </div>

      {apiWarning && (
        <div className="panel warn">
          <strong>{t('sim.apiProblem')}</strong>
          <p>{apiWarning}</p>
        </div>
      )}

      {modelStatus === 'fallback' && modelError && (
        <div className="panel">
          <small>{t('sim.model')}</small>
          {onRetry && (
            <div style={{ marginTop: 6 }}>
              <button onClick={onRetry} title={modelError}>{t('sim.retryModel')}</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
