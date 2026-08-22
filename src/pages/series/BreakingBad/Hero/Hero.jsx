import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ENTITY_SCHEMAS } from '../../../../shared/builder/entitySchemas';
import { isCinematicArmed } from '../../../../motion/cinematic';
import { LocalizedLink as Link } from '../../../../shared/i18n/LocalizedLink';
import styles from './Hero.module.css';

// PageBuilder "Kodu Üret" ile oluşturuldu — bu noktadan sonra normal
// proje kodu, elle düzenlenebilir (GSAP/motion elle eklenir).
// DÜZELTME (manuel): codegen ham fetchProductionById kullanmıştı — bu,
// genreNames'i türeten withGenreNames sarmalayıcısını (bkz.
// entitySchemas.js) atlıyordu, PageBuilder önizlemesinde görünen genre
// metni gerçek sayfada hep boş geliyordu. ENTITY_SCHEMAS.series.fetch
// AYNI sarmalamayı kullanır — PageBuilder'ın gördüğü veriyle birebir.
// DÜZELTME (manuel): açılış animasyonu eklendi — GoT Hero'nun varsayılan
// giriş deseni (logo fade+rise → sinopsis takip, power2.out, cinematic
// tempo) bu sayfanın daha kalabalık künye satırına genişletildi: zemin
// ve ön plan görseli önce belirir, ardından logo→genre→puan→sinopsis→
// butonlar kademeli takip eder.
// DÜZELTME (manuel): FeaturedCarousel'in eski HERO_FLIP mekaniği (büyüyen
// poster klonu) bu Hero'nun eski OldHero kart geometrisine göre kuruluydu;
// yeni tam-genişlik düzenle uyuşmuyordu VE klonu temizleyen kod OldHero'da
// kalmıştı (Hero hiç okumuyordu) — devir sonrası ekranda kalıcı siyah
// perde + büyümüş poster kalıyordu. FeaturedCarousel artık Breaking Bad'i
// GoT'un kanıtlanmış imza-şerit cinematic geçişine yönlendiriyor
// (armCinematic); burada isCinematicArmed() dalı GoT Hero'nun aynısı: `.page`
// merkezden dikey şeritle açılır, zemin görseli counter-zoom ile oturur,
// içerik kademesi aynı offsetlerle ama şerit açıldıktan sonra başlar.
export default function Hero() {
  const { t } = useTranslation();
  const [series5, setSeries5] = useState(null);
  const pageRef = useRef(null);
  const imageBlock1Ref = useRef(null);
  const imageBlock2Ref = useRef(null);
  const genreRef = useRef(null);
  const logoRef = useRef(null);
  const trailerBtnRef = useRef(null);
  const seasonsBtnRef = useRef(null);
  const synopsisRef = useRef(null);
  const imdbLogoRef = useRef(null);
  const ratingTextRef = useRef(null);
  const starIconRef = useRef(null);

  useEffect(() => {
    ENTITY_SCHEMAS.series.fetch(5).then(setSeries5);
  }, []);

  useLayoutEffect(() => {
    if (series5 == null) return undefined;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      const ratingGroup = [imdbLogoRef.current, ratingTextRef.current, starIconRef.current];

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        if (isCinematicArmed()) {
          // Cinematic devir (FeaturedCarousel'den gelen): 1) `.page` merkezden
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
              imageBlock1Ref.current,
              { scale: 1.5 },
              { scale: 1, duration: 0.95, ease: 'power2.out', clearProps: 'transform' },
              0
            )
            .from(imageBlock2Ref.current, { opacity: 0, y: 28, duration: 1, ease: 'power3.out' }, 0.3)
            .from(logoRef.current, { opacity: 0, y: 28, duration: 0.9 }, 0.6)
            .from(genreRef.current, { opacity: 0, y: 14, duration: 0.6 }, 0.82)
            .from(ratingGroup, { opacity: 0, y: 14, duration: 0.6 }, 0.88)
            .from(synopsisRef.current, { opacity: 0, y: 16, duration: 0.7 }, 0.94)
            .from(
              [trailerBtnRef.current, seasonsBtnRef.current],
              { opacity: 0, y: 14, duration: 0.6, stagger: 0.08 },
              1.15
            );
          return;
        }

        const tl = gsap.timeline({ defaults: { ease: 'power2.out', clearProps: 'opacity,transform' } });

        tl.from(imageBlock1Ref.current, { opacity: 0, duration: 1.1 }, 0)
          .from(imageBlock2Ref.current, { opacity: 0, y: 28, duration: 1, ease: 'power3.out' }, 0.15)
          .from(logoRef.current, { opacity: 0, y: 28, duration: 0.9 }, 0.4)
          .from(genreRef.current, { opacity: 0, y: 14, duration: 0.6 }, 0.62)
          .from(ratingGroup, { opacity: 0, y: 14, duration: 0.6 }, 0.68)
          .from(synopsisRef.current, { opacity: 0, y: 16, duration: 0.7 }, 0.74)
          .from(
            [trailerBtnRef.current, seasonsBtnRef.current],
            { opacity: 0, y: 14, duration: 0.6, stagger: 0.08 },
            0.95
          );
      });

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(
          [
            imageBlock1Ref.current,
            imageBlock2Ref.current,
            logoRef.current,
            genreRef.current,
            ...ratingGroup,
            synopsisRef.current,
            trailerBtnRef.current,
            seasonsBtnRef.current,
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

  return (
    <div className={styles.page} ref={pageRef}>
      <img ref={imageBlock1Ref} className={styles.imageBlock1} src={"https://res.cloudinary.com/b0bc5njd/image/upload/v1786892507/fandoom/general/cafgu8cfifaioz5kn6j7.webp"} alt="" />
      <img ref={imageBlock2Ref} className={styles.imageBlock2} src={"https://res.cloudinary.com/b0bc5njd/image/upload/v1786892540/fandoom/general/udr8y4sfucrf9xw4yyx0.webp"} alt="" />
      <p ref={genreRef} className={styles.textBlock1}>{series5?.genreNames}</p>
      <Link ref={logoRef} to="/series/breaking-bad" className={styles.logoBlock1}><img src="/src/assets/logos/breaking-bad.svg" alt="Breaking Bad" /></Link>
      <Link ref={trailerBtnRef} to="https://www.youtube.com/watch?v=HhesaQXLuRY" className={styles.buttonBlock1}>{`▶  ${t('series.watchTrailer')}`}</Link>
      <Link ref={seasonsBtnRef} to="/series/breaking-bad/seasons" className={styles.buttonBlock2}>{t('series.seasonsHeading')}</Link>
      <p ref={synopsisRef} className={styles.textBlock2}>{series5?.synopsis}</p>
      <div ref={imdbLogoRef} className={styles.logoBlock2}><img src="/src/assets/logos/IMDB_Logo_2016.svg.webp" alt="IMDB Logo 2016.Svg" /></div>
      <p ref={ratingTextRef} className={styles.textBlock3}>{series5?.externalRating}</p>
      <svg ref={starIconRef} className={styles.iconBlock1} viewBox="0 0 24 24" fill="currentColor" stroke="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.9 6.9L22 9.2l-5.5 5 1.6 7.6L12 18l-6.1 3.8 1.6-7.6-5.5-5 7.1-0.3L12 2z" /></svg>
      <div className={styles.rectangleBlock1} />
    </div>
  );
}
