import { useEffect, useRef, useState } from 'react';
import { useChallengeStore } from './challengeStore.js';
import { starsOf } from './course.js';
import { useSimulatorStore } from '../simulator/store/simulatorStore.js';
import { useT } from '../../i18n/index.js';

const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

function Toast({ event }) {
  const t = useT();
  const [shown, setShown] = useState(null);
  const lastId = useRef(0);

  useEffect(() => {
    if (!event || event.id === lastId.current) return undefined;
    lastId.current = event.id;
    setShown(event);
    const timer = setTimeout(() => setShown(null), 1100);
    return () => clearTimeout(timer);
  }, [event]);

  if (!shown) return null;
  const text = {
    pass: t('ch.toast.pass', { n: shown.points }),
    perfect: t('ch.toast.perfect', { n: shown.points }),
    miss: t('ch.toast.miss'),
    orb: t('ch.toast.orb'),
    finish: t('ch.toast.finish', { n: shown.points }),
  }[shown.kind];
  return <div className={`ch-toast ${shown.kind}`} role="status">{text}</div>;
}

function Results({ run, course, seed, onNewCourse, bestKey }) {
  const t = useT();
  const [isBest, setIsBest] = useState(false);
  const saved = useRef(false);

  useEffect(() => {
    if (saved.current) return;
    saved.current = true;
    if (run.status === 'finished' || run.score > 0) {
      setIsBest(useChallengeStore.getState().saveBest(bestKey, run.score));
    }
  }, [run, bestKey]);

  const finished = run.status === 'finished';
  const stars = starsOf(run, course);
  const best = useChallengeStore.getState().best[bestKey];
  const reason = { crash: 'ch.fail.crash', battery: 'ch.fail.battery', sunset: 'ch.fail.sunset' }[run.reason];

  return (
    <div className="ch-modal" role="dialog" aria-labelledby="ch-result-title">
      <h2 id="ch-result-title">{finished ? t('ch.result.finished') : t(reason)}</h2>
      {finished && <div className="stars" aria-label={t('ch.stars', { n: stars })}>{'★'.repeat(stars)}{'☆'.repeat(3 - stars)}</div>}
      <div className="ch-score-big">{run.score}</div>
      {isBest && <div className="ch-best">{t('ch.newBest')}</div>}
      <dl className="ch-stats">
        <div><dt>{t('ch.gates')}</dt><dd>{run.gatesPassed} / {course.gates.length}</dd></div>
        <div><dt>{t('ch.perfect')}</dt><dd>{run.perfects}</dd></div>
        <div><dt>{t('ch.orbs')}</dt><dd>{run.orbs}</dd></div>
        <div><dt>{t('ch.bestCombo')}</dt><dd>x{run.bestCombo}</dd></div>
        <div><dt>{t('ch.time')}</dt><dd>{fmt(run.time)}</dd></div>
        {finished && <div><dt>{t('ch.bonus')}</dt><dd>+{run.bonus}</dd></div>}
        {best != null && <div><dt>{t('ch.record')}</dt><dd>{best}</dd></div>}
      </dl>
      <div className="ch-actions">
        <button className="primary" onClick={() => useSimulatorStore.getState().requestReset()}>{t('ch.retry')}</button>
        <button onClick={() => { onNewCourse(); useSimulatorStore.getState().requestReset(); }}>
          {t('ch.newCourse', { n: seed + 1 })}
        </button>
      </div>
    </div>
  );
}

export default function ChallengeHUD({ course, seed, onNewCourse, bestKey }) {
  const t = useT();
  const run = useChallengeStore((s) => s.run);
  const best = useChallengeStore((s) => s.best[bestKey]);
  useEffect(() => useChallengeStore.getState().loadBest(), []);

  if (!run) return null;
  const fraction = Math.max(0, Math.min(1, run.daylight / run.daylightMax));
  const low = fraction < 0.25;
  const ended = run.status === 'finished' || run.status === 'failed';
  const multiplier = Math.min(5, 1 + Math.floor(Math.max(run.combo - 1, 0) / 3));
  const altText = Math.abs(run.altDelta) < 2 ? t('ch.level') : run.altDelta > 0 ? t('ch.up', { n: Math.round(run.altDelta) }) : t('ch.down', { n: Math.round(-run.altDelta) });

  return (
    <>
      <div className="ch-hud panel" aria-live="off">
        <div className="ch-top">
          <div>
            <div className="ch-label">{t('ch.course', { n: seed })}</div>
            <div className="ch-num">{run.status === 'ready' ? '·' : fmt(run.time)}</div>
          </div>
          <div>
            <div className="ch-label">{t('ch.score')}</div>
            <div className="ch-score">{run.score}</div>
          </div>
          <div>
            <div className="ch-label">{t('ch.gates')}</div>
            <div className="ch-num">{run.gatesPassed + run.gatesMissed}<small> / {course.gates.length}</small></div>
          </div>
          <div>
            <div className="ch-label">{t('ch.combo')}</div>
            <div className="ch-num">x{multiplier}</div>
          </div>
          {best != null && (
            <div>
              <div className="ch-label">{t('ch.record')}</div>
              <div className="ch-num">{best}</div>
            </div>
          )}
        </div>

        <div className="ch-daylight" aria-label={t('ch.daylight')}>
          <span className="ch-label">{t('ch.daylight')} {fmt(run.daylight)}</span>
          <div className={`bar ${low ? 'low' : ''}`}><div className="bar-fill" style={{ width: `${fraction * 100}%` }} /></div>
        </div>

        {!ended && (
          <div className="ch-guide">
            <svg className="ch-arrow" width="28" height="28" viewBox="0 0 28 28" style={{ transform: `rotate(${(-run.arrow * 180) / Math.PI}deg)` }} aria-hidden="true">
              <path d="M14 2 L24 24 L14 18 L4 24 Z" fill="#ff8a1f" />
            </svg>
            <span>{t('ch.nextGate', { m: Math.round(run.distance) })}, {altText}</span>
          </div>
        )}
      </div>

      <Toast event={run.event} />
      {ended && <Results run={run} course={course} seed={seed} onNewCourse={onNewCourse} bestKey={bestKey} />}
    </>
  );
}
