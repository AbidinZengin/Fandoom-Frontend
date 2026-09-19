import { useTranslation } from 'react-i18next';
import { LocalizedLink as Link } from '../../../../shared/i18n/LocalizedLink';
import styles from './LibraryNav.module.css';

// Account/DashboardView'ın Watchlist/Saved/Following/Liked sekmelerine
// LİNK VERİR — DashboardView henüz taşınmadı (kullanıcı kararı, bu ayrı bir
// sonraki görev), o yüzden şimdilik hepsi /account'a gider ve kullanıcı
// oradaki sidebar'dan ilgili sekmeyi seçer. Gerçek deep-link (ör.
// /account?tab=saved) Account taşınınca eklenir.
const ITEMS = [
  { key: 'liked', labelKey: 'community.sidebar.liked' },
  { key: 'saved', labelKey: 'community.sidebar.saved' },
  { key: 'watchlist', labelKey: 'community.sidebar.watchlist' },
  { key: 'following', labelKey: 'community.sidebar.following' },
];

export function LibraryNav({ onNavigate }) {
  const { t } = useTranslation();

  return (
    <nav className={styles.libraryNav} aria-label={t('community.sidebar.libraryHeading')}>
      <span className={styles.libraryNav__heading}>{t('community.sidebar.libraryHeading')}</span>
      <ul className={styles.libraryNav__list}>
        {ITEMS.map((item) => (
          <li key={item.key}>
            <Link to="/account" className={styles.libraryNav__link} onClick={onNavigate}>
              {t(item.labelKey)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
