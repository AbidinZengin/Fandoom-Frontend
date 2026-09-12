import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { fetchProductionById, fetchSeasonDetail } from '../../../../shared/api/productions';
import styles from './Atmosphere.module.css';

// Severance'taki Atmosphere ile YAPISAL olarak birebir aynı (2026-09-12
// rollout) — kendi blurlu arka planı YOK, BreakingBad.jsx'te Hero ile
// PAYLAŞILAN tek görsele taşındı. overlay (opacity 0→1) scroll'la siyaha
// kararır; kararma bitmeden hemen önce bu bölümün kendi içeriği
// (eyebrow/başlık/istatistikler) belirir. Accent renk YOK — vurgulu
// metinler (eyebrow + istatistik değerleri) arkadaki görselin kendisiyle
// dolduruluyor (background-clip:text).
//
// VERİ NOTU: Episode sayısı backend'de series detail'da toplu gelmiyor —
// her sezonu ayrı ayrı çekip episodes.length toplanıyor. 4. istatistik
// Severance'taki gibi uydurma bir ödül sayısı DEĞİL — gerçek veri olan
// externalRating (IMDb puanı) kullanılıyor.
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
    fetchProductionById('series', 5).then(setSeries);
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

        // Konteyner SADECE opacity. Yazı grupları (eyebrow/headline/stats)
        // ayrıca soldan açığa çıkıyor (x:-64→0) — eyebrow ve stat değerleri
        // background-clip:text kullandığı için onUpdate'te
        // applySharedBgRef.current() çağrılıp paylaşılan koordinat HER
        // karede yeniden hesaplanıyor (tek seferlik hesap, içerik transform
        // alınca bayatlıyordu — bkz. aşağıdaki effect'in yorumu).
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

  // TEK paylaşılan koordinat sistemi — her accent metnin background-size/
  // -position'ı JS'te, section'ın KENDİ kutusuna göre elle hesaplanıyor —
  // section tek "büyük görsel", her metin ondan SABİT pixel offset'iyle
  // kırpılan bir pencere. applySharedBgRef'e de atanıyor ki GSAP timeline'ı
  // (yukarıdaki effect) eyebrow/stats soldan kayarken bu hesabı HER karede
  // tekrar çağırabilsin.
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

  const stats = [
    { value: seasonCount || '—', label: 'Seasons' },
    { value: episodeCount ?? '—', label: 'Episodes' },
    { value: onAir, label: 'On Air' },
    { value: series.externalRating ?? '—', label: 'IMDb Rating' },
    { value: 'AMC', label: 'Network' },
  ];

  return (
    <section className={styles.atmosphere} ref={sectionRef}>
      <div className={styles.atmosphere__overlay} ref={overlayRef} />

      <div
        ref={contentRef}
        className={styles.atmosphere__content}
        style={{ '--atmosphere-image': `url("${series.coverImageUrl}")` }}
      >
        <p ref={eyebrowRef} className={styles.atmosphere__eyebrow}>An Empire Built On Chemistry</p>
        <h2 ref={headlineRef} className={styles.atmosphere__headline}>
          A high school teacher turned kingpin. One choice, and everything after it.
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
