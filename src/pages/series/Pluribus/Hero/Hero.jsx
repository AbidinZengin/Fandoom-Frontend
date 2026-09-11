import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { isCinematicArmed } from '../../../../motion/cinematic';
import { fetchProductionById } from '../../../../shared/api/productions';
import { resolveGenreNames } from '../../../../shared/api/genres';
import { ContentActions } from '../../../../components/ContentActions/ContentActions';
import styles from './Hero.module.css';

// Severance/BreakingBad/HotD Hero'suyla BİREBİR aynı giriş deseni
// (kullanıcı isteği, 2026-09-11): `.hero` ortadan ince bir şeritten kapı
// gibi açılıyor; ARKA (blurlu, çerçeve DIŞI) katman counter-zoom ile
// oturuyor; ÖN (net, çerçeve İÇİ) görsel fade+rise ile beliriyor. Scroll
// parallax/scrub-fade YOK — görselin transform'unu scale ile AYNI ANDA
// yazınca "genişleyip bükülüyormuş" gibi bozuk görünüyordu (kullanıcı
// raporu, Severance'ta denendi). Tüm dizilerde Explore butonu BİREBİR
// aynı ok ikonunu kullanır.
function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3.33" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="4.5" y1="12" x2="19" y2="12" />
      <polyline points="13.5 6.5 19.5 12 13.5 17.5" />
    </svg>
  );
}

export default function Hero() {
  const [series, setSeries] = useState(null);
  const [genreNames, setGenreNames] = useState([]);
  const pageRef = useRef(null);
  const backdropRef = useRef(null);
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
    fetchProductionById('series', 8).then(setSeries);
  }, []);

  useEffect(() => {
    if (!series?.genreIds?.length) {
      setGenreNames([]);
      return undefined;
    }
    let cancelled = false;
    resolveGenreNames(series.genreIds).then((names) => {
      if (!cancelled) setGenreNames(names);
    });
    return () => {
      cancelled = true;
    };
  }, [series]);

  useLayoutEffect(() => {
    if (series == null) return undefined;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      const ratingGroup = [ratingValueRef.current, ratingLogoRef.current];

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        if (isCinematicArmed()) {
          const tl = gsap.timeline({ defaults: { ease: 'power2.out', clearProps: 'opacity,transform' } });

          tl.fromTo(
            pageRef.current,
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
            .from(titleRef.current, { opacity: 0, y: 28, duration: 0.9 }, 0.6)
            .from(metaRef.current, { opacity: 0, y: 14, duration: 0.6 }, 0.82)
            .from(ratingGroup, { opacity: 0, y: 14, duration: 0.6 }, 0.88)
            .from(synopsisRef.current, { opacity: 0, y: 16, duration: 0.7 }, 0.94)
            .from(
              [actionsRef.current, ctaSecondaryRef.current, ctaPrimaryRef.current],
              { opacity: 0, y: 14, duration: 0.6, stagger: 0.08 },
              1.15
            );
        } else {
          const tl = gsap.timeline({ defaults: { ease: 'power2.out', clearProps: 'opacity,transform' } });

          tl.from(backdropRef.current, { opacity: 0, duration: 1.1 }, 0)
            .from(imageRef.current, { opacity: 0, y: 28, duration: 1, ease: 'power3.out' }, 0.15)
            .from(titleRef.current, { opacity: 0, y: 28, duration: 0.9 }, 0.4)
            .from(metaRef.current, { opacity: 0, y: 14, duration: 0.6 }, 0.62)
            .from(ratingGroup, { opacity: 0, y: 14, duration: 0.6 }, 0.68)
            .from(synopsisRef.current, { opacity: 0, y: 16, duration: 0.7 }, 0.74)
            .from(
              [actionsRef.current, ctaSecondaryRef.current, ctaPrimaryRef.current],
              { opacity: 0, y: 14, duration: 0.6, stagger: 0.08 },
              0.95
            );
        }
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
  }, [series]);

  if (series == null) return null;

  const year = series?.firstAirDate ? new Date(series.firstAirDate).getFullYear() : '';

  return (
    <section className={styles.hero} ref={pageRef}>
      <img ref={backdropRef} className={styles.hero__backdrop} src={series.coverImageUrl} alt="" />
      <div className={styles.hero__frame}>
        <img ref={imageRef} className={styles.hero__image} src={series.coverImageUrl} alt="" />
        <div className={styles.hero__scrim} />

        <div className={styles.hero__ratingBadge}>
          <span ref={ratingValueRef} className={styles.hero__ratingValue}>{series.externalRating}</span>
          <img ref={ratingLogoRef} className={styles.hero__ratingLogo} src="/src/assets/logos/IMDB_Logo_2016.svg.webp" alt="IMDB Logo 2016.Svg" />
        </div>

        <div className={styles.hero__content}>
          <h1 ref={titleRef} className={styles.hero__title}>{series.title}</h1>
          <div ref={metaRef} className={styles.hero__meta}>
            <span className={styles.hero__year}>{year}</span>
            <span className={styles.hero__genres}>{genreNames.join(' · ')}</span>
          </div>
          <p ref={synopsisRef} className={styles.hero__synopsis}>{series.synopsis}</p>
          <div className={styles.hero__cta}>
            <button ref={ctaSecondaryRef} type="button" className={styles.hero__ctaSecondary}>
              Explore <ArrowIcon />
            </button>
            <button ref={ctaPrimaryRef} type="button" className={styles.hero__ctaPrimary}>
              {'▶  Watch Trailer'}
            </button>
          </div>
          <div ref={actionsRef} className={styles.hero__actions}>
            <ContentActions
              itemId={series.id}
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
