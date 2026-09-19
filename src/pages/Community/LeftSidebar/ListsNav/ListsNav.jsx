import { useTranslation } from 'react-i18next';
import { LocalizedLink as Link } from '../../../../shared/i18n/LocalizedLink';
import styles from './ListsNav.module.css';

// Kullanıcının CUSTOM listeleri (getCustomLists — gerçek /api/me/lists).
// Liste detayı hâlâ /account/lists/:id'de yaşıyor (ListDetail taşınmadı).
export function ListsNav({ lists, onNavigate }) {
  const { t } = useTranslation();

  return (
    <nav className={styles.listsNav} aria-label={t('community.sidebar.listsHeading')}>
      <span className={styles.listsNav__heading}>{t('community.sidebar.listsHeading')}</span>
      {lists.length === 0 ? (
        <p className={styles.listsNav__empty}>{t('community.sidebar.noLists')}</p>
      ) : (
        <ul className={styles.listsNav__list}>
          {lists.map((list) => (
            <li key={list.id}>
              <Link to={`/account/lists/${list.id}`} className={styles.listsNav__link} onClick={onNavigate}>
                {list.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}
