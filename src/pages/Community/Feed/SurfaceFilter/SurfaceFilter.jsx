import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LocalizedLink as Link } from '../../../../shared/i18n/LocalizedLink';
import styles from './SurfaceFilter.module.css';

const TABS = [
  { key: 'all', labelKey: 'community.feed.tabAll', to: '/community' },
  { key: 'DISCUSSION', labelKey: 'navbar.discussion', to: '/community/discussion' },
  { key: 'THEORY', labelKey: 'navbar.theories', to: '/community/theories' },
  { key: 'FAN_ART', labelKey: 'navbar.fanArt', to: '/community/fan-art' },
];

// Tab aktifliği pathname sonuna göre belirlenir (lang prefix'ten bağımsız) —
// projede zaten Navbar'ın kullandığı desenin aynısı, NavLink değil.
export function SurfaceFilter() {
  const { t } = useTranslation();
  const { pathname } = useLocation();

  return (
    <nav className={styles.surfaceFilter} aria-label={t('community.feed.tabAll')}>
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          to={tab.to}
          className={styles.surfaceFilter__tab}
          data-active={pathname.endsWith(tab.to)}
        >
          {t(tab.labelKey)}
        </Link>
      ))}
    </nav>
  );
}
