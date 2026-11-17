import { Link } from 'react-router-dom';
import { SiteHeader, SiteFooter } from '../components/SiteLayout.jsx';
import { useT } from '../i18n/index.js';

export default function NotFoundPage({ what = 'page' }) {
  const t = useT();
  const word = t(`nf.${what}`);
  return (
    <>
      <SiteHeader />
      <main className="page">
        <header className="page-head">
          <h1>{t('nf.title', { what: word })}</h1>
          <p>{t('nf.lead', { what: word })}</p>
        </header>
        <p className="more">
          <Link className="btn primary" to="/drones">{t('nf.browse')}</Link>
          <Link className="btn ghost" to="/">{t('nf.home')}</Link>
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
