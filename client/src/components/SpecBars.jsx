import { barsOf, kg, mins } from '../features/catalog/lib/droneInfo.js';
import { useT } from '../i18n/index.js';

// Four bars that show where a drone sits compared with the other drones in the list.
export default function SpecBars({ drone, scale }) {
  const t = useT();
  const b = barsOf(drone, scale);
  const rows = [
    [t('spec.speed'), b.speed, `${drone.maxSpeed} ${t('u.kmh')}`],
    [t('spec.battery'), b.battery, mins(drone.batteryLife)],
    [t('spec.agility'), b.agility, null],
    [t('spec.weight'), b.weight, kg(drone.weight)],
  ];
  return (
    <dl className="bars">
      {rows.map(([name, v, text]) => (
        <div className="bar-row" key={name}>
          <dt>{name}</dt>
          <dd>
            <span className="meter" aria-hidden="true">
              <span style={{ width: `${Math.max(4, Math.round(v * 100))}%` }} />
            </span>
            <span className="bar-text">{text ?? (v > 0.66 ? t('lvl.high') : v > 0.33 ? t('lvl.medium') : t('lvl.low'))}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
