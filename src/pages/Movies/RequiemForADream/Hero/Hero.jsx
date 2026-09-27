import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { isCinematicArmed } from '../../../../motion/cinematic';
import { fetchProductionById } from '../../../../shared/api/productions';
import { MOVIE_ID } from '../RequiemForADream.data';
import { resolveGenreNames } from '../../../../shared/api/genres';
import { ContentActions } from '../../../../components/ContentActions/ContentActions';
import imdbLogo from '../../../../assets/logos/IMDB_Logo_2016.svg.webp';
import titleLogo from '../../../../assets/logos/requiem-for-a-dream.webp';
import styles from './Hero.module.css';

// Pluribus/Severance/BreakingBad/HotD/MulhollandDrive/Zodiac Hero'suyla
// BİREBİR aynı giriş deseni: `.hero` ortadan ince bir şeritten kapı gibi
// açılıyor; ARKA (blurlu, çerçeve DIŞI) katman counter-zoom ile oturuyor;
// ÖN (net, çerçeve İÇİ) görsel fade+rise ile beliriyor. Scroll parallax/
// scrub-fade YOK. Tüm yapımlarda Explore butonu BİREBİR aynı ok ikonunu kullanır.
function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3.33" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="4.5" y1="12" x2="19" y2="12" />
      <polyline points="13.5 6.5 19.5 12 13.5 17.5" />
    </svg>
  );
}

export default function Hero({ backdropRef = { current: null } }) {
  const [movie, setMovie] = useState(null);
  const [genreNames, setGenreNames] = useState([]);
  const pageRef = useRef(null);
  const imageRef = useRef(null);
  const contentRef = useRef(null);
  const titleRef = useRef(null);
  const metaRef = useRef(null);
  const ratingLogoRef = useRef(null);
  const ratingValueRef = useRef(null);
  const synopsisRef = useRef(null);
  const ctaPrimaryRef = useRef(null);
  const ctaSecondaryRef = useRef(null);
  const actionsRef = useRef(null);

  useEffect(() => {
    fetchProductionById('movie', MOVIE_ID).then(setMovie);
  }, []);

  useEffect(() => {
    if (!movie?.genreIds?.length) {
      setGenreNames([]);
      return undefined;
    }
    let cancelled = false;
    resolveGenreNames(movie.genreIds).then((names) => {
      if (!cancelled) setGenreNames(names);
    });
    return () => {
      cancelled = true;
    };
  }, [movie]);

  useLayoutEffect(() => {
    if (movie == null) return undefined;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      const ratingGroup = [ratingValueRef.current, ratingLogoRef.current];

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        if (isCinematicArmed()) {
          const tl = gsap.timeline({ defaults: { ease: 'power2.out', clearProps: 'opacity,transform' } });
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
            .from(titleRef.current, { opacity: 0, scale: 0.92, transformOrigin: '0% 50%', duration: 0.9, clearProps: 'opacity,transform,transformOrigin' }, 0.6)
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
            .from(titleRef.current, { opacity: 0, scale: 0.92, transformOrigin: '0% 50%', duration: 0.9, clearProps: 'opacity,transform,transformOrigin' }, 0.4)
            .from(metaRef.current, { opacity: 0, y: 14, duration: 0.6 }, 0.62)
            .from(ratingGroup, { opacity: 0, y: 14, duration: 0.6 }, 0.68)
            .from(synopsisRef.current, { opacity: 0, y: 16, duration: 0.7 }, 0.74)
            .from(
              [actionsRef.current, ctaSecondaryRef.current, ctaPrimaryRef.current],
              { opacity: 0, y: 14, duration: 0.6, stagger: 0.08 },
              0.95
            );
        }

        // Scrub-fade: SADECE içerik (metinler) — Atmosphere'e geçerken
        // tetiklenir. Görselin kendisi (backdrop/image) dokunulmuyor.
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
  }, [movie, backdropRef]);

  if (movie == null) return null;

  const year = movie?.releaseDate ? new Date(movie.releaseDate).getFullYear() : '';

  return (
    <section className={styles.hero} ref={pageRef}>
      <div className={styles.hero__frame}>
        <img ref={imageRef} className={styles.hero__image} src={movie.coverImageUrl} alt="" />
        <div className={styles.hero__scrim} />

        <div className={styles.hero__ratingBadge}>
          <span ref={ratingValueRef} className={styles.hero__ratingValue}>{movie.externalRating}</span>
          <img ref={ratingLogoRef} className={styles.hero__ratingLogo} src={imdbLogo} alt="IMDb" />
        </div>

        <div ref={contentRef} className={styles.hero__content}>
          <h1 ref={titleRef} className={styles.hero__title}>
            <img className={styles.hero__logo} src={titleLogo} alt={movie.title} />
          </h1>
          <div ref={metaRef} className={styles.hero__meta}>
            <span className={styles.hero__year}>{year}</span>
            <span className={styles.hero__genres}>{genreNames.join(' · ')}</span>
          </div>
          <p ref={synopsisRef} className={styles.hero__synopsis}>{movie.synopsis}</p>
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
              itemId={movie.id}
              itemType="MOVIE"
              isProduction
              only={['like', 'save', 'follow', 'addToList']}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
