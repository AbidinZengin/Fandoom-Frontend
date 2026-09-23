import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import gsap from 'gsap';
import { TopBlogsRow } from '../../../Blog/TopBlogsRow/TopBlogsRow';
import { getBreakingBadBlogs } from './RelatedBlogs.data';
import styles from './RelatedBlogs.module.css';

// Sayfa altı "Related Blogs" şeridi — görünüm Blog hub'daki "Top 10 Blogs"
// şeridinin (TopBlogsRow) kullanıcı referansıyla birebir yeniden kullanımı
// (2026-09-24; önceki "Dive Deeper / RelatedContent" kararının YERİNE geçti).
// Sıralama anlamı olmadığı için rütbe rakamı kapalı. TopBlogsRow Blog
// sayfasının klasöründe durduğu için bu ikinci sayfa kullanımı, CLAUDE.md
// terfi kuralı gereği components/'a taşıma görevini doğurur (ayrı iş).
// Etiketli blog yoksa (ya da çekme başarısızsa) bölüm hiç basılmaz.
export default function RelatedBlogs({ seriesId }) {
  const { t } = useTranslation();
  const [blogs, setBlogs] = useState(null);
  const titleRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    getBreakingBadBlogs(seriesId)
      .then((items) => {
        if (!cancelled) setBlogs(items);
      })
      .catch(() => {
        if (!cancelled) setBlogs([]);
      });
    return () => {
      cancelled = true;
    };
  }, [seriesId]);

  // Başlık reveal'ı — SeasonRoute başlığıyla aynı değerler (fade + rise, tek
  // sefer); kartların kendi giriş dalgası TopBlogsRow'da.
  useEffect(() => {
    if (!blogs?.length) return undefined;
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from(titleRef.current, {
          opacity: 0,
          y: 28,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: { trigger: titleRef.current, start: 'top 85%', once: true },
        });
      });
    });
    return () => ctx.revert();
  }, [blogs]);

  if (!blogs?.length) return null;

  return (
    <section className={styles.related}>
      <h2 className={styles.related__title} ref={titleRef}>{t('series.relatedBlogsHeading')}</h2>
      <div className={styles.related__row}>
        <TopBlogsRow items={blogs} showRank={false} />
      </div>
    </section>
  );
}
