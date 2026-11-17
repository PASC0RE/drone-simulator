import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import SimulatorCanvas from '../features/simulator/SimulatorCanvas.jsx';
import NotFoundPage from './NotFoundPage.jsx';
import { LangToggle } from '../components/SiteLayout.jsx';
import { useDrone, useDrones } from '../features/catalog/hooks/useDrones.js';
import { useSimulatorStore } from '../features/simulator/store/simulatorStore.js';
import { useT } from '../i18n/index.js';

function Toolbar({ drone, drones, mode }) {
  const t = useT();
  const navigate = useNavigate();
  const base = mode === 'challenge' ? 'challenge' : 'simulator';

  return (
    <div className="sim-toolbar panel">
      <Link to="/" className="tb-link">{t('tb.home')}</Link>
      <Link to={`/drones/${drone.id}`} className="tb-link">{t('tb.details')}</Link>
      <label className="tb-switch">
        <span>{t('tb.drone')}</span>
        <select
          value={drone.id}
          onChange={(e) => {
            // give the keyboard back to the simulator, otherwise Space/arrows would change this list
            e.target.blur();
            navigate(`/${base}/${e.target.value}`);
          }}
        >
          {drones.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </label>
      <div className="tb-modes" role="group">
        <Link to={`/simulator/${drone.id}`} aria-current={mode === 'free' ? 'page' : undefined} className={mode === 'free' ? 'on' : ''}>{t('tb.free')}</Link>
        <Link to={`/challenge/${drone.id}`} aria-current={mode === 'challenge' ? 'page' : undefined} className={mode === 'challenge' ? 'on' : ''}>{t('tb.race')}</Link>
      </div>
      <LangToggle className="small" />
    </div>
  );
}

export default function SimulatorPage({ mode = 'free' }) {
  const t = useT();
  const { id } = useParams();
  const { status, drone, error } = useDrone(id);
  const { drones } = useDrones();

  // the simulator needs the whole window and handles the keyboard itself
  useEffect(() => {
    document.body.classList.add('sim-mode');
    return () => document.body.classList.remove('sim-mode');
  }, []);

  // a new drone or mode starts from a clean slate: no old route or mission
  useEffect(() => {
    useSimulatorStore.getState().resetWaypoints?.();
  }, [id, mode]);

  if (status === 'missing') return <NotFoundPage what="drone" />;
  if (status === 'loading' || !drone) return <div className="fullscreen-msg" role="status">{t('sim.loading')}</div>;

  return (
    <SimulatorCanvas
      key={`${mode}-${drone.id}`}
      mode={mode}
      drone={drone}
      apiWarning={status === 'offline' ? t('sim.offline', { err: error }) : null}
      toolbar={<Toolbar drone={drone} drones={drones.length ? drones : [drone]} mode={mode} />}
    />
  );
}
