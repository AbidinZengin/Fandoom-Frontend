import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LocalizedLink as Link } from '../../../../shared/i18n/LocalizedLink';
import listIcon from '../../../../assets/icons/list.png';
import { BookmarkIcon, HeartIcon } from '../../ThreadIcons';
import styles from './LibraryNav.module.css';

// Watchlist ikonu kullanıcının PNG'sidir (2026-10-24): siyah PNG koyu zeminde
// görünmez ve duruma göre renk almaz, bu yüzden ALFA KANALI maske, boya
// currentColor (ThreadIcons.jsx / ProfileSection ile aynı yöntem).
function ListIcon() {
  return <span className={styles.libraryNav__mask} style={{ '--icon-mask': `url(${listIcon})` }} aria-hidden="true" />;
}

// Following = zil: içerik takip butonuyla (ContentActions) aynı simge, "takip"
// her yerde aynı görünsün. ContentActions'taki kopyayla aynı çizim.
function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M18 16v-5a6 6 0 1 0-12 0v5l-2 3h16l-2-3z" strokeLinejoin="round" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </svg>
  );
}

// Liked/Saved/Watchlist/Following artık Community'nin orta kolonunda:
// /community/library/:tab (kullanıcı kararı, 2026-10-24: "hepsi Community'de
// görünsün", /account'a bağlanmasın).
const ITEMS = [
  { key: 'liked', labelKey: 'community.sidebar.liked', Icon: HeartIcon },
  { key: 'saved', labelKey: 'community.sidebar.saved', Icon: BookmarkIcon },
  { key: 'watchlist', labelKey: 'community.sidebar.watchlist', Icon: ListIcon },
  { key: 'following', labelKey: 'community.sidebar.following', Icon: BellIcon },
];

// rail: yalnız ikonlar (sol kolon dar sürüklenince); ad tooltip'te ve aria-label'da.
export function LibraryNav({ rail, onNavigate }) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  // /<lang>/community/library/<tab> — aktif sekme "library" segmentinin hemen sonrasıdır.
  const segments = pathname.split('/');
  const activeTab = segments[segments.indexOf('library') + 1];

  return (
    <nav className={styles.libraryNav} data-rail={rail || undefined} aria-label={t('community.sidebar.libraryHeading')}>
      {!rail && <span className={styles.libraryNav__heading}>{t('community.sidebar.libraryHeading')}</span>}
      <ul className={styles.libraryNav__list}>
        {ITEMS.map(({ key, labelKey, Icon }) => (
          <li key={key}>
            <Link
              to={`/community/library/${key}`}
              className={styles.libraryNav__link}
              data-active={key === activeTab || undefined}
              aria-label={rail ? t(labelKey) : undefined}
              title={rail ? t(labelKey) : undefined}
              onClick={onNavigate}
            >
              <span className={styles.libraryNav__icon}>
                <Icon />
              </span>
              {!rail && t(labelKey)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
