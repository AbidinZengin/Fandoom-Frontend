import { useTranslation } from 'react-i18next';
import styles from './TrendingTags.module.css';

// Tag'e tıklayınca filtrelenmiş görünüm (/community/tag/:tag) Faz 2'de
// eklenecek — bu fazda salt görsel liste (learned-rules
// [[topluluk-organizasyon]]: tag çapraz-kesen, klasör değil).
export function TrendingTags({ tags }) {
  const { t } = useTranslation();

  return (
    <section className={styles.trendingTags}>
      <h2 className={styles.trendingTags__heading}>{t('community.sidebar.trendingHeading')}</h2>
      <ul className={styles.trendingTags__list}>
        {tags.map((item) => (
          <li key={item.tag} className={styles.trendingTags__item}>
            <span className={styles.trendingTags__tag}>#{item.tag}</span>
            <span className={styles.trendingTags__count}>{t('community.sidebar.postCount', { count: item.count })}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
