import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useLayoutEffect } from 'react';
import { LANGS, useLang, useT } from '../i18n/index.js';
import { REPO_URL } from '../config/site.js';

function Logo() {
  const t = useT();
  return (
    <Link to="/" className="logo" aria-label={t('nav.home')}>
      <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
        <circle cx="6" cy="6" r="4" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="20" cy="6" r="4" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="6" cy="20" r="4" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="20" cy="20" r="4" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <rect x="9.5" y="9.5" width="7" height="7" rx="1.5" fill="#FF8A1F" />
      </svg>
      <span>Skydeck</span>
    </Link>
  );
}

export function LangToggle({ className = '' }) {
  const t = useT();
  const lang = useLang((s) => s.lang);
  const setLang = useLang((s) => s.setLang);
  return (
    <div className={`lang-toggle ${className}`} role="group" aria-label={t('lang.switch')}>
      {LANGS.map((l) => (
        <button key={l} type="button" aria-pressed={lang === l} className={lang === l ? 'on' : ''} onClick={() => setLang(l)}>
          {t(`lang.${l}`)}
        </button>
      ))}
    </div>
  );
}

export function SiteHeader({ overHero = false }) {
  const t = useT();
  return (
    <header className={`site-header ${overHero ? 'over-hero' : ''}`}>
      <Logo />
      <nav aria-label={t('nav.main')}>
        <NavLink to="/drones">{t('nav.drones')}</NavLink>
        <NavLink to="/how-to-fly">{t('nav.howto')}</NavLink>
        <LangToggle />
        <Link className="btn primary small" to="/simulator/1">{t('nav.flyNow')}</Link>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  const t = useT();
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <Logo />
          <p>{t('footer.tagline')}</p>
        </div>
        <nav aria-label={t('footer.explore')}>
          <h2>{t('footer.explore')}</h2>
          <Link to="/drones">{t('footer.allDrones')}</Link>
          <Link to="/how-to-fly">{t('footer.controls')}</Link>
          <Link to="/simulator/1">{t('footer.simulator')}</Link>
          <Link to="/challenge/1">{t('footer.sunrun')}</Link>
          <a href={REPO_URL} target="_blank" rel="noreferrer">{t('footer.source')}</a>
        </nav>
        <nav aria-label={t('footer.info')}>
          <h2>{t('footer.info')}</h2>
          <Link to="/terms">{t('footer.terms')}</Link>
          <Link to="/privacy">{t('footer.privacy')}</Link>
        </nav>
        <nav aria-label={t('footer.help')}>
          <h2>{t('footer.help')}</h2>
          <Link to="/troubleshooting">{t('footer.trouble')}</Link>
          <Link to="/contact">{t('footer.contact')}</Link>
        </nav>
      </div>
      <div className="footer-bottom">
        <p>{t('footer.copy')}</p>
        <p>{t('footer.fiction')}</p>
      </div>
    </footer>
  );
}

// Every page change starts at the top of the new page.
export default function SiteLayout() {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname]);
  return (
    <div className="site">
      <Outlet />
    </div>
  );
}
