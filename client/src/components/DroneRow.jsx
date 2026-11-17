import { Link } from 'react-router-dom';
import DroneThumb from './DroneThumb.jsx';
import SpecBars from './SpecBars.jsx';
import { categoryOf, classBlurb, classLabel, typeLabel } from '../features/catalog/lib/droneInfo.js';
import { useT } from '../i18n/index.js';

export default function DroneRow({ drone, scale }) {
  const t = useT();
  const key = categoryOf(drone);
  return (
    <li className="drone-row">
      <Link to={`/drones/${drone.id}`} className="row-thumb" aria-label={t('aria.details', { name: drone.name })}>
        <DroneThumb drone={drone} size={84} />
      </Link>
      <div className="row-main">
        <h3>
          <Link to={`/drones/${drone.id}`}>{drone.name}</Link>
        </h3>
        <p className="row-meta">
          {t('row.meta', { cls: classLabel(key), type: typeLabel(drone).toLocaleLowerCase(), blurb: classBlurb(key) })}
        </p>
      </div>
      <SpecBars drone={drone} scale={scale} />
      <div className="row-actions">
        <Link className="btn primary" to={`/simulator/${drone.id}`}>{t('btn.fly')}</Link>
        <Link className="btn ghost" to={`/challenge/${drone.id}`}>{t('btn.race')}</Link>
        <Link className="btn ghost" to={`/drones/${drone.id}`}>{t('btn.details')}</Link>
      </div>
    </li>
  );
}
