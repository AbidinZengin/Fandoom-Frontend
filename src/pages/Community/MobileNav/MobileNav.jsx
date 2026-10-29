import { useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LocalizedLink as Link } from '../../../shared/i18n/LocalizedLink';
import { getStoredAuth } from '../../../shared/api/authStorage';
import styles from './MobileNav.module.css';

// Akış rotaları: /community + discussion/theories/fan-art (SurfaceFilter sekmeleri).
const FEED_PATH = /^\/(?:[a-z]{2}\/)?community(?:\/(?:discussion|theories|fan-art))?\/?$/;
const PORTAL_PATH = /^\/(?:[a-z]{2}\/)?portal(?:\/|$)/;

function FeedIcon() {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" />
    </svg>
  );
}

function PortalsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function SignInIcon() {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

// Yalnız ≤768px: alt kenarda yüzen ray + aktif pill (Feed SegmentedControl'ün
// görsel dili). Oturum açıksa Akış · Portallar · Menü (sol çekmece: profil,
// kitaplık, listeler, ayarlar); değilse Akış · Portallar · Giriş.
export function MobileNav({ menuOpen, onOpenMenu }) {
  const { t, i18n } = useTranslation();
  const language = i18n.language;
  const { pathname } = useLocation();
  const signedIn = Boolean(getStoredAuth()?.token);
  const navRef = useRef(null);
  // Aktif yuva: menü açıksa Menü, değilse sayfaya göre Akış/Portallar. Hiçbiri
  // değilse (ör. kitaplık sayfası) pill gizlenir.
  const activeKey = menuOpen ? 'menu' : FEED_PATH.test(pathname) ? 'feed' : PORTAL_PATH.test(pathname) ? 'portals' : null;

  // Kayan pill (Feed SegmentedControl deseni): aktif yuvanın ölçüsü CSS
  // değişkenine yazılır, geçiş CSS'te. İlk konum animasyonsuz (data-ready
  // bir sonraki frame'de açılır). Ölçü, dil değişince etiket genişliği
  // değişeceği için language'a da bağlı.
  useLayoutEffect(() => {
    const nav = navRef.current;
    const item = activeKey && nav.querySelector(`[data-key="${activeKey}"]`);
    if (!item) {
      nav.removeAttribute('data-pill');
      return undefined;
    }
    nav.style.setProperty('--pill-x', `${item.offsetLeft}px`);
    nav.style.setProperty('--pill-w', `${item.offsetWidth}px`);
    nav.setAttribute('data-pill', '');
    const frame = requestAnimationFrame(() => nav.setAttribute('data-ready', 'true'));
    return () => cancelAnimationFrame(frame);
  }, [activeKey, signedIn, language]);

  return (
    <nav ref={navRef} className={styles.mobileNav} aria-label={t('community.mobileNav.ariaLabel')}>
      <span className={styles.mobileNav__pill} aria-hidden="true" />
      <Link to="/community" className={styles.mobileNav__item} data-key="feed" data-active={activeKey === 'feed' || undefined}>
        <span className={styles.mobileNav__icon}><FeedIcon /></span>
        {t('community.mobileNav.feed')}
      </Link>
      <Link to="/portal" className={styles.mobileNav__item} data-key="portals" data-active={activeKey === 'portals' || undefined}>
        <span className={styles.mobileNav__icon}><PortalsIcon /></span>
        {t('community.mobileNav.portals')}
      </Link>

      {signedIn ? (
        <button
          type="button"
          className={styles.mobileNav__item}
          data-key="menu"
          data-active={activeKey === 'menu' || undefined}
          aria-expanded={menuOpen}
          onClick={onOpenMenu}
        >
          <span className={styles.mobileNav__icon}><MenuIcon /></span>
          {t('community.mobileNav.menu')}
        </button>
      ) : (
        <Link to="/account" className={styles.mobileNav__item}>
          <span className={styles.mobileNav__icon}><SignInIcon /></span>
          {t('community.mobileNav.signIn')}
        </Link>
      )}
    </nav>
  );
}
