import { useMemo, useState } from 'react';
import { SiteHeader, SiteFooter } from '../components/SiteLayout.jsx';
import DroneRow from '../components/DroneRow.jsx';
import Notice from '../components/Notice.jsx';
import { useDrones } from '../features/catalog/hooks/useDrones.js';
import { categoryOf, classLabel, scaleOf } from '../features/catalog/lib/droneInfo.js';
import { descriptionOf } from '../features/catalog/data/droneText.js';
import { useT } from '../i18n/index.js';

const SORTS = {
  name: (a, b) => a.name.localeCompare(b.name),
  speed: (a, b) => b.maxSpeed - a.maxSpeed,
  battery: (a, b) => b.batteryLife - a.batteryLife,
  light: (a, b) => a.weight - b.weight,
  heavy: (a, b) => b.weight - a.weight,
};

export default function CatalogPage() {
  const t = useT();
  const { status, drones, error } = useDrones();
  const [query, setQuery] = useState('');
  const [type, setType] = useState('ALL');
  const [category, setCategory] = useState('ALL');
  const [sort, setSort] = useState('name');

  const scale = useMemo(() => scaleOf(drones), [drones]);
  const categoriesPresent = useMemo(() => [...new Set(drones.map(categoryOf))], [drones]);

  const shown = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    return drones
      .filter((d) => type === 'ALL' || d.type === type)
      .filter((d) => category === 'ALL' || categoryOf(d) === category)
      .filter((d) => !q || `${d.name} ${d.description} ${descriptionOf(d)}`.toLocaleLowerCase().includes(q))
      .sort(SORTS[sort]);
  }, [drones, query, type, category, sort]);

  const clear = () => {
    setQuery('');
    setType('ALL');
    setCategory('ALL');
  };

  return (
    <>
      <SiteHeader />
      <main className="page">
        <header className="page-head">
          <h1>{t('cat.title')}</h1>
          <p>{t('cat.lead')}</p>
        </header>

        <Notice status={status} error={error} />

        <form className="filters" role="search" onSubmit={(e) => e.preventDefault()}>
          <label className="field grow">
            <span>{t('cat.search')}</span>
            <input type="search" value={query} placeholder={t('cat.searchPh')} onChange={(e) => setQuery(e.target.value)} />
          </label>
          <label className="field">
            <span>{t('cat.type')}</span>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="ALL">{t('cat.allTypes')}</option>
              <option value="CIVILIAN">{t('type.civilian')}</option>
              <option value="MILITARY">{t('type.military')}</option>
            </select>
          </label>
          <label className="field">
            <span>{t('cat.class')}</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="ALL">{t('cat.allClasses')}</option>
              {categoriesPresent.map((c) => (
                <option key={c} value={c}>{classLabel(c)}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>{t('cat.sort')}</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              {Object.keys(SORTS).map((k) => (
                <option key={k} value={k}>{t(`sort.${k}`)}</option>
              ))}
            </select>
          </label>
        </form>

        {status === 'loading' && <p className="empty" role="status">{t('home.loading')}</p>}

        {status !== 'loading' && shown.length === 0 && (
          <div className="empty">
            <p>{t('cat.none')}</p>
            <button type="button" className="btn ghost" onClick={clear}>{t('cat.clear')}</button>
          </div>
        )}

        <p className="count" aria-live="polite">
          {status !== 'loading' && t('cat.count', { n: shown.length, total: drones.length })}
        </p>
        <ul className="drone-list">
          {shown.map((d) => (
            <DroneRow key={d.id} drone={d} scale={scale} />
          ))}
        </ul>
      </main>
      <SiteFooter />
    </>
  );
}
