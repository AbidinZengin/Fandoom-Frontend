import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LocalizedLink as Link } from '../../../../shared/i18n/LocalizedLink';
import { timeAgo } from '../../Feed/Feed.data';
import { threadPath } from '../../threadLink';
import { getLatestThreads } from './RecentActivity.data';
import styles from './RecentActivity.module.css';

// Son açılan konular: "@yazar yeni konu açtı" + başlık + göreli zaman; satır
// thread'e gider. Yorum olayı yok (backend'de etkinlik akışı yok). Hata veya
// boş listede widget sessizce kaybolur (TopPortals ile aynı: yan panel ana akışı
// bozmaz); önceki liste varsa yerinde kalır.
export function RecentActivity() {
  const { t } = useTranslation();
  const [threads, setThreads] = useState([]);

  useEffect(() => {
    let cancelled = false;
    getLatestThreads()
      .then((list) => {
        if (!cancelled) setThreads(list);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (threads.length === 0) return null;

  return (
    <section className={styles.recentActivity}>
      <h2 className={styles.recentActivity__heading}>{t('community.sidebar.recentActivityHeading')}</h2>
      <ul className={styles.recentActivity__list}>
        {threads.map((thread) => (
          <li key={thread.id} className={styles.recentActivity__item}>
            <Link to={threadPath(thread)} className={styles.recentActivity__link}>
              <p className={styles.recentActivity__line}>
                <span className={styles.recentActivity__username}>@{thread.author ?? t('community.feed.anonymous')}</span>{' '}
                {t('community.sidebar.activity.posted')}
              </p>
              <p className={styles.recentActivity__thread}>{thread.title}</p>
              <span className={styles.recentActivity__time}>{timeAgo(thread.createdAt, t)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
