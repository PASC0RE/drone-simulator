import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SiteHeader, SiteFooter } from '../components/SiteLayout.jsx';
import DroneThumb from '../components/DroneThumb.jsx';
import DroneRow from '../components/DroneRow.jsx';
import Notice from '../components/Notice.jsx';
import ModelErrorBoundary from '../features/simulator/entities/ModelErrorBoundary.jsx';
import { useDrones } from '../features/catalog/hooks/useDrones.js';
import { scaleOf, shortName, flightProfile, mins } from '../features/catalog/lib/droneInfo.js';
import { useT } from '../i18n/index.js';

const HeroScene = lazy(() => import('../components/HeroScene.jsx'));

export default function LandingPage() {
  const t = useT();
  const { status, drones, error } = useDrones();
  const [pickedId, setPickedId] = useState(null);
  const [canDraw, setCanDraw] = useState(false);
  useEffect(() => setCanDraw(true), []); // 3D only in the browser

  const picked = useMemo(() => drones.find((d) => d.id === pickedId) ?? drones[0] ?? null, [drones, pickedId]);
  const scale = useMemo(() => scaleOf(drones), [drones]);
  const profile = picked ? flightProfile(picked) : null;

  return (
    <>
      <SiteHeader overHero />

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-scene" aria-hidden="true">
          {canDraw && picked && (
            <ModelErrorBoundary fallback={null}>
              <Suspense fallback={null}>
                <HeroScene drone={picked} />
              </Suspense>
            </ModelErrorBoundary>
          )}
        </div>
        <div className="hero-scrim" />

        <div className="hero-copy">
          <h1 id="hero-title">
            {t('home.title1')}
            <br />
            {t('home.title2')}
          </h1>
          <p>{t('home.lead', { n: drones.length || '' })}</p>
          {picked && (
            <div className="hero-cta">
              <Link className="btn primary large" to={`/simulator/${picked.id}`}>
                {t('home.fly', { name: shortName(picked) })}
              </Link>
              <Link className="btn ghost large" to={`/challenge/${picked.id}`}>{t('home.race')}</Link>
              <Link className="btn ghost large" to="/drones">{t('home.compare')}</Link>
            </div>
          )}
        </div>

        {picked && (
          <div className="hero-picker">
            <div className="picked-info" aria-live="polite">
              <strong>{picked.name}</strong>
              <span>
                {t('home.picked', {
                  speed: picked.maxSpeed,
                  battery: mins(picked.batteryLife),
                  lift: profile.powerRatio,
                })}
              </span>
            </div>
            <ul className="chips" aria-label={t('home.pickAria')}>
              {drones.map((d) => (
                <li key={d.id}>
                  <button
                    type="button"
                    className={`chip ${d.id === picked.id ? 'on' : ''}`}
                    aria-pressed={d.id === picked.id}
                    onClick={() => setPickedId(d.id)}
                  >
                    <DroneThumb drone={d} size={40} label="" />
                    <span>{shortName(d)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {status === 'loading' && <p className="hero-loading" role="status">{t('home.loading')}</p>}
      </section>

      <main>
        <section className="band" aria-labelledby="fleet-title">
          <div className="band-head">
            <h2 id="fleet-title">{t('home.fleet')}</h2>
            <p>{t('home.fleetLead')}</p>
          </div>
          <Notice status={status} error={error} />
          <ul className="drone-list">
            {drones.slice(0, 5).map((d) => (
              <DroneRow key={d.id} drone={d} scale={scale} />
            ))}
          </ul>
          <p className="more">
            <Link className="btn ghost" to="/drones">{t('home.seeAll', { n: drones.length })}</Link>
          </p>
        </section>

        <section className="band tinted" aria-labelledby="features-title">
          <div className="band-head">
            <h2 id="features-title">{t('home.featuresTitle')}</h2>
          </div>
          <dl className="features">
            {['f1', 'f2', 'f3', 'f4'].map((k) => (
              <div key={k}>
                <dt>{t(`home.${k}t`)}</dt>
                <dd>{t(`home.${k}d`)}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="band" aria-labelledby="steps-title">
          <div className="band-head">
            <h2 id="steps-title">{t('home.stepsTitle')}</h2>
          </div>
          <ol className="steps">
            {['s1', 's2', 's3'].map((k) => (
              <li key={k}>
                <h3>{t(`home.${k}t`)}</h3>
                <p>{t(`home.${k}d`)}</p>
              </li>
            ))}
          </ol>
          <p className="more">
            <Link className="btn primary large" to={picked ? `/simulator/${picked.id}` : '/simulator/1'}>{t('home.openSim')}</Link>
            <Link className="btn ghost large" to="/how-to-fly">{t('home.learn')}</Link>
          </p>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
