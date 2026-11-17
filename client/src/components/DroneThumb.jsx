import { visualOf } from '../features/catalog/lib/droneInfo.js';
import { useT } from '../i18n/index.js';

// Top-down silhouette drawn from the drone's own look (rotor count, arm length, size).
export default function DroneThumb({ drone, size = 96, label }) {
  const t = useT();
  const v = visualOf(drone);
  const c = 50;
  const k = 30 / 1.2; // metres -> svg units, so the biggest arm fits the box
  const arm = v.arm * k;
  const r = Math.max(5, v.rotorR * k);
  const body = Math.max(7, v.body * k * 0.9);
  const n = v.rotors;

  let rotors = [];
  if (n === 4) {
    const a = arm * 0.7;
    rotors = [[a, a], [-a, a], [a, -a], [-a, -a]];
  } else if (n > 0) {
    rotors = Array.from({ length: n }, (_, i) => {
      const th = (i / n) * Math.PI * 2 + Math.PI / n;
      return [Math.cos(th) * arm, Math.sin(th) * arm];
    });
  }

  return (
    <svg
      className="thumb"
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={label ?? t('aria.thumb', { name: drone.name })}
    >
      {n === 0 ? (
        <g>
          <rect x={c - 36} y={c - 6} width="72" height="12" rx="3" fill={v.color} />
          <rect x={c - 4} y={c - 30} width="8" height="56" rx="4" fill={v.color} />
          <rect x={c - 14} y={c + 18} width="28" height="5" rx="2" fill="currentColor" opacity=".6" />
          <circle cx={c} cy={c + 28} r="5" fill="none" stroke="currentColor" opacity=".5" />
        </g>
      ) : (
        <g>
          {rotors.map(([x, z], i) => (
            <line key={`a${i}`} x1={c} y1={c} x2={c + x} y2={c + z} stroke="currentColor" strokeWidth="2.5" opacity=".7" />
          ))}
          {rotors.map(([x, z], i) => (
            <circle key={i} cx={c + x} cy={c + z} r={r} fill="currentColor" opacity=".16" stroke="currentColor" strokeWidth="1" />
          ))}
          <rect x={c - body / 2} y={c - body / 2} width={body} height={body} rx="3" fill={v.color} />
          <rect x={c - 2.5} y={c - body / 2 - 3} width="5" height="3.5" rx="1" fill="#E74C3C" />
        </g>
      )}
    </svg>
  );
}
