import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { SiteHeader, SiteFooter } from '../components/SiteLayout.jsx';
import DroneThumb from '../components/DroneThumb.jsx';
import SpecBars from '../components/SpecBars.jsx';
import Notice from '../components/Notice.jsx';
import ModelErrorBoundary from '../features/simulator/entities/ModelErrorBoundary.jsx';
import NotFoundPage from './NotFoundPage.jsx';
import { useDrone, useDrones } from '../features/catalog/hooks/useDrones.js';
import {
  categoryOf, classLabel, flightProfile, scaleOf, typeLabel, kg, mins, shortName,
} from '../features/catalog/lib/droneInfo.js';
import { descriptionOf } from '../features/catalog/data/droneText.js';
import { useT } from '../i18n/index.js';

const HeroScene = lazy(() => import('../components/HeroScene.jsx'));

// Plain-language reading of the numbers, so a first-time visitor knows what to expect.
function feel(p, drone, t) {
  const out = [];
  if (p.response >= 8) out.push(t('feel.quick'));
  else if (p.response <= 5.5) out.push(t('feel.slow'));
  else out.push(t('feel.balanced'));

  if (drone.weight >= 15) out.push(t('feel.longStop'));
  else if (drone.weight <= 1) out.push(t('feel.stops'));

  if (drone.batteryLife <= 12) out.push(t('feel.shortBat'));
  else if (drone.batteryLife >= 50) out.push(t('feel.longBat'));
  return out;
}

export default function DroneDetailPage() {
  const t = useT();
  const { id } = useParams();
  const one = useDrone(id);
  const all = useDrones();
  const [canDraw, setCanDraw] = useState(false);
  useEffect(() => setCanDraw(true), []);

  const drone = one.drone;
  const scale = useMemo(() => scaleOf(all.drones.length ? all.drones : drone ? [drone] : []), [all.drones, drone]);

  if (one.status === 'missing') return <NotFoundPage what="drone" />;
  if (one.status === 'loading' || !drone) {
    return (
      <>
        <SiteHeader />
        <main className="page"><p className="empty" role="status">{t('det.loading')}</p></main>
      </>
    );
  }

  const p = flightProfile(drone);
  const list = all.drones;
  const index = list.findIndex((d) => d.id === drone.id);
  const prev = index > 0 ? list[index - 1] : null;
  const next = index >= 0 && index < list.length - 1 ? list[index + 1] : null;

  return (
    <>
      <SiteHeader />
      <main className="page detail">
        <nav className="crumbs" aria-label={t('det.crumbs')}>
          <Link to="/drones">{t('nav.drones')}</Link> / <span>{shortName(drone)}</span>
        </nav>
        <Notice status={one.status} error={one.error} />

        <div className="detail-top">
          <div className="detail-view">
            {canDraw ? (
              <ModelErrorBoundary fallback={<DroneThumb drone={drone} size={220} />}>
                <Suspense fallback={<DroneThumb drone={drone} size={220} />}>
                  <HeroScene drone={drone} close />
                </Suspense>
              </ModelErrorBoundary>
            ) : (
              <DroneThumb drone={drone} size={220} />
            )}
          </div>

          <div className="detail-info">
            <p className="tagline">
              {t('det.tagline', { cls: classLabel(categoryOf(drone)), type: typeLabel(drone).toLocaleLowerCase() })}
            </p>
            <h1>{drone.name}</h1>
            <p className="lead">{descriptionOf(drone)}</p>
            <div className="hero-cta">
              <Link className="btn primary large" to={`/simulator/${drone.id}`}>{t('det.fly', { name: shortName(drone) })}</Link>
              <Link className="btn ghost large" to={`/challenge/${drone.id}`}>{t('det.race')}</Link>
              <Link className="btn ghost large" to="/drones">{t('det.back')}</Link>
            </div>
          </div>
        </div>

        <div className="detail-cols">
          <section aria-labelledby="specs-title">
            <h2 id="specs-title">{t('det.specs')}</h2>
            <table className="spec-table">
              <tbody>
                <tr><th scope="row">{t('det.weight')}</th><td>{kg(drone.weight)}</td></tr>
                <tr><th scope="row">{t('det.top')}</th><td>{drone.maxSpeed} {t('u.kmh')}</td></tr>
                <tr><th scope="row">{t('det.batt')}</th><td>{mins(drone.batteryLife)}</td></tr>
                <tr><th scope="row">{t('det.type')}</th><td>{typeLabel(drone)}</td></tr>
              </tbody>
            </table>
            <h3>{t('det.compare')}</h3>
            <SpecBars drone={drone} scale={scale} />
          </section>

          <section aria-labelledby="flight-title">
            <h2 id="flight-title">{t('det.flies')}</h2>
            <p className="lead small">{t('det.feel', { list: feel(p, drone, t).join(', ') })}</p>
            <table className="spec-table">
              <tbody>
                <tr><th scope="row">{t('det.lift')}</th><td>{p.powerRatio}×</td></tr>
                <tr><th scope="row">{t('det.climb')}</th><td>{p.climbMs} {t('u.ms')}</td></tr>
                <tr><th scope="row">{t('det.tilt')}</th><td>{p.tiltDeg}°</td></tr>
                <tr><th scope="row">{t('det.turn')}</th><td>{p.turnDegS}°/{t('u.s')}</td></tr>
              </tbody>
            </table>
            <p className="fine">{t('det.note')}</p>
          </section>
        </div>

        <nav className="pager" aria-label={t('det.others')}>
          {prev ? <Link to={`/drones/${prev.id}`}>{t('det.prev', { name: shortName(prev) })}</Link> : <span />}
          {next ? <Link to={`/drones/${next.id}`}>{t('det.next', { name: shortName(next) })}</Link> : <span />}
        </nav>
      </main>
      <SiteFooter />
    </>
  );
}
