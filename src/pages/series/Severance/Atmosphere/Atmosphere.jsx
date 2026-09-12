import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { fetchProductionById, fetchSeasonDetail } from '../../../../shared/api/productions';
import styles from './Atmosphere.module.css';

// Deneysel bölüm (kullanıcı isteği, 2026-09-12) — ŞU AN SADECE Severance'ta,
// diğer dizilere henüz uygulanmadı. Kendi blurlu arka planı YOK —
// Severance.jsx'te Hero ile PAYLAŞILAN tek bir görsele taşındı (kullanıcı
// raporu: iki bölümün ayrı arka planları arasında dikiş/yüzey farkı
// vardı), o görsel bu section'ın arkasından geçiyor; overlay (opacity
// 0→1) scroll'la siyaha kararır; kararma bitmeden hemen önce bu bölümün
// kendi içeriği (eyebrow/başlık/istatistikler) belirir. Accent renk YOK —
// vurgulu metinler (eyebrow + istatistik değerleri) arkadaki görselin
// kendisiyle dolduruluyor (background-clip:text).
//
// DENEYSEL VERİ NOTU: Emmy/Network alanları backend şemasında yok — kullanıcı
// kararıyla (2026-09-12) elle/yaklaşık girildi, şema genişleyince gerçek
// veriye bağlanmalı. Episode sayısı backend'de series detail'da toplu
// gelmiyor — her sezonu ayrı ayrı çekip episodes.length toplanıyor.
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
    fetchProductionById('series', 7).then(setSeries);
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
        // ayrıca soldan açığa çıkıyor (x:-64→0, kullanıcı isteği,
        // 2026-09-12) — eyebrow ve stat değerleri background-clip:text
        // kullandığı için onUpdate'te applySharedBgRef.current() çağrılıp
        // paylaşılan koordinat HER karede yeniden hesaplanıyor (tek seferlik
        // hesap, içerik transform alınca bayatlıyordu — bkz. aşağıdaki
        // effect'in yorumu).
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

  // TEK paylaşılan koordinat sistemi — background-attachment:fixed
  // DENENDİ ama background-clip:text ile güvenilir çalışmadı (kanıt:
  // degrade test görseliyle her element KENDİ kutusuna göre "cover"
  // yapıyordu, farklı pencereler farklı renk aralıkları gösteriyordu —
  // kullanıcı raporu: "farklı imagelerden yararlanıyor"). Bunun yerine
  // her accent metnin background-size/-position'ı JS'te, section'ın
  // KENDİ kutusuna göre elle hesaplanıyor — section tek "büyük görsel",
  // her metin ondan SABİT pixel offset'iyle kırpılan bir pencere.
  // applySharedBgRef'e de atanıyor ki GSAP timeline'ı (yukarıdaki effect)
  // eyebrow/stats soldan kayarken bu hesabı HER karede tekrar çağırabilsin
  // — tek seferlik hesap, transform devam ederken bayatlıyordu.
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
    // DENEYSEL — bkz. dosya başı not.
    { value: '2', label: 'Emmy Awards' },
    { value: 'Apple TV+', label: 'Network' },
  ];

  return (
    <section className={styles.atmosphere} ref={sectionRef}>
      <div className={styles.atmosphere__overlay} ref={overlayRef} />

      <div
        ref={contentRef}
        className={styles.atmosphere__content}
        style={{ '--atmosphere-image': `url("${series.coverImageUrl}")` }}
      >
        <p ref={eyebrowRef} className={styles.atmosphere__eyebrow}>A Severed Existence</p>
        <h2 ref={headlineRef} className={styles.atmosphere__headline}>
          One mind, split in two. Two lives that will never meet. A company that owns both.
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
