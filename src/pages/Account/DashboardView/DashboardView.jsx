import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLocalizedNavigate } from '../../../shared/i18n/useLocalizedNavigate';
import { ProfileSection } from './ProfileSection/ProfileSection';
import { ContentSection } from './ContentSection/ContentSection';
import { CustomListsSection } from './CustomListsSection/CustomListsSection';
import { CharactersSection } from './CharactersSection/CharactersSection';
import { SettingsSection } from './SettingsSection/SettingsSection';
import { ListDetail } from '../ListDetail/ListDetail';
import { getAccountContent } from '../Account.data';
import styles from './DashboardView.module.css';

const NAV_ITEMS = [
  { key: 'profile', labelKey: 'account.nav.profile' },
  { key: 'library', labelKey: 'account.nav.library', isGroupHeader: true },
  { key: 'watchlist', labelKey: 'account.nav.watchlist', isChild: true },
  { key: 'saved', labelKey: 'account.nav.saved', isChild: true },
  { key: 'following', labelKey: 'account.nav.following', isChild: true },
  { key: 'liked', labelKey: 'account.nav.liked', isChild: true },
  { key: 'customLists', labelKey: 'account.nav.customLists' },
  { key: 'characters', labelKey: 'account.nav.characters' },
  { key: 'settings', labelKey: 'account.nav.settings' },
];

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <line x1="5" y1="5" x2="19" y2="19" />
      <line x1="19" y1="5" x2="5" y2="19" />
    </svg>
  );
}

// Mobilde sidebar Twitter'ın hamburger→sol drawer desenine döner: hamburger
// sol üstte açar, drawer soldan kayar, backdrop'a veya bir nav öğesine
// tıklamak kapatır. Masaüstünde (>900px) sidebar zaten normal akışta sabit
// duruyor — drawer stilleri sadece mobil media query'sinde devreye girer.
export function DashboardView({ user, onLogout, onProfileUpdate }) {
  const { t } = useTranslation();
  // Kullanıcı isteği (2026-08-31): "/account/lists/:id" artık ayrı bir route
  // elementi DEĞİL, App.jsx aynı <Account/>'u "account/*" wildcard'ıyla
  // eşliyor (bkz. App.jsx yorumu) — sidebar/panel kabuğu hiç unmount olmuyor.
  // Wildcard route altında useParams() ':id'yi ÇÖZEMEZ (sadece '*' kalanını
  // verir), bu yüzden id doğrudan URL'den okunur.
  const { pathname } = useLocation();
  const listDetailId = pathname.match(/\/account\/lists\/([^/]+)/)?.[1] ?? null;
  const navigate = useLocalizedNavigate();
  const [activeSection, setActiveSection] = useState('profile');
  const [contentOpen, setContentOpen] = useState(true);
  const [content, setContent] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  // Liste detayı açıkken sidebar'da "Özel Listelerim" vurgulu kalsın —
  // gerçek activeSection'a dokunmadan sadece görünen vurguyu hesaplar,
  // "geri" ile /account'a dönüldüğünde kullanıcının asıl seçimi (varsa)
  // olduğu gibi durur.
  const highlightedSection = listDetailId ? 'customLists' : activeSection;

  useEffect(() => {
    let cancelled = false;
    getAccountContent().then((data) => {
      if (!cancelled) setContent(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectSection = (key) => {
    setActiveSection(key);
    setMobileNavOpen(false);
    // Liste detayındayken sidebar'dan başka bir bölüme geçilirse URL de
    // /account'a dönmeli — yoksa :id param'ı durduğu için panel ListDetail'i
    // göstermeye devam eder (renderSection listDetailId'yi activeSection'ın
    // önüne alıyor).
    if (listDetailId) navigate('/account');
  };

  const renderSection = () => {
    if (listDetailId) {
      return <ListDetail id={listDetailId} />;
    }
    if (activeSection === 'profile') {
      return <ProfileSection user={user} continueReading={content?.continueReading} onProfileUpdate={onProfileUpdate} />;
    }
    if (activeSection === 'watchlist') {
      return (
        <ContentSection
          heading={t('account.content.watchlistHeading')}
          items={content?.watchlist}
          ctaLabel={t('account.content.continueCta')}
        />
      );
    }
    if (activeSection === 'saved') {
      return (
        <ContentSection
          heading={t('account.content.savedHeading')}
          items={content?.saved}
          ctaLabel={t('account.content.readCta')}
        />
      );
    }
    if (activeSection === 'customLists') {
      return <CustomListsSection />;
    }
    if (activeSection === 'following') {
      return (
        <ContentSection
          heading={t('account.content.followingHeading')}
          items={content?.following}
          ctaLabel={t('account.content.viewCta')}
        />
      );
    }
    if (activeSection === 'liked') {
      return (
        <ContentSection
          heading={t('account.content.likedHeading')}
          items={content?.liked}
          ctaLabel={t('account.content.viewCta')}
        />
      );
    }
    if (activeSection === 'characters') {
      return <CharactersSection topCharacters={content?.topCharacters} />;
    }
    return <SettingsSection />;
  };

  return (
    <div className={styles.dashboard}>
      <button
        type="button"
        className={styles.dashboard__mobileToggle}
        onClick={() => setMobileNavOpen(true)}
        aria-label={t('account.nav.openMenu')}
      >
        <MenuIcon />
      </button>

      {mobileNavOpen && (
        <button
          type="button"
          className={styles.dashboard__backdrop}
          aria-label={t('account.nav.closeMenu')}
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <nav
        className={styles.dashboard__sidebar}
        data-open={mobileNavOpen}
        aria-label={t('account.nav.profile')}
      >
        <button
          type="button"
          className={styles.dashboard__closeButton}
          onClick={() => setMobileNavOpen(false)}
          aria-label={t('account.nav.closeMenu')}
        >
          <CloseIcon />
        </button>

        <ul className={styles.dashboard__navList}>
          {NAV_ITEMS.map((item) => {
            if (item.isGroupHeader) {
              return (
                <li key={item.key} className={styles.dashboard__navGroupHeader}>
                  <button
                    type="button"
                    className={styles.dashboard__navGroupToggle}
                    onClick={() => setContentOpen((v) => !v)}
                    aria-expanded={contentOpen}
                  >
                    <span>{t(item.labelKey)}</span>
                    <span className={styles.dashboard__chevron} data-open={contentOpen}>
                      ⌄
                    </span>
                  </button>
                </li>
              );
            }
            if (item.isChild && !contentOpen) return null;
            return (
              <li
                key={item.key}
                className={item.isChild ? styles.dashboard__navChildItem : styles.dashboard__navItem}
              >
                <button
                  type="button"
                  className={styles.dashboard__navButton}
                  data-active={highlightedSection === item.key}
                  onClick={() => selectSection(item.key)}
                >
                  {t(item.labelKey)}
                </button>
              </li>
            );
          })}
        </ul>

        <button type="button" className={styles.dashboard__logout} onClick={onLogout}>
          {t('account.nav.logout')}
        </button>
      </nav>

      <div className={styles.dashboard__panel}>
        {!listDetailId && content === null && activeSection !== 'settings' ? (
          <p className={styles.dashboard__loading}>{t('blog.loading')}</p>
        ) : (
          renderSection()
        )}
      </div>
    </div>
  );
}
