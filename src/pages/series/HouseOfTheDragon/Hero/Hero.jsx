import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchProductionById } from '../../../../shared/api/productions';
import { resolveGenreNames } from '../../../../shared/api/genres';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { isCinematicArmed } from '../../../../motion/cinematic';
import styles from './Hero.module.css';

// PageBuilder "Kodu Üret" ile oluşturuldu — bu noktadan sonra normal
// proje kodu, elle düzenlenebilir (GSAP/motion elle eklenir).
// DÜZELTME (manuel): açılış animasyonu eklendi — eski HotD Hero'daki
// giriş deseni (zemin+ön plan görsel → logo → künye → puan → sinopsis →
// butonlar kademeli, power2.out, cinematic tempo) birebir buraya taşındı.
// Bu layout'ta ContentActions barı yok, o yüzden actionsRef/actionsGroup
// eski animasyondan çıkarıldı — geri kalan kademe aynı.
// DÜZELTME (manuel): "Explore" butonu SeasonRoute'un .focus__cta'sıyla
// (kullanıcı verdiği referans görüntü) BİREBİR aynı — "Sezonu Keşfet"/
// "Explore Season" metni + ok ikonu, SeasonRoute.jsx'teki ArrowIcon'un
// aynısı (bkz. HouseOfTheDragon/SeasonRoute/SeasonRoute.jsx).
// DÜZELTME (manuel): strokeWidth kullanıcı isteğiyle buttonBlock2'nin
// border-width'iyle (2.5px) eşitlendi — svg 24 birimlik viewBox'ta 18px'e
// küçültülüyor (ölçek 0.75), o yüzden ekrandaki gerçek kalınlık strokeWidth
// * 0.75'tir; 2.5px'e denk gelmesi için 2.5 / 0.75 = 3.33 kullanılıyor.
function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3.33" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="4.5" y1="12" x2="19" y2="12" />
      <polyline points="13.5 6.5 19.5 12 13.5 17.5" />
    </svg>
  );
}

export default function Hero() {
  const { t } = useTranslation();
  const [series6, setSeries6] = useState(null);
  const [genreNames, setGenreNames] = useState([]);
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
      const metaGroup = [yearRef.current, genreRef.current];
      const ratingGroup = [imdbLogoRef.current, ratingTextRef.current];

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
              [trailerBtnRef.current, seasonsBtnRef.current],
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
            [trailerBtnRef.current, seasonsBtnRef.current],
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
            trailerBtnRef.current,
            seasonsBtnRef.current,
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
  }, [series6]);

  // TODO: Replace null with a Skeleton UI if needed.
  if (series6 == null) return null;

  const year = series6?.firstAirDate ? new Date(series6.firstAirDate).getFullYear() : '';

  return (
    <div className={styles.page} ref={pageRef}>
      <img ref={imageBlock1Ref} className={styles.imageBlock1} src={series6?.coverImageUrl} alt="" />
      <div className={styles.cardWrap}>
        <img ref={imageBlock2Ref} className={styles.imageBlock2} src={series6?.coverImageUrl} alt="" />
        <Link ref={logoRef} to="/series/house-of-the-dragon" className={styles.logoBlock1}><img src="/src/assets/logos/house-of-the-dragon.webp" alt="House of the Dragon" /></Link>
        <p ref={titleRef} className={styles.textBlock1}>{series6?.title}</p>
        <div className={styles.metaRow}>
          <p ref={yearRef} className={styles.textBlock2}>{year}</p>
          <p ref={genreRef} className={styles.textBlock3}>{genreNames.join(' · ')}</p>
        </div>
        <p ref={synopsisRef} className={styles.textBlock4}>{series6?.synopsis}</p>
        <div ref={imdbLogoRef} className={styles.logoBlock2}><img src="/src/assets/logos/IMDB_Logo_2016.svg.webp" alt="IMDB Logo 2016.Svg" /></div>
        <p ref={ratingTextRef} className={styles.textBlock5}>{series6?.externalRating}</p>
        <div className={styles.ctaRow}>
          <button ref={trailerBtnRef} type="button" className={styles.buttonBlock1}>{"▶  Watch Trailer"}</button>
          <Link ref={seasonsBtnRef} to="/series/house-of-the-dragon/seasons" className={styles.buttonBlock2}>
            {t('common.explore')} <ArrowIcon />
          </Link>
        </div>
      </div>
    </div>
  );
}
