import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LocalizedLink as Link } from '../../../shared/i18n/LocalizedLink';
import { ProfileCard } from './ProfileCard/ProfileCard';
import { LibraryNav } from './LibraryNav/LibraryNav';
import { ListsNav } from './ListsNav/ListsNav';
import { PortalsNav } from './PortalsNav/PortalsNav';
import { useMyPortalsStore } from '../useMyPortalsStore';
import { hasStoredSession, getSidebarProfile, getSidebarLists, getSidebarPortals } from './LeftSidebar.data';
import styles from './LeftSidebar.module.css';

// Oturum durumuna göre render — Account.jsx'teki aynı desen (token varsa
// profil çek, yoksa CTA göster). Mobilde (≤768px) Twitter'ın hamburger→sol
// drawer modeline döner (DashboardView'daki aynı desen).
export function LeftSidebar({ mobileOpen, onClose }) {
  const { t } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [lists, setLists] = useState([]);
  const [portals, setPortals] = useState([]);
  // Katıl/Ayrıl (portal sayfası veya Top Portals) sonrası liste yeniden çekilir.
  const portalsVersion = useMyPortalsStore((s) => s.version);

  useEffect(() => {
    let cancelled = false;
    if (!hasStoredSession()) {
      setCheckingSession(false);
      return undefined;
    }
    getSidebarProfile()
      .then((data) => {
        if (!cancelled) setProfile(data);
      })
      .finally(() => {
        if (!cancelled) setCheckingSession(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!profile) return undefined;
    let cancelled = false;
    getSidebarLists().then((data) => {
      if (!cancelled) setLists(data);
    });
    return () => {
      cancelled = true;
    };
  }, [profile]);

  // Portallarım: hata halinde liste boş kalır (boş durum metni), sidebar bozulmaz.
  useEffect(() => {
    if (!profile) return undefined;
    let cancelled = false;
    getSidebarPortals()
      .then((data) => {
        if (!cancelled) setPortals(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [profile, portalsVersion]);

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className={styles.leftSidebar__backdrop}
          aria-label={t('account.nav.closeMenu')}
          onClick={onClose}
        />
      )}

      <aside className={styles.leftSidebar} data-open={mobileOpen}>
        <button
          type="button"
          className={styles.leftSidebar__closeButton}
          onClick={onClose}
          aria-label={t('account.nav.closeMenu')}
        >
          ✕
        </button>

        {checkingSession ? null : profile ? (
          <>
            <ProfileCard profile={profile} />
            <PortalsNav portals={portals} onNavigate={onClose} />
            <LibraryNav onNavigate={onClose} />
            <ListsNav lists={lists} onNavigate={onClose} />
            <Link to="/account" className={styles.leftSidebar__settings} onClick={onClose}>
              {t('community.sidebar.settings')}
            </Link>
          </>
        ) : (
          <div className={styles.leftSidebar__cta}>
            <p className={styles.leftSidebar__ctaTitle}>{t('community.sidebar.ctaTitle')}</p>
            <p className={styles.leftSidebar__ctaBody}>{t('community.sidebar.ctaBody')}</p>
            <Link to="/account" className={styles.leftSidebar__ctaButton} onClick={onClose}>
              {t('community.sidebar.signIn')}
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
