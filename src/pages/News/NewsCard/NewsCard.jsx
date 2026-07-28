import { getProductionBySlug } from '../News.data';
import styles from './NewsCard.module.css';

// Tek haber kartı — kapak(posterGradient/prod-accent bloom) → yapım tag →
// başlık → excerpt → tarih. featured=true ise 2x büyük öne-çıkan varyant
// (Medium/Substack featured deseni, learned-rules kart anatomisi).
export function NewsCard({ item, featured = false }) {
  const production = getProductionBySlug(item.productionSlug);
  const cardClass = [styles.card, featured && styles['card--featured']].filter(Boolean).join(' ');

  return (
    <article className={cardClass}>
      <div
        className={styles.card__cover}
        style={{
          '--poster': production?.posterGradient,
          '--prod-accent': production?.theme?.accent,
        }}
      />
      <div className={styles.card__body}>
        {production && (
          <span className={styles.card__tag} style={{ '--prod-accent': production.theme?.accent }}>
            {production.title}
          </span>
        )}
        <h2 className={styles.card__title}>{item.title}</h2>
        <p className={styles.card__excerpt}>{item.excerpt}</p>
        <span className={styles.card__date}>{item.date}</span>
      </div>
    </article>
  );
}
