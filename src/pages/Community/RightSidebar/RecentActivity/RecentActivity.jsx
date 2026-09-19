import { useTranslation } from 'react-i18next';
import styles from './RecentActivity.module.css';

// Thread'e link Faz 2'de (ThreadDetail route'u kurulunca) eklenecek —
// şimdilik salt bilgi şeridi.
export function RecentActivity({ items }) {
  const { t } = useTranslation();

  return (
    <section className={styles.recentActivity}>
      <h2 className={styles.recentActivity__heading}>{t('community.sidebar.recentActivityHeading')}</h2>
      <ul className={styles.recentActivity__list}>
        {items.map((item) => (
          <li key={item.id} className={styles.recentActivity__item}>
            <p className={styles.recentActivity__line}>
              <span className={styles.recentActivity__username}>@{item.username}</span>{' '}
              {t(`community.sidebar.activity.${item.action}`)}
            </p>
            <p className={styles.recentActivity__thread}>{item.threadTitle}</p>
            <span className={styles.recentActivity__time}>{item.timeAgo}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
