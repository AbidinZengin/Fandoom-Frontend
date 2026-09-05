import { useTranslation } from 'react-i18next';
import { LocalizedLink as Link } from '../../../../shared/i18n/LocalizedLink';
import styles from './ReviewCard.module.css';

const pad2 = (n) => String(n).padStart(2, '0');

// ResultCard'ın (Blog/FilterResults) aynı anatomisi — kapak, sol-üst rozet,
// alt overlay başlık/meta. Rozet burada dizi adını taşıyor (bkz. .module.css
// yorumu). item null iken ResultCard'daki gibi skeleton görünür.
export function ReviewCard({ item }) {
  const { t } = useTranslation();

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
    <Link
      to={`/series/${item.seriesSlug}/seasons/${item.seasonNumber}#season-story`}
      className={styles.card}
      data-reveal
    >
      <div className={styles.card__cover}>
        {item.posterUrl && (
          <img className={styles.card__image} src={item.posterUrl} alt="" loading="lazy" decoding="async" />
        )}

        <span className={styles.card__format}>{item.seriesTitle}</span>

        <div className={styles.card__caption}>
          <span className={styles.card__title}>{item.title}</span>
          <span className={styles.card__meta}>{t('series.seasonMeta', { number: pad2(item.seasonNumber) })}</span>
        </div>
      </div>
    </Link>
  );
}
