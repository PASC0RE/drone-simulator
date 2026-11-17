import { useSimulatorStore } from '../store/simulatorStore.js';

const CARDINALS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const cardinal = (deg) => CARDINALS[Math.round(deg / 45) % 8];
const signed = (v, digits = 0) => `${v >= 0 ? '+' : ''}${v.toFixed(digits)}`;

function Gauge({ label, value, unit, tone = '' }) {
  return (
    <div className={`gauge ${tone}`}>
      <div className="gauge-label">{label}</div>
      <div className="gauge-value">
        {value}
        <span className="gauge-unit">{unit}</span>
      </div>
    </div>
  );
}

export default function FlightHUD({ maxSpeedMs }) {
  const t = useSimulatorStore((s) => s.telemetry);
  const assist = useSimulatorStore((s) => s.assist);
  const cameraMode = useSimulatorStore((s) => s.cameraMode);
  const mission = useSimulatorStore((s) => s.missionStatus);
  const waypointCount = useSimulatorStore((s) => s.waypoints.length);
  const nextWaypoint = useSimulatorStore((s) => s.missionProgress.nextWaypoint);

  const batteryTone = t.battery <= 10 ? 'danger' : t.battery <= 20 ? 'warn' : '';
  const speedTone = maxSpeedMs && t.speed > maxSpeedMs * 0.95 ? 'warn' : '';

  let banner = null;
  if (t.status === 'CRASHED') {
    banner = { tone: 'danger', text: `CRASHED: ${t.crashReason || 'impact'}. Press R to reset` };
  } else if (!t.motorsOn) {
    banner = { tone: 'danger', text: 'BATTERY DEPLETED: motors off. Press R to reset' };
  } else if (t.battery <= 20) {
    banner = { tone: 'warn', text: `LOW BATTERY: ${t.battery.toFixed(0)}%. Land soon` };
  } else if (mission === 'running') {
    banner = { tone: 'info', text: `AUTOPILOT: flying to waypoint ${Math.max(nextWaypoint, 0) + 1} of ${waypointCount}` };
  } else if (mission === 'paused') {
    banner = { tone: 'warn', text: 'AUTOPILOT PAUSED: holding position' };
  } else if (mission === 'complete') {
    banner = { tone: 'info', text: 'MISSION COMPLETE: hovering at the last waypoint' };
  } else if (t.status === 'LANDED' && t.altitude < 0.3) {
    banner = { tone: 'info', text: 'Hold Space or ↑ to take off' };
  }

  return (
    <>
      {banner && <div className={`hud-banner ${banner.tone}`}>{banner.text}</div>}

      <div className="hud-bottom">
        <div className="hud-main">
          <Gauge label="GROUND SPEED" value={t.speed.toFixed(1)} unit=" m/s" tone={speedTone} />
          <Gauge label="ALTITUDE" value={t.altitude.toFixed(1)} unit=" m" />
          <Gauge
            label="HEADING"
            value={`${Math.round(t.heading).toString().padStart(3, '0')}°`}
            unit={` ${cardinal(t.heading)}`}
          />
          <div className={`gauge battery ${batteryTone}`}>
            <div className="gauge-label">BATTERY</div>
            <div className="gauge-value">
              {t.battery.toFixed(0)}
              <span className="gauge-unit"> %</span>
            </div>
            <div className="bar">
              <div className="bar-fill" style={{ width: `${t.battery}%` }} />
            </div>
          </div>
        </div>

        <div className="hud-sub">
          <span>V/S {signed(t.verticalSpeed, 1)} m/s</span>
          <span>PITCH {signed(t.pitchDeg)}°</span>
          <span>ROLL {signed(t.rollDeg)}°</span>
          <span>THRUST {t.thrustPct.toFixed(0)}%</span>
          <span className={`mode ${assist ? 'on' : 'off'}`}>
            {mission === 'running' ? 'AUTOPILOT' : assist ? 'ALT HOLD' : 'MANUAL'} (H)
          </span>
          <span>CAM {cameraMode.toUpperCase()} (C)</span>
          <span>{t.status}</span>
        </div>
      </div>
    </>
  );
}
