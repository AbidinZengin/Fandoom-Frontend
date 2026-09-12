import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { fetchProductionById } from '../../../../shared/api/productions';
import { resolveGenreNames } from '../../../../shared/api/genres';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { isCinematicArmed } from '../../../../motion/cinematic';
import { ContentActions } from '../../../../components/ContentActions/ContentActions';
import styles from './Hero.module.css';

// Severance Hero şablonuyla BİREBİR aynı yapı (kullanıcı isteği,
// 2026-09-11) — GSAP giriş animasyonu + FeaturedCarousel'den gelen
// cinematic geçiş (isCinematicArmed) KORUNDU, hedef elementler yeni
// yapıya (backdrop+frame/image, title, meta, actions) taşındı.
// Logo (house-of-the-dragon.webp) kaldırıldı — zaten ayrı bir metin
// başlık (textBlock1) vardı, artık TEK başlık (h1). ContentActions bu
// Hero'da hiç yoktu — diğer dizilerle tutarlılık için eklendi.
function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3.33" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="4.5" y1="12" x2="19" y2="12" />
      <polyline points="13.5 6.5 19.5 12 13.5 17.5" />
    </svg>
  );
}

export default function Hero({ backdropRef = { current: null } }) {
  const [series6, setSeries6] = useState(null);
  const [genreNames, setGenreNames] = useState([]);
  const pageRef = useRef(null);
  const contentRef = useRef(null);
  const imageRef = useRef(null);
  const titleRef = useRef(null);
  const metaRef = useRef(null);
  const ratingLogoRef = useRef(null);
  const ratingValueRef = useRef(null);
  const synopsisRef = useRef(null);
  const ctaPrimaryRef = useRef(null);
  const ctaSecondaryRef = useRef(null);
  const actionsRef = useRef(null);

  useEffect(() => {
    fetchProductionById('series', 6).then(setSeries6);
  }, []);

  // genreNames backend'den DÖNMÜYOR (yalnız genreIds) — ProductionDetail/
  // SeriesHero'daki AYNI çözümleme burada da gerekli, aksi halde tür hiç
  // görünmüyordu (kullanıcı raporu, 2026-09-05).
  useEffect(() => {
    if (!series6?.genreIds?.length) {
      setGenreNames([]);
      return undefined;
    }
    let cancelled = false;
    resolveGenreNames(series6.genreIds).then((names) => {
      if (!cancelled) setGenreNames(names);
    });
    return () => {
      cancelled = true;
    };
  }, [series6]);

  useLayoutEffect(() => {
    if (series6 == null) return undefined;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      const ratingGroup = [ratingValueRef.current, ratingLogoRef.current];

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        if (isCinematicArmed()) {
          const tl = gsap.timeline({ defaults: { ease: 'power2.out', clearProps: 'opacity,transform' } });

          // Backdrop artık Hero'nun DIŞINDA (Atmosphere ile paylaşım için
          // ata konteynere taşındı) — kapı kapanışı sadece Hero'yu değil
          // backdrop+Hero'yu saran .intro'yu hedeflemeli, aksi halde
          // backdrop kapı aralığının dışında hemen tam görünür.
          const doorTarget = backdropRef.current?.parentElement ?? pageRef.current;

          tl.fromTo(
            doorTarget,
            { clipPath: 'inset(0% 49.75% 0% 49.75%)' },
            { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.55, ease: 'power3.in', clearProps: 'clipPath' },
            0
          )
            .fromTo(
              backdropRef.current,
              { scale: 1.5 },
              { scale: 1, duration: 0.95, ease: 'power2.out', clearProps: 'transform' },
              0
            )
            .from(imageRef.current, { opacity: 0, y: 28, duration: 1, ease: 'power3.out' }, 0.3)
            .from(titleRef.current, { opacity: 0, y: 20, duration: 0.8 }, 0.6)
            .from(metaRef.current, { opacity: 0, y: 14, duration: 0.6 }, 0.9)
            .from(ratingGroup, { opacity: 0, y: 14, duration: 0.6 }, 0.96)
            .from(synopsisRef.current, { opacity: 0, y: 16, duration: 0.7 }, 1.02)
            .from(
              [actionsRef.current, ctaSecondaryRef.current, ctaPrimaryRef.current],
              { opacity: 0, y: 14, duration: 0.6, stagger: 0.08 },
              1.22
            );
        } else {
          const tl = gsap.timeline({ defaults: { ease: 'power2.out', clearProps: 'opacity,transform' } });

          tl.from(backdropRef.current, { opacity: 0, duration: 1.1 }, 0)
            .from(imageRef.current, { opacity: 0, y: 28, duration: 1, ease: 'power3.out' }, 0.15)
            .from(titleRef.current, { opacity: 0, y: 20, duration: 0.8 }, 0.4)
            .from(metaRef.current, { opacity: 0, y: 14, duration: 0.6 }, 0.7)
            .from(ratingGroup, { opacity: 0, y: 14, duration: 0.6 }, 0.76)
            .from(synopsisRef.current, { opacity: 0, y: 16, duration: 0.7 }, 0.82)
            .from(
              [actionsRef.current, ctaSecondaryRef.current, ctaPrimaryRef.current],
              { opacity: 0, y: 14, duration: 0.6, stagger: 0.08 },
              1.02
            );
        }

        // Scrub-fade: Atmosphere'e geçerken içerik (metinler) yukarı kayıp
        // solar — Severance Hero'daki AYNI teknik/aralık. Görselin kendisine
        // (backdrop/image) dokunulmuyor.
        gsap.fromTo(
          contentRef.current,
          { opacity: 1, y: 0 },
          {
            opacity: 0,
            y: -60,
            ease: 'none',
            immediateRender: false,
            scrollTrigger: {
              trigger: pageRef.current,
              start: '15% top',
              end: '65% top',
              scrub: true,
            },
          }
        );
      });

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(
          [
            backdropRef.current,
            imageRef.current,
            titleRef.current,
            metaRef.current,
            ...ratingGroup,
            synopsisRef.current,
            actionsRef.current,
            ctaSecondaryRef.current,
            ctaPrimaryRef.current,
          ],
          { opacity: 1, y: 0, clearProps: 'transform' }
        );
      });
    }, pageRef);

    const timerId = setTimeout(() => ScrollTrigger.refresh(), 120);

    return () => {
      clearTimeout(timerId);
      ctx.revert();
    };
  }, [series6, backdropRef]);

  // TODO: Replace null with a Skeleton UI if needed.
  if (series6 == null) return null;

  const year = series6?.firstAirDate ? new Date(series6.firstAirDate).getFullYear() : '';

  return (
    <section className={styles.hero} ref={pageRef}>
      <div className={styles.hero__frame}>
        <img ref={imageRef} className={styles.hero__image} src={series6.coverImageUrl} alt="" />
        <div className={styles.hero__scrim} />

        <div className={styles.hero__ratingBadge}>
          <span ref={ratingValueRef} className={styles.hero__ratingValue}>{series6.externalRating}</span>
          <img ref={ratingLogoRef} className={styles.hero__ratingLogo} src="/src/assets/logos/IMDB_Logo_2016.svg.webp" alt="IMDB Logo 2016.Svg" />
        </div>

        <div ref={contentRef} className={styles.hero__content}>
          <h1 ref={titleRef} className={styles.hero__title}>{series6.title}</h1>
          <div ref={metaRef} className={styles.hero__meta}>
            <span className={styles.hero__year}>{year}</span>
            <span className={styles.hero__genres}>{genreNames.join(' · ')}</span>
          </div>
          <p ref={synopsisRef} className={styles.hero__synopsis}>{series6.synopsis}</p>
          <div className={styles.hero__cta}>
            <Link ref={ctaSecondaryRef} to="/series/house-of-the-dragon/seasons" className={styles.hero__ctaSecondary}>
              Explore <ArrowIcon />
            </Link>
            <button ref={ctaPrimaryRef} type="button" className={styles.hero__ctaPrimary}>
              {'▶  Watch Trailer'}
            </button>
          </div>
          <div ref={actionsRef} className={styles.hero__actions}>
            <ContentActions
              itemId={series6.id}
              itemType="SERIES"
              isProduction
              only={['like', 'save', 'follow', 'addToList']}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
