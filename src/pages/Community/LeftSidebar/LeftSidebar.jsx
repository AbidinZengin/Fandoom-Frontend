import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import { LocalizedLink as Link } from '../../../shared/i18n/LocalizedLink';
import { getStoredAuth } from '../../../shared/api/authStorage';
import { useLang } from '../../../shared/i18n/useLang';
import { withLangPrefix } from '../../../shared/i18n/constants';
import { logout as clearSession } from '../../../shared/api/auth';
import { ProfileCard } from './ProfileCard/ProfileCard';
import { LibraryNav } from './LibraryNav/LibraryNav';
import { ListsNav } from './ListsNav/ListsNav';
import { PortalsNav } from './PortalsNav/PortalsNav';
import { useMyPortalsStore } from '../useMyPortalsStore';
import { useMyListsStore } from '../../../shared/state/useMyListsStore';
import { hasStoredSession, getSidebarProfile, getSidebarLists, getSidebarPortals } from './LeftSidebar.data';
import styles from './LeftSidebar.module.css';

// Admin paneline giriş yetkisi olan roller — gerçek erişim kontrolü panelin
// kendi guard'ında (RequireAuth); burası yalnız bağlantının görünürlüğü.
const ADMIN_ROLES = ['EDITOR', 'MODERATOR', 'ADMIN'];

// Oturum durumuna göre render — Account.jsx'teki aynı desen (token varsa
// profil çek, yoksa CTA göster). Mobilde (≤768px) Twitter'ın hamburger→sol
// drawer modeline döner (DashboardView'daki aynı desen).
// rail: yalnız logolar (avatar + portal ikonları) — masaüstünde kolon dar sürüklenince.
export function LeftSidebar({ mobileOpen, collapsed, rail, onClose }) {
  const { t } = useTranslation();
  const lang = useLang();
  const [profile, setProfile] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [lists, setLists] = useState([]);
  const [portals, setPortals] = useState([]);
  // Katıl/Ayrıl (portal sayfası veya Top Portals) sonrası liste yeniden çekilir.
  const portalsVersion = useMyPortalsStore((s) => s.version);
  // Liste oluşturma/silme/düzenleme sonrası "Listelerim" yeniden çekilir.
  const listsVersion = useMyListsStore((s) => s.version);

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
  }, [profile, listsVersion]);

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

  // Çıkış: oturum silinir ve Community'ye TAM yönlendirilir. Alt çubuk, Navbar
  // zili ve liste/portal store'ları oturumu render'da/mount'ta okuyor; yalnız
  // yerel state'i sıfırlamak onları eski oturumla bırakırdı.
  const handleLogout = () => {
    clearSession();
    window.location.assign(withLangPrefix('/community', lang));
  };

  return (
    <>
      <button
        type="button"
        className={styles.leftSidebar__backdrop}
        data-open={mobileOpen || undefined}
        aria-label={t('account.nav.closeMenu')}
        onClick={onClose}
      />

      <aside className={styles.leftSidebar} data-open={mobileOpen} data-collapsed={collapsed || undefined} data-rail={rail || undefined}>
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
            <ProfileCard profile={profile} rail={rail} />
            <PortalsNav portals={portals} rail={rail} onNavigate={onClose} />
            <LibraryNav rail={rail} onNavigate={onClose} />
            <ListsNav lists={lists} rail={rail} onNavigate={onClose} />
            {/* Ayarlar'ın logosu yok: rayda gösterilmez. */}
            {!rail && (
              <>
                <Link to="/community/settings" className={styles.leftSidebar__settings} onClick={onClose}>
                  {t('community.sidebar.settings')}
                </Link>
                {/* /admin dil önekli rotaların dışında: düz react-router Link. */}
                {ADMIN_ROLES.includes(getStoredAuth()?.role) && (
                  <RouterLink to="/admin" className={styles.leftSidebar__settings}>
                    {t('account.nav.admin')}
                  </RouterLink>
                )}
                <button type="button" className={styles.leftSidebar__logout} onClick={handleLogout}>
                  {t('account.nav.logout')}
                </button>
              </>
            )}
          </>
        ) : rail ? (
          <Link
            to="/account"
            className={styles.leftSidebar__railSignIn}
            aria-label={t('community.sidebar.signIn')}
            title={t('community.sidebar.signIn')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          </Link>
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
