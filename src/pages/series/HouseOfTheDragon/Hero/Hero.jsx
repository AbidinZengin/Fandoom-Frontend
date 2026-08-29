import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ENTITY_SCHEMAS } from '../../../../shared/builder/entitySchemas';
import { isCinematicArmed } from '../../../../motion/cinematic';
import { LocalizedLink as Link } from '../../../../shared/i18n/LocalizedLink';
import { ContentActions } from '../../../../components/ContentActions/ContentActions';
import styles from './Hero.module.css';

// PageBuilder "Kodu Üret" ile oluşturuldu — bu noktadan sonra normal
// proje kodu, elle düzenlenebilir (GSAP/motion elle eklenir).
// Layout/konum/boyut ORİJİNAL codegen çıktısıyla AYNI (kullanıcı düzeltmesi:
// "logonun yerlerini değiştirme, tek yapman gereken boyutlandırmaydı") —
// sadece iki fonksiyonel düzeltme var: (1) ham fetchProductionById yerine
// ENTITY_SCHEMAS.series.fetch (withGenreNames sarmalayıcısı, BB Hero'daki
// aynı düzeltme) — genre artık boş gelmiyor. (2) butonlar boş metin/href'siz
// "göstermelik" idi — artık gerçek Link (trailer YouTube URL'i + seasons
// route'u).
// DÜZELTME (manuel): açılış animasyonu eklendi — Breaking Bad Hero'nun
// giriş deseni (zemin+ön plan görsel → logo → künye → puan → sinopsis →
// butonlar kademeli, power2.out, cinematic tempo) birebir buraya taşındı.
// HotD artık FeaturedCarousel'in CINEMATIC_SLUGS listesinde de var —
// isCinematicArmed() dalı BB Hero'nun aynısı: `.page` merkezden dikey
// şeritle açılır, zemin görseli counter-zoom ile oturur, içerik kademesi
// aynı offsetlerle ama şerit açıldıktan sonra başlar.
export default function Hero() {
  const { t } = useTranslation();
  const [series6, setSeries6] = useState(null);
  const pageRef = useRef(null);
  const imageBlock1Ref = useRef(null);
  const imageBlock2Ref = useRef(null);
  const logoRef = useRef(null);
  const titleRef = useRef(null);
  const yearRef = useRef(null);
  const genreRef = useRef(null);
  const imdbLogoRef = useRef(null);
  const ratingTextRef = useRef(null);
  const synopsisRef = useRef(null);
  const trailerBtnRef = useRef(null);
  const seasonsBtnRef = useRef(null);
  const actionsRef = useRef(null);

  useEffect(() => {
    ENTITY_SCHEMAS.series.fetch(6).then(setSeries6);
  }, []);

  useLayoutEffect(() => {
    if (series6 == null) return undefined;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      const metaGroup = [yearRef.current, genreRef.current];
      const ratingGroup = [imdbLogoRef.current, ratingTextRef.current];

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        if (isCinematicArmed()) {
          // Cinematic devir (FeaturedCarousel'den gelen): 1) `.page` merkezden
          // ince dikey şerit tüm ekrana açılır 2) zemin görseli counter-zoom
          // ile oturur 3) içerik AYNI kademeyle ama şerit açıldıktan sonra
          // (GoT/BB Hero'nun cinematic dalıyla birebir aynı imza).
          const tl = gsap.timeline({ defaults: { ease: 'power2.out', clearProps: 'opacity,transform' } });

          tl.fromTo(
            pageRef.current,
            { clipPath: 'inset(0% 49.75% 0% 49.75%)' },
            { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.55, ease: 'power3.in', clearProps: 'clipPath' },
            0
          )
            .fromTo(
              imageBlock1Ref.current,
              { scale: 1.5 },
              { scale: 1, duration: 0.95, ease: 'power2.out', clearProps: 'transform' },
              0
            )
            .from(imageBlock2Ref.current, { opacity: 0, y: 28, duration: 1, ease: 'power3.out' }, 0.3)
            .from(logoRef.current, { opacity: 0, y: 28, duration: 0.9 }, 0.6)
            .from(titleRef.current, { opacity: 0, y: 20, duration: 0.8 }, 0.75)
            .from(metaGroup, { opacity: 0, y: 14, duration: 0.6 }, 0.9)
            .from(ratingGroup, { opacity: 0, y: 14, duration: 0.6 }, 0.96)
            .from(synopsisRef.current, { opacity: 0, y: 16, duration: 0.7 }, 1.02)
            .from(
              [actionsRef.current, trailerBtnRef.current, seasonsBtnRef.current],
              { opacity: 0, y: 14, duration: 0.6, stagger: 0.08 },
              1.22
            );
          return;
        }

        const tl = gsap.timeline({ defaults: { ease: 'power2.out', clearProps: 'opacity,transform' } });

        tl.from(imageBlock1Ref.current, { opacity: 0, duration: 1.1 }, 0)
          .from(imageBlock2Ref.current, { opacity: 0, y: 28, duration: 1, ease: 'power3.out' }, 0.15)
          .from(logoRef.current, { opacity: 0, y: 28, duration: 0.9 }, 0.4)
          .from(titleRef.current, { opacity: 0, y: 20, duration: 0.8 }, 0.55)
          .from(metaGroup, { opacity: 0, y: 14, duration: 0.6 }, 0.7)
          .from(ratingGroup, { opacity: 0, y: 14, duration: 0.6 }, 0.76)
          .from(synopsisRef.current, { opacity: 0, y: 16, duration: 0.7 }, 0.82)
          .from(
            [actionsRef.current, trailerBtnRef.current, seasonsBtnRef.current],
            { opacity: 0, y: 14, duration: 0.6, stagger: 0.08 },
            1.02
          );
      });

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(
          [
            imageBlock1Ref.current,
            imageBlock2Ref.current,
            logoRef.current,
            titleRef.current,
            ...metaGroup,
            ...ratingGroup,
            synopsisRef.current,
            actionsRef.current,
            trailerBtnRef.current,
            seasonsBtnRef.current,
          ],
          { opacity: 1, y: 0, clearProps: 'transform' }
        );
      });
    }, pageRef);

    // Hero, SeasonRoute'tan bağımsız bir fetch ile async mount olur —
    // SeasonRoute kendi ScrollTrigger'larını Hero henüz DOM'a girmeden
    // ölçmüş olabilir (BB Hero'daki aynı defansif refresh).
    const timerId = setTimeout(() => ScrollTrigger.refresh(), 120);

    return () => {
      clearTimeout(timerId);
      ctx.revert();
    };
  }, [series6]);

  // TODO: Replace null with a Skeleton UI if needed.
  if (series6 == null) return null;

  const firstAirYear = series6?.firstAirDate ? new Date(series6.firstAirDate).getFullYear() : null;

  return (
    <div className={styles.page} ref={pageRef}>
      <img ref={imageBlock1Ref} className={styles.imageBlock1} src={series6?.coverImageUrl} alt="" />
      <img ref={imageBlock2Ref} className={styles.imageBlock2} src={series6?.coverImageUrl} alt="" />
      <Link ref={logoRef} to="/series/house-of-the-dragon" className={styles.logoBlock1}><img src="/src/assets/logos/house-of-the-dragon.webp" alt="House of the Dragon" /></Link>
      <p ref={titleRef} className={styles.textBlock1}>{series6?.title}</p>
      <p ref={yearRef} className={styles.textBlock2}>{firstAirYear}</p>
      <p ref={genreRef} className={styles.textBlock3}>{series6?.genreNames}</p>
      <p ref={synopsisRef} className={styles.textBlock4}>{series6?.synopsis}</p>
      <div ref={imdbLogoRef} className={styles.logoBlock2}><img src="/src/assets/logos/IMDB_Logo_2016.svg.webp" alt="IMDB Logo 2016.Svg" /></div>
      <p ref={ratingTextRef} className={styles.textBlock5}>{series6?.externalRating}</p>
      <div ref={actionsRef} className={styles.actionsBlock}>
        <ContentActions
          itemId={series6?.id}
          itemType="SERIES"
          shareTitle={series6?.title}
          shareUrl={`${window.location.origin}${window.location.pathname}`}
          isProduction
        />
      </div>
      <Link ref={trailerBtnRef} to="https://www.youtube.com/watch?v=DotnJ7tTA34" className={styles.buttonBlock1}>{`▶ ${t('series.watchTrailer')}`}</Link>
      <Link ref={seasonsBtnRef} to="/series/house-of-the-dragon/seasons" className={styles.buttonBlock2}>{t('series.seasonsHeading')}</Link>
    </div>
  );
}
