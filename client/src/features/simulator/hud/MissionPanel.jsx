import { useMemo } from 'react';
import { useSimulatorStore } from '../store/simulatorStore.js';
import { BUILDING_BOXES } from '../environment/layout.js';
import { findBlockedLegs } from '../physics/autopilot.js';

const STATUS_TEXT = {
  idle: 'Ready',
  running: 'Mission running',
  paused: 'Paused (holding position)',
  complete: 'Mission complete',
  aborted: 'Mission aborted',
};

export default function MissionPanel() {
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
          Autopilot mode (P)
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
        <strong>Autopilot</strong>
        <button onClick={() => act().toggleAutopilot()}>Manual (P)</button>
      </div>

      <div className={`mission-status ${status}`}>
        {STATUS_TEXT[status]}
        {running && progress.nextWaypoint >= 0 && (
          <span> → WP {progress.nextWaypoint + 1}/{waypoints.length} · {progress.distance.toFixed(0)} m</span>
        )}
        {message && <div className="small">{message}</div>}
      </div>

      {!active && (
        <label className="alt-row">
          New waypoint altitude: <b>{altitude} m</b>
          <input
            type="range" min="3" max="45" step="1" value={altitude}
            onChange={(e) => act().setWaypointAltitude(Number(e.target.value))}
          />
        </label>
      )}

      <div className="wp-help">
        {active ? 'Pause to take over / edit.' : 'Click on the ground to add a waypoint. Drag = camera.'}
      </div>

      <ol className="wp-list">
        {waypoints.length === 0 && <li className="empty">No waypoints yet</li>}
        {waypoints.map((w, i) => (
          <li key={w.id} className={status !== 'idle' && progress.nextWaypoint === i && running ? 'current' : ''}>
            <span>
              <b>{i + 1}</b> X {w.x.toFixed(1)} · Y {w.y.toFixed(0)} · Z {w.z.toFixed(1)}
            </span>
            {!active && <button className="x" title="Remove" onClick={() => act().removeWaypoint(w.id)}>×</button>}
          </li>
        ))}
      </ol>

      {blocked.length > 0 && (
        <div className="wp-warn">
          ⚠ Route {blocked.map((i) => `${i + 1}→${i + 2}`).join(', ')} passes through a building. Raise the altitude or move the points.
        </div>
      )}

      <div className="row">
        <button
          className="primary"
          disabled={running || waypoints.length === 0}
          onClick={() => act().startMission()}
        >
          {paused ? 'Resume' : status === 'complete' || status === 'aborted' ? 'Restart mission' : 'Start mission'}
        </button>
        <button disabled={!running} onClick={() => act().pauseMission()}>Pause</button>
        <button disabled={waypoints.length === 0 && status === 'idle'} onClick={() => act().resetWaypoints()}>
          Reset waypoints
        </button>
      </div>
    </div>
  );
}
