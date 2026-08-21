import { LocalizedLink as Link } from '../../../../shared/i18n/LocalizedLink';
import styles from './ResultCard.module.css';

// Filtre/browse modu grid kartı — SpotlightCard/BlogCard'ın aynı anatomisi
// (kapak → alt kenara gömülü başlık+meta), sade Link navigasyonu. Kart
// sayısı çoğalıp sayfalandığı için TopBlogsRow'daki "kesintisiz devir" flip
// klonu burada YOK (o mekanizma tekil hub şeridine özel, sayfalanan/dinamik
// grid'e taşınması ayrı bir görev — teslim özetinde raporlanır).
export function ResultCard({ item }) {
  if (!item) {
    return (
      <div className={styles.card} data-pending>
        <div className={styles.card__cover} data-pending />
        <div className={styles.card__caption}>
          <span className={`${styles.bar} ${styles['bar--title']}`} />
          <span className={`${styles.bar} ${styles['bar--meta']}`} />
        </div>
      </div>
    );
  }

  return (
    <Link to={`/blog/${item.slug}`} className={styles.card} data-reveal>
      <div className={styles.card__cover}>
        <img
          className={styles.card__image}
          src={item.imageUrl}
          alt={item.imageAlt ?? ''}
          loading="lazy"
          decoding="async"
        />

        {item.format && <span className={styles.card__format}>{item.format}</span>}

        <div className={styles.card__caption}>
          <span className={styles.card__title}>{item.title}</span>
          {item.readingTimeMinutes != null && (
            <span className={styles.card__meta}>{item.readingTimeMinutes} min read</span>
          )}
        </div>
      </div>
    </Link>
  );
}
