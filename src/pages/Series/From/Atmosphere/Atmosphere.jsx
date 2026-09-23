import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { fetchProductionById, fetchSeasonDetail } from '../../../../shared/api/productions';
import styles from './Atmosphere.module.css';

// Severance'ın Atmosphere'iyle BİREBİR aynı yapı (kullanıcı isteği,
// 2026-09-12) — kendi arka planı YOK, From.jsx'teki .intro__backdrop
// (Hero ile PAYLAŞILAN tek görsel) bu section'ın arkasından geçiyor.
// Accent renk YOK — vurgulu metinler arkadaki görselin kendisiyle
// dolduruluyor (background-clip:text).
export default function Atmosphere() {
  const [series, setSeries] = useState(null);
  const [episodeCount, setEpisodeCount] = useState(null);
  const sectionRef = useRef(null);
  const overlayRef = useRef(null);
  const contentRef = useRef(null);
  const eyebrowRef = useRef(null);
  const headlineRef = useRef(null);
  const statsRowRef = useRef(null);
  const applySharedBgRef = useRef(() => {});
  const statValueRefs = useRef([]);
  statValueRefs.current = [];
  const registerStatValueRef = (el) => {
    if (el) statValueRefs.current.push(el);
  };

  useEffect(() => {
    fetchProductionById('series', 9).then(setSeries);
  }, []);

  useEffect(() => {
    if (!series?.seasons?.length) {
      setEpisodeCount(null);
      return undefined;
    }
    let cancelled = false;
    Promise.all(series.seasons.map((s) => fetchSeasonDetail(s.id))).then((details) => {
      if (cancelled) return;
      setEpisodeCount(details.reduce((sum, d) => sum + (d.episodes?.length ?? 0), 0));
    });
    return () => {
      cancelled = true;
    };
  }, [series]);

  useLayoutEffect(() => {
    if (series == null) return undefined;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top bottom',
            end: 'top top',
            scrub: true,
          },
        });

        tl.to(overlayRef.current, { opacity: 1, ease: 'none' }, 0)
          .to(contentRef.current, { opacity: 1, ease: 'none' }, 0.5)
          .to(
            eyebrowRef.current,
            { x: 0, ease: 'none', onUpdate: () => applySharedBgRef.current() },
            0.5
          )
          .to(headlineRef.current, { x: 0, ease: 'none' }, 0.56)
          .to(
            statsRowRef.current,
            { x: 0, ease: 'none', onUpdate: () => applySharedBgRef.current() },
            0.62
          );
      });

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(overlayRef.current, { opacity: 1 });
        gsap.set(contentRef.current, { opacity: 1 });
        gsap.set([eyebrowRef.current, headlineRef.current, statsRowRef.current], {
          x: 0,
          clearProps: 'transform',
        });
      });
    }, sectionRef);

    const timerId = setTimeout(() => ScrollTrigger.refresh(), 120);

    return () => {
      clearTimeout(timerId);
      ctx.revert();
    };
  }, [series]);

  useLayoutEffect(() => {
    if (series == null) return undefined;
    const section = sectionRef.current;
    if (!section) return undefined;

    const nodes = [eyebrowRef.current, ...statValueRefs.current].filter(Boolean);

    const applyShared = () => {
      const sectionRect = section.getBoundingClientRect();
      nodes.forEach((el) => {
        const rect = el.getBoundingClientRect();
        el.style.backgroundSize = `${sectionRect.width}px ${sectionRect.height}px`;
        el.style.backgroundPosition = `${-(rect.left - sectionRect.left)}px ${-(rect.top - sectionRect.top)}px`;
      });
    };

    applySharedBgRef.current = applyShared;
    applyShared();
    window.addEventListener('resize', applyShared);
    return () => window.removeEventListener('resize', applyShared);
  }, [series, episodeCount]);

  if (series == null) return null;

  const seasonCount = series.seasons?.length ?? 0;
  const startYear = series.firstAirDate ? new Date(series.firstAirDate).getFullYear() : '';
  const endYear = series.lastAirDate ? new Date(series.lastAirDate).getFullYear() : 'Present';
  const onAir = startYear ? `${startYear}–${endYear}` : '';

  // DENEYSEL VERİ NOTU (Severance'daki AYNI karar): uydurma ödül sayısı
  // yerine gerçek veri olan externalRating kullanılıyor.
  const stats = [
    { value: seasonCount || '—', label: 'Seasons' },
    { value: episodeCount ?? '—', label: 'Episodes' },
    { value: onAir, label: 'On Air' },
    { value: series.externalRating ?? '—', label: 'IMDb Rating' },
    { value: 'MGM+', label: 'Network' },
  ];

  return (
    <section className={styles.atmosphere} ref={sectionRef}>
      <div className={styles.atmosphere__overlay} ref={overlayRef} />

      <div
        ref={contentRef}
        className={styles.atmosphere__content}
        style={{ '--atmosphere-image': `url("${series.coverImageUrl}")` }}
      >
        <p ref={eyebrowRef} className={styles.atmosphere__eyebrow}>No Way Out</p>
        <h2 ref={headlineRef} className={styles.atmosphere__headline}>
          A road leads into town. No road leads out. Something in the trees is always watching.
        </h2>

        <div ref={statsRowRef} className={styles.atmosphere__stats}>
          {stats.map((stat, i) => (
            <Fragment key={stat.label}>
              {i > 0 && <div className={styles.atmosphere__statDivider} />}
              <div className={styles.atmosphere__stat}>
                <p ref={registerStatValueRef} className={styles.atmosphere__statValue}>{stat.value}</p>
                <span className={styles.atmosphere__statLabel}>{stat.label}</span>
              </div>
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
