import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchSeasonReviews } from './SeasonReviews.data';
import { ReviewCard } from './ReviewCard/ReviewCard';
import { CarouselArrow } from '../CarouselArrow/CarouselArrow';
import styles from './SeasonReviews.module.css';

const SKELETON_COUNT = 4;

// Blog hub'ının en altına eklenen "Featured Titles" tarzı bölüm — dizinin
// kendi sayfası dışında da (blog gezerken) sezon incelemelerini keşfettirir
// (kullanıcı kararı, 2026-09-05). Grid yerine ayrı bir carousel: native
// scroll-snap + Top Blogs'un overlay okları (uçlarda disabled). Veri gelene
// kadar skeleton kartlar; hiç inceleme yoksa section render edilmez.
export function SeasonReviews() {
  const { t } = useTranslation();
  const [reviews, setReviews] = useState(null);
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchSeasonReviews().then((items) => {
      if (!cancelled) setReviews(items);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const sync = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 1);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return undefined;
    sync();
    el.addEventListener('scroll', sync, { passive: true });
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', sync);
      ro.disconnect();
    };
  }, [sync, reviews]);

  // Kart adımı DOM'dan okunur (genişlik clamp'li, tek doğru kaynak yerleşim).
  const step = (direction) => {
    const [first, second] = trackRef.current?.children ?? [];
    if (!first) return;
    const stride = second ? second.offsetLeft - first.offsetLeft : first.offsetWidth;
    viewportRef.current.scrollBy({ left: direction * stride, behavior: 'smooth' });
  };

  if (reviews != null && reviews.length === 0) return null;

  // Blog hub başlıklarının iki ton dili: son kelime beyaz, öncesi gri.
  const label = t('blog.seasonReviews');
  const cut = label.lastIndexOf(' ');

  return (
    <section className={styles.seasonReviews} data-reveal-group>
      <h2 className={styles.seasonReviews__label}>
        {cut > 0 && <span className={styles['seasonReviews__label-muted']}>{label.slice(0, cut)} </span>}
        <span className={styles['seasonReviews__label-strong']}>{label.slice(cut + 1)}</span>
      </h2>
      <div className={styles.seasonReviews__row}>
        <CarouselArrow direction="prev" onClick={() => step(-1)} disabled={atStart} />
        <div className={styles.seasonReviews__viewport} ref={viewportRef}>
          <ul className={styles.seasonReviews__track} ref={trackRef}>
            {(reviews ?? Array.from({ length: SKELETON_COUNT })).map((item, i) => (
              <li className={styles.seasonReviews__item} key={item?.id ?? i}>
                <ReviewCard item={item} />
              </li>
            ))}
          </ul>
        </div>
        <CarouselArrow direction="next" onClick={() => step(1)} disabled={atEnd} />
      </div>
    </section>
  );
}
