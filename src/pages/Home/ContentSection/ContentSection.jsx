import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import {
  resolveProductionBySlug,
  fetchProductionDetail,
  resolveGenreNames,
  getProductionAccent,
  posterBySlug,
} from './ContentSection.data';
import styles from './ContentSection.module.css';

// Yarım-ekran sinematik split: bir yarı lead yapımın afişi (yoksa posterGradient
// atmosferi), diğer yarı temiz koyu zeminde büyük yüksek-kontrast tipografi.
// mirror ile görsel/yazı yeri aynalanır. Motion: imza-dalga giriş + görselde
// yalnız translateY parallax (maske/blend/scale YOK — performans + kontrast).
export function ContentSection({ kicker, heading, items, renderMeta, mirror = false }) {
  const sectionRef = useRef(null);
  const fillRef = useRef(null);

  const [lead, ...rest] = items;
  const leadPoster = posterBySlug[lead.productionSlug];

  // slug -> { title, type } — üretim özet bilgisi API'den, poster/accent
  // yerel presentational haritadan gelir (CSS zaten var(--x, fallback) ile
  // veri gelene kadar nötr bir zemin gösteriyor — ayrı bir skeleton'a gerek yok).
  const [productions, setProductions] = useState({});
  // Genre yalnız lead için gösteriliyor — bu yüzden N+1 detay isteği sadece
  // lead'e atılır, rest listesindeki her item için değil.
  const [leadGenre, setLeadGenre] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const slugs = [lead.productionSlug, ...rest.map((r) => r.productionSlug)];

    Promise.all(slugs.map((slug) => resolveProductionBySlug(slug))).then((results) => {
      if (cancelled) return;
      const map = {};
      results.forEach((p, i) => {
        if (!p) return;
        map[slugs[i]] = { title: p.title, type: p.type, ...getProductionAccent(slugs[i]) };
      });
      setProductions(map);

      const leadType = map[lead.productionSlug]?.type;
      if (!leadType) return;
      fetchProductionDetail(leadType.toLowerCase(), lead.productionSlug)
        .then((detail) => resolveGenreNames(detail.genreIds))
        .then((names) => {
          if (!cancelled) setLeadGenre(names?.[0] ?? null);
        })
        .catch(() => {});
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- items içeriği (slug'lar) belirleyici, referansı değil
  }, [lead.productionSlug, rest.map((r) => r.productionSlug).join(',')]);

  const leadProduction = productions[lead.productionSlug];

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      // İmza-dalga giriş: metin elemanları sağdan sola akarak kademeli belirir.
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from('[data-reveal]', {
          opacity: 0,
          x: 120,
          y: 48,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.1,
          scrollTrigger: { trigger: sectionRef.current, start: 'top 78%', once: true },
        });
      });

      // Parallax yalnız masaüstünde ve yalnız translateY (GPU-ucuz).
      mm.add('(prefers-reduced-motion: no-preference) and (min-width: 901px)', () => {
        gsap.fromTo(
          fillRef.current,
          { yPercent: -8 },
          {
            yPercent: 8,
            ease: 'none',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          }
        );
      });

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set('[data-reveal]', { opacity: 1 });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const bandClass = [styles['content-band'], mirror && styles['content-band--mirror']]
    .filter(Boolean)
    .join(' ');

  return (
    <section className={bandClass} ref={sectionRef}>
      <div className={styles['content-band__media']}>
        <div
          className={styles['content-band__media-fill']}
          ref={fillRef}
          style={{
            '--poster': leadProduction?.posterGradient,
            '--prod-accent': leadProduction?.accent,
          }}
        >
          {leadPoster && (
            <img
              className={styles['content-band__poster']}
              src={leadPoster}
              alt=""
              loading="lazy"
              draggable={false}
            />
          )}
        </div>
      </div>

      <div className={styles['content-band__content']}>
        <div className={styles['content-band__inner']}>
          <header className={styles['content-band__head']}>
            <span className={styles['content-band__kicker']} data-reveal>
              {kicker}
            </span>
            <h2 className={styles['content-band__heading']} data-reveal>
              {heading}
            </h2>
          </header>

          <div className={styles['content-band__feature']}>
            <h3 className={styles['content-band__lead-title']} data-reveal>
              {lead.title}
            </h3>
            <p className={styles['content-band__excerpt']} data-reveal>
              {lead.excerpt}
            </p>
            <div
              className={styles['content-band__meta']}
              style={{ '--prod-accent': leadProduction?.accent }}
              data-reveal
            >
              <span className={styles['content-band__meta-tag']}>
                {leadProduction?.title}
                {leadGenre && ` · ${leadGenre}`}
              </span>
              <span className={styles['content-band__meta-sep']}>·</span>
              {renderMeta(lead)}
            </div>
          </div>

          <ul className={styles['content-band__list']}>
            {rest.map((item) => {
              const production = productions[item.productionSlug];
              return (
                <li key={item.id} className={styles['content-band__list-item']} data-reveal>
                  <span
                    className={styles['content-band__list-tag']}
                    style={{ '--prod-accent': production?.accent }}
                  >
                    {production?.title}
                  </span>
                  <h4 className={styles['content-band__list-title']}>{item.title}</h4>
                  <span className={styles['content-band__list-meta']}>{renderMeta(item)}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
