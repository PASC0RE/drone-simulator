import { useMemo } from 'react';
import { useSimulatorStore } from '../store/simulatorStore.js';
import { BUILDING_BOXES } from '../environment/layout.js';
import { findBlockedLegs } from '../physics/autopilot.js';
import { useT } from '../../../i18n/index.js';

const STATUS_KEY = {
  idle: 'mp.ready',
  running: 'mp.running',
  paused: 'mp.paused',
  complete: 'mp.complete',
  aborted: 'mp.aborted',
};

export default function MissionPanel() {
  const t = useT();
  const autopilot = useSimulatorStore((s) => s.autopilot);
  const waypoints = useSimulatorStore((s) => s.waypoints);
  const status = useSimulatorStore((s) => s.missionStatus);
  const message = useSimulatorStore((s) => s.missionMessage);
  const progress = useSimulatorStore((s) => s.missionProgress);
  const altitude = useSimulatorStore((s) => s.waypointAltitude);
  const act = useSimulatorStore.getState;

  const blocked = useMemo(() => findBlockedLegs(waypoints, BUILDING_BOXES), [waypoints]);

  if (!autopilot) {
    return (
      <div className="panel mission">
        <button className="primary" onClick={() => act().toggleAutopilot()}>
          {t('mp.open')}
        </button>
      </div>
    );
  }

  const running = status === 'running';
  const paused = status === 'paused';
  const active = running || paused;

  return (
    <div className="panel mission">
      <div className="mission-head">
        <strong>{t('mp.title')}</strong>
        <button onClick={() => act().toggleAutopilot()}>{t('mp.manual')}</button>
      </div>

      <div className={`mission-status ${status}`}>
        {t(STATUS_KEY[status])}
        {running && progress.nextWaypoint >= 0 && (
          <span> {t('mp.progress', { a: progress.nextWaypoint + 1, b: waypoints.length, m: progress.distance.toFixed(0) })}</span>
        )}
        {message && <div className="small">{t(message)}</div>}
      </div>

      {!active && (
        <label className="alt-row">
          {t('mp.alt', { n: altitude })}
          <input
            type="range" min="3" max="45" step="1" value={altitude}
            onChange={(e) => act().setWaypointAltitude(Number(e.target.value))}
          />
        </label>
      )}

      <div className="wp-help">
        {active ? t('mp.helpActive') : t('mp.helpIdle')}
      </div>

      <ol className="wp-list">
        {waypoints.length === 0 && <li className="empty">{t('mp.none')}</li>}
        {waypoints.map((w, i) => (
          <li key={w.id} className={status !== 'idle' && progress.nextWaypoint === i && running ? 'current' : ''}>
            <span>
              <b>{i + 1}</b> X {w.x.toFixed(1)} · Y {w.y.toFixed(0)} · Z {w.z.toFixed(1)}
            </span>
            {!active && <button className="x" title={t('mp.remove')} onClick={() => act().removeWaypoint(w.id)}>×</button>}
          </li>
        ))}
      </ol>

      {blocked.length > 0 && (
        <div className="wp-warn">
          {t('mp.blocked', { legs: blocked.map((i) => `${i + 1}→${i + 2}`).join(', ') })}
        </div>
      )}

      <div className="row">
        <button
          className="primary"
          disabled={running || waypoints.length === 0}
          onClick={() => act().startMission()}
        >
          {paused ? t('mp.resume') : status === 'complete' || status === 'aborted' ? t('mp.restart') : t('mp.start')}
        </button>
        <button disabled={!running} onClick={() => act().pauseMission()}>{t('mp.pause')}</button>
        <button disabled={waypoints.length === 0 && status === 'idle'} onClick={() => act().resetWaypoints()}>
          {t('mp.reset')}
        </button>
      </div>
    </div>
  );
}
