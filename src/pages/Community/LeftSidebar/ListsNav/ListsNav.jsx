import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LocalizedLink as Link } from '../../../../shared/i18n/LocalizedLink';
import styles from './ListsNav.module.css';

// Kullanıcının CUSTOM listeleri (getCustomLists — gerçek /api/me/lists).
// Liste ve detayı Community'nin orta kolonunda: /community/lists[/:id].
// Her liste, hesap sayfasındaki liste kartıyla (CustomListsSection) aynı dille
// bir banner şeridi: coverImageUrl arka plan, üstüne okunabilirlik karartması;
// kapak yoksa dekoratif radial zemin. rail: yalnız kapak karesi (kapak yoksa
// baş harf), ad tooltip'te ve aria-label'da.
export function ListsNav({ lists, rail, onNavigate }) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  // /<lang>/community/lists/<id> — aktif liste "lists" segmentinin hemen sonrasıdır.
  const segments = pathname.split('/');
  const activeId = segments[segments.indexOf('lists') + 1];

  // Rayda boş durum metni sığmaz; liste yoksa hiçbir şey çizilmez.
  if (rail && lists.length === 0) return null;

  return (
    <nav className={styles.listsNav} data-rail={rail || undefined} aria-label={t('community.sidebar.listsHeading')}>
      {!rail && (
        <Link to="/community/lists" className={styles.listsNav__heading} onClick={onNavigate}>
          {t('community.sidebar.listsHeading')}
        </Link>
      )}
      {lists.length === 0 ? (
        <p className={styles.listsNav__empty}>{t('community.sidebar.noLists')}</p>
      ) : (
        <ul className={styles.listsNav__list}>
          {lists.map((list) => (
            <li key={list.id}>
              <Link
                to={`/community/lists/${list.id}`}
                className={styles.listsNav__link}
                style={list.coverImageUrl ? { backgroundImage: `url(${list.coverImageUrl})` } : undefined}
                data-has-cover={Boolean(list.coverImageUrl) || undefined}
                data-active={String(list.id) === activeId || undefined}
                aria-label={rail ? list.title : undefined}
                title={rail ? list.title : undefined}
                onClick={onNavigate}
              >
                {rail ? (
                  !list.coverImageUrl && <span className={styles.listsNav__initial}>{list.title.charAt(0).toUpperCase()}</span>
                ) : (
                  <span className={styles.listsNav__title}>{list.title}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}
