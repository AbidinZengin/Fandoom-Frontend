import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchSeasonReviews } from './SeasonReviews.data';
import { ReviewCard } from './ReviewCard/ReviewCard';
import styles from './SeasonReviews.module.css';

const SKELETON_COUNT = 4;

// Blog hub'ının en altına eklenen "Featured Titles" tarzı bölüm — dizinin
// kendi sayfası dışında da (blog gezerken) sezon incelemelerini keşfettirir
// (kullanıcı kararı, 2026-09-05). Veri gelene kadar ResultCard'daki gibi
// skeleton kartlar gösterilir; hiç inceleme yoksa (ör. tüm çağrılar hata
// verirse) section hiç render edilmez.
export function SeasonReviews() {
  const { t } = useTranslation();
  const [reviews, setReviews] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchSeasonReviews().then((items) => {
      if (!cancelled) setReviews(items);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (reviews != null && reviews.length === 0) return null;

  return (
    <section className={styles.seasonReviews} data-reveal-group>
      <h2 className={styles.seasonReviews__label}>{t('blog.seasonReviews')}</h2>
      <div className={styles.seasonReviews__grid}>
        {(reviews ?? Array.from({ length: SKELETON_COUNT })).map((item, i) => (
          <ReviewCard key={item?.id ?? i} item={item} />
        ))}
      </div>
    </section>
  );
}
