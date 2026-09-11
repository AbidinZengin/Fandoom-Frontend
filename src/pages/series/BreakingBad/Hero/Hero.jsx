import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ENTITY_SCHEMAS } from '../../../../shared/builder/entitySchemas';
import { isCinematicArmed } from '../../../../motion/cinematic';
import { LocalizedLink as Link } from '../../../../shared/i18n/LocalizedLink';
import { ContentActions } from '../../../../components/ContentActions/ContentActions';
import styles from './Hero.module.css';

// Severance Hero şablonuyla BİREBİR aynı yapı (kullanıcı isteği,
// 2026-09-11) — GSAP giriş animasyonu + FeaturedCarousel'den gelen
// cinematic geçiş (isCinematicArmed) KORUNDU, sadece hedef elementler
// yeni yapıya (backdrop+frame/image, title, meta, actions) taşındı.
// Logo (breaking-bad.svg) kaldırıldı — diğer dizilerle aynı metin başlık.
// Yıldız ikonu + ayrı rating text kaldırıldı — tek IMDb rozeti (diğer
// dizilerle aynı). Sabit Cloudinary görselleri yerine series5.coverImageUrl
// kullanılıyor (diğer dizilerle aynı, data-driven).
function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3.33" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="4.5" y1="12" x2="19" y2="12" />
      <polyline points="13.5 6.5 19.5 12 13.5 17.5" />
    </svg>
  );
}

export default function Hero() {
  const [series5, setSeries5] = useState(null);
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
    ENTITY_SCHEMAS.series.fetch(5).then(setSeries5);
  }, []);

  useLayoutEffect(() => {
    if (series5 == null) return undefined;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      const ratingGroup = [ratingValueRef.current, ratingLogoRef.current];

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        if (isCinematicArmed()) {
          // Cinematic devir (FeaturedCarousel'den gelen): 1) `.hero` merkezden
          // ince dikey şerit tüm ekrana açılır 2) zemin görseli counter-zoom
          // ile oturur 3) içerik AYNI kademeyle ama şerit açıldıktan sonra
          // (GoT Hero'nun cinematic dalıyla birebir aynı imza).
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
          return;
        }

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

    // Hero, SeasonRoute'tan bağımsız bir fetch ile async mount olur —
    // SeasonRoute kendi ScrollTrigger'larını Hero henüz DOM'a girmeden
    // (0 yükseklik) ölçmüş olabilir (negatif start/end, "animasyon yok"
    // bug'ı — canlı test: rAF tek kare yetmiyor, StrictMode'un mount->
    // cleanup->mount döngüsü de rAF'ı iptal edebiliyor). setTimeout hem
    // StrictMode'un senkron temizliğinden sağ çıkıyor hem de gerçek
    // dünyada iki bağımsız fetch'in arasındaki gecikmeyi karşılıyor.
    const timerId = setTimeout(() => ScrollTrigger.refresh(), 120);

    return () => {
      clearTimeout(timerId);
      ctx.revert();
    };
  }, [series5]);

  // TODO: Replace null with a Skeleton UI if needed.
  if (series5 == null) return null;

  const year = series5?.firstAirDate ? new Date(series5.firstAirDate).getFullYear() : '';

  return (
    <section className={styles.hero} ref={pageRef}>
      <img ref={backdropRef} className={styles.hero__backdrop} src={series5.coverImageUrl} alt="" />
      <div className={styles.hero__frame}>
        <img ref={imageRef} className={styles.hero__image} src={series5.coverImageUrl} alt="" />
        <div className={styles.hero__scrim} />

        <div className={styles.hero__ratingBadge}>
          <span ref={ratingValueRef} className={styles.hero__ratingValue}>{series5.externalRating}</span>
          <img ref={ratingLogoRef} className={styles.hero__ratingLogo} src="/src/assets/logos/IMDB_Logo_2016.svg.webp" alt="IMDB Logo 2016.Svg" />
        </div>

        <div className={styles.hero__content}>
          <h1 ref={titleRef} className={styles.hero__title}>{series5.title}</h1>
          <div ref={metaRef} className={styles.hero__meta}>
            <span className={styles.hero__year}>{year}</span>
            <span className={styles.hero__genres}>{series5.genreNames}</span>
          </div>
          <p ref={synopsisRef} className={styles.hero__synopsis}>{series5.synopsis}</p>
          <div className={styles.hero__cta}>
            <Link ref={ctaSecondaryRef} to="/series/breaking-bad/seasons" className={styles.hero__ctaSecondary}>
              Explore <ArrowIcon />
            </Link>
            <Link ref={ctaPrimaryRef} to="https://www.youtube.com/watch?v=HhesaQXLuRY" className={styles.hero__ctaPrimary}>
              {'▶  Watch Trailer'}
            </Link>
          </div>
          <div ref={actionsRef} className={styles.hero__actions}>
            <ContentActions
              itemId={series5.id}
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
