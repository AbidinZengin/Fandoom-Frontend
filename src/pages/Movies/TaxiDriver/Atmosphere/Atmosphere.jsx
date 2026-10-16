import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { fetchDirectorNames } from './Atmosphere.data';
import styles from './Atmosphere.module.css';

// Series Atmosphere'inin film karşılığı — kendi arka planı YOK, Parasite.jsx'teki
// .intro (Hero ile PAYLAŞILAN tek görsel) bu section'ın arkasından geçer;
// overlay scroll'la siyaha kararır, kararma bitmeden içerik belirir. Vurgulu
// metinler arkadaki görselle dolar (background-clip:text), accent YOK.
// Veri prop olarak gelir (Parasite.jsx zaten film detayını çekiyor); manşet
// backend'deki tagline alanıdır, eyebrow opsiyoneldir (verilmezse gizli).
const formatRuntime = (min) => (min ? `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, '0')}m` : '—');

const formatCountry = (code) => {
  if (!code) return '—';
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
};

export default function Atmosphere({ movie, eyebrow }) {
  const [directors, setDirectors] = useState(null);
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
    let cancelled = false;
    fetchDirectorNames(movie.directorIds).then((names) => {
      if (!cancelled) setDirectors(names);
    });
    return () => {
      cancelled = true;
    };
  }, [movie.directorIds]);

  useLayoutEffect(() => {
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

        tl.to(overlayRef.current, { opacity: 1, ease: 'none' }, 0).to(contentRef.current, { opacity: 1, ease: 'none' }, 0.5);
        if (eyebrowRef.current) {
          tl.to(eyebrowRef.current, { x: 0, ease: 'none', onUpdate: () => applySharedBgRef.current() }, 0.5);
        }
        tl.to(headlineRef.current, { x: 0, ease: 'none' }, 0.56).to(
          statsRowRef.current,
          { x: 0, ease: 'none', onUpdate: () => applySharedBgRef.current() },
          0.62
        );
      });

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(overlayRef.current, { opacity: 1 });
        gsap.set(contentRef.current, { opacity: 1 });
        gsap.set([eyebrowRef.current, headlineRef.current, statsRowRef.current].filter(Boolean), {
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
  }, []);

  // Vurgulu metinlerin arka plan görseli section boyutuna sabitlenir, her
  // düğümün konumuna göre kaydırılır (paylaşılan arka plan illüzyonu).
  useLayoutEffect(() => {
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
  }, [directors]);

  const releaseYear = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : '—';

  // Yönetmen yüklenene (veya backend'de tanımsızsa) '—' gösterilir.
  const stats = [
    { value: directors?.length ? directors.join(', ') : '—', label: 'Director' },
    { value: releaseYear, label: 'Released' },
    { value: formatRuntime(movie.runtimeMinutes), label: 'Runtime' },
    { value: formatCountry(movie.originCountry), label: 'Country' },
  ];

  return (
    <section className={styles.atmosphere} ref={sectionRef}>
      <div className={styles.atmosphere__overlay} ref={overlayRef} />

      <div
        ref={contentRef}
        className={styles.atmosphere__content}
        style={{ '--atmosphere-image': `url("${movie.coverImageUrl}")` }}
      >
        {eyebrow && (
          <p ref={eyebrowRef} className={styles.atmosphere__eyebrow}>
            {eyebrow}
          </p>
        )}
        <h2 ref={headlineRef} className={styles.atmosphere__headline}>
          {movie.tagline}
        </h2>

        <div ref={statsRowRef} className={styles.atmosphere__stats}>
          {stats.map((stat, i) => (
            <Fragment key={stat.label}>
              {i > 0 && <div className={styles.atmosphere__statDivider} />}
              <div className={styles.atmosphere__stat}>
                <p ref={registerStatValueRef} className={styles.atmosphere__statValue}>
                  {stat.value}
                </p>
                <span className={styles.atmosphere__statLabel}>{stat.label}</span>
              </div>
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
