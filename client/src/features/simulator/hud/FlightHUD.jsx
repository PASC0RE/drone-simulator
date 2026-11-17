import { useSimulatorStore } from '../store/simulatorStore.js';
import { useT } from '../../../i18n/index.js';

const CARDINALS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const cardinalKey = (deg) => CARDINALS[Math.round(deg / 45) % 8];
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

export default function FlightHUD({ maxSpeedMs, challenge = false }) {
  const tr = useT();
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
    banner = { tone: 'danger', text: tr('hud.crashed', { reason: t.crashReason ? tr(t.crashReason) : tr('hud.impact') }) };
  } else if (!t.motorsOn) {
    banner = { tone: 'danger', text: tr('hud.depleted') };
  } else if (t.battery <= 20) {
    banner = { tone: 'warn', text: tr('hud.low', { n: t.battery.toFixed(0) }) };
  } else if (mission === 'running') {
    banner = { tone: 'info', text: tr('hud.apRunning', { a: Math.max(nextWaypoint, 0) + 1, b: waypointCount }) };
  } else if (mission === 'paused') {
    banner = { tone: 'warn', text: tr('hud.apPaused') };
  } else if (mission === 'complete') {
    banner = { tone: 'info', text: tr('hud.apDone') };
  } else if (t.status === 'LANDED' && t.altitude < 0.3) {
    banner = { tone: 'info', text: challenge ? tr('ch.ready') : tr('hud.takeoff') };
  }

  return (
    <>
      {banner && <div className={`hud-banner ${banner.tone}`}>{banner.text}</div>}

      <div className="hud-bottom">
        <div className="hud-main">
          <Gauge label={tr('hud.speed')} value={t.speed.toFixed(1)} unit={` ${tr('u.ms')}`} tone={speedTone} />
          <Gauge label={tr('hud.alt')} value={t.altitude.toFixed(1)} unit={` ${tr('u.m')}`} />
          <Gauge
            label={tr('hud.heading')}
            value={`${Math.round(t.heading).toString().padStart(3, '0')}°`}
            unit={` ${tr(cardinalKey(t.heading))}`}
          />
          <div className={`gauge battery ${batteryTone}`}>
            <div className="gauge-label">{tr('hud.battery')}</div>
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
          <span>{tr('hud.vs')} {signed(t.verticalSpeed, 1)} {tr('u.ms')}</span>
          <span>{tr('hud.pitch')} {signed(t.pitchDeg)}°</span>
          <span>{tr('hud.roll')} {signed(t.rollDeg)}°</span>
          <span>{tr('hud.thrust')} {t.thrustPct.toFixed(0)}%</span>
          <span className={`mode ${assist ? 'on' : 'off'}`}>
            {mission === 'running' ? tr('hud.autopilot') : assist ? tr('hud.althold') : tr('hud.manual')} (H)
          </span>
          <span>{tr('hud.cam')} {cameraMode === 'chase' ? tr('hud.chase') : tr('hud.orbit')} (C)</span>
          <span>{tr(`st.${t.status}`)}</span>
        </div>
      </div>
    </>
  );
}
