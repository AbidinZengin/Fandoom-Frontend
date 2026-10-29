import { useTranslation } from 'react-i18next';
import { LocalizedLink as Link } from '../../../shared/i18n/LocalizedLink';
import styles from './BlogCard.module.css';

// Kompakt rail kartı — FEATURED/LATEST rayları (learned-rules "Blog kartı"
// anatomisinin küçültülmüş hâli: kapak → başlık → meta). `item` gelene kadar
// kapak kesik çerçeve + gradient bloom ile "buraya görsel gelecek" der,
// başlık/meta satır uzunluğunu taklit eden nötr BAR'lar — lorem ipsum değil.
export function BlogCard({ item }) {
  const { t } = useTranslation();

  if (!item) {
    return (
      <div className={styles.card}>
        <div className={styles.card__cover} />
        <div className={styles.card__body}>
          <span className={`${styles.bar} ${styles['bar--title']}`} />
          <span className={`${styles.bar} ${styles['bar--titleShort']}`} />
          <span className={`${styles.bar} ${styles['bar--meta']}`} />
        </div>
      </div>
    );
  }

  return (
    <Link to={`/blog/${item.slug}`} className={styles.card}>
      <div className={styles.card__cover} data-filled>
        <img
          className={styles.card__image}
          src={item.imageUrl}
          alt={item.imageAlt ?? ''}
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className={styles.card__body}>
        <h3 className={styles.card__title}>{item.title}</h3>
        {item.readingTimeMinutes != null && (
          <span className={styles.card__meta}>{t('blog.minRead', { count: item.readingTimeMinutes })}</span>
        )}
      </div>
    </Link>
  );
}
