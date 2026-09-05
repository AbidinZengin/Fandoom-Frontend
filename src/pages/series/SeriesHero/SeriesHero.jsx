import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import gsap from 'gsap';
import { LocalizedLink as Link } from '../../../shared/i18n/LocalizedLink';
import { fetchProductionDetail } from '../../../shared/api/productions';
import { resolveGenreNames } from '../../../shared/api/genres';
import { FeaturedCarousel } from './FeaturedCarousel/FeaturedCarousel';
import imdbLogo from '../../../assets/logos/IMDB_Logo_2016.svg.webp';
import bbLogo from '../../../assets/logos/breaking-bad.svg';
import hotdLogo from '../../../assets/logos/house-of-the-dragon.webp';
import severanceLogo from '../../../assets/logos/severance.webp';
import gotLogo from '../../../assets/logos/got.webp';
import styles from './SeriesHero.module.css';

// Tam ekran, çerçevesiz sinematik Hero (2026-09-05 kararı — eski
// kart/3px-border versiyonun YERİNE geçti, SeriesHeroFullscreen'de
// prototiplenip buraya taşındı). Referans ortak noktaları (Astralynx,
// Aurelius, Adventure, FaiPy, Venture): tam kenar-kenar görsel, kart/
// çerçeve YOK, atmosfer gerçek fotoğrafın kendi ışığından geliyor (sahte
// renk çıkarımı yok — buton renkleri sabit), metin sol-altta, sessiz
// numaralı sinematik crossfade geçiş (otomatik + ok + sürükleme).
const KNOWN_LOGOS = {
  'breaking-bad': bbLogo,
  'house-of-the-dragon': hotdLogo,
  severance: severanceLogo,
  'game-of-thrones': gotLogo,
};

// Her yapımın logosu KENDİ Hero'sunda farklı yerde/boyutta durur (bkz. eski
// PageBuilder referansları) — birebir korundu.
const LOGO_LAYOUT = {
  'house-of-the-dragon': { top: '4%', left: '50%', width: '58%', transform: 'translateX(-50%)' },
  severance: { top: '4%', left: '50%', width: '58%', transform: 'translateX(-50%)' },
  'game-of-thrones': { top: '4%', left: '50%', width: '50%', transform: 'translateX(-50%)' },
  'breaking-bad': { top: '10%', left: '6.3%', width: '30%', transform: 'none' },
};

const ROTATION_SIZE = 5;
const AUTO_ADVANCE_MS = 6500;
const TRANSITION_S = 0.9;
const SWIPE_THRESHOLD = 60;

// Sitede Explore CTA'larının ortak ok ikonu (bkz. BreakingBad/HouseOfTheDragon
// SeasonRoute/Hero) — düz "→" karakteri DEĞİL, her Hero'nun kendi kopyaladığı
// bu SVG. strokeWidth, .hero__ctaOutline'ın 2.5px border'ıyla eşleşsin diye
// 2.5 / 0.75 (18px/24 viewBox ölçeği) = 3.33.
function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="3.33"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="4.5" y1="12" x2="19" y2="12" />
      <polyline points="13.5 6.5 19.5 12 13.5 17.5" />
    </svg>
  );
}

export function SeriesHero({ items }) {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);
  const [details, setDetails] = useState({});
  const [genreNames, setGenreNames] = useState([]);

  const layerRefs = [useRef(null), useRef(null)];
  const frontLayer = useRef(0);
  const textRef = useRef(null);
  const timerRef = useRef(null);
  const drag = useRef({ active: false, startX: 0, paused: false });
  const dotsRowRef = useRef(null);
  const dotIndicatorRef = useRef(null);
  const dotRefs = useRef([]);
  const prevActiveIndex = useRef(0);

  const featured = items.slice(0, ROTATION_SIZE);
  const slugKey = featured.map((it) => it.slug).join(',');

  // coverImageUrl/externalRating/genreIds/synopsis katalog listesinde YOK
  // (yalnız detay endpoint'inde) — N+1 maliyeti kabul edilebilir (ContentSection'daki
  // lead-genre deseniyle aynı ilke).
  useEffect(() => {
    if (featured.length === 0) return undefined;
    let cancelled = false;
    Promise.all(
      featured.map((it) => fetchProductionDetail(it.type.toLowerCase(), it.slug).catch(() => null))
    ).then((results) => {
      if (cancelled) return;
      const map = {};
      featured.forEach((it, i) => {
        if (results[i]) map[it.slug] = results[i];
      });
      setDetails(map);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- slug seti belirleyici, items referansı değil
  }, [slugKey]);

  const current = featured[activeIndex % Math.max(featured.length, 1)];
  const detail = current ? details[current.slug] : null;

  // Tür yalnız aktif kart için çözülür (Highlights/ContentSection'daki
  // lead-only genre deseniyle aynı ilke).
  useEffect(() => {
    if (!detail?.genreIds?.length) {
      setGenreNames([]);
      return undefined;
    }
    let cancelled = false;
    resolveGenreNames(detail.genreIds).then((names) => {
      if (!cancelled) setGenreNames(names);
    });
    return () => {
      cancelled = true;
    };
  }, [detail]);

  const coverImage = detail?.coverImageUrl ?? current?.posterUrl;

  // Sinematik crossfade — iki katman üst üste, arka katmana yeni görsel
  // yazılıp opacity 0→1 tween'lenir, ön katman aynı anda söner. Detay
  // yüklenip coverImage poster'dan cover'a "yükseldiğinde" de aynı eritme
  // tekrar oynar (kasıtlı — ekstra bir "geldi" hissi verir).
  useEffect(() => {
    if (!coverImage) return;
    const idleIndex = 1 - frontLayer.current;
    const idle = layerRefs[idleIndex].current;
    const front = layerRefs[frontLayer.current].current;
    if (!idle) return;

    idle.src = coverImage;
    gsap.killTweensOf([idle, front]);
    // z-index 0/1'de tutuluyor — .hero__scrim'in kendi z-index'i (1) DOM
    // sırası gereği (scrim iki <img>'den SONRA gelir) eşitlikte üstte kalır,
    // aktif görsel sisin üstüne binmez.
    gsap.set(idle, { opacity: 0, zIndex: 1 });
    if (front) gsap.set(front, { zIndex: 0 });
    gsap.to(idle, { opacity: 1, duration: TRANSITION_S, ease: 'power2.out' });

    gsap.fromTo(
      textRef.current,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.6, delay: 0.25, ease: 'power2.out' }
    );

    frontLayer.current = idleIndex;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- layerRefs sabit
  }, [coverImage]);

  const goHero = (direction) => {
    if (featured.length < 2) return;
    setActiveIndex((i) => (i + direction + featured.length) % featured.length);
  };

  // Nokta gösterge — "01-05" barının yerine geçti (kullanıcı kararı,
  // 2026-09-05). İndikatör aktif noktanın üstüne biner; slide değişiminde
  // ESKİ ve YENİ nokta arasını köprüleyecek şekilde GENİŞLER (görsel
  // "birleşme"), sonra yeni noktanın boyutuna geri KÜÇÜLÜR ("ayrılma").
  useEffect(() => {
    const row = dotsRowRef.current;
    const indicator = dotIndicatorRef.current;
    const targetDot = dotRefs.current[activeIndex];
    if (!row || !indicator || !targetDot) return;

    const rowRect = row.getBoundingClientRect();
    const targetRect = targetDot.getBoundingClientRect();
    const targetLeft = targetRect.left - rowRect.left;
    const dotSize = targetRect.width;
    const prevIndex = prevActiveIndex.current;
    prevActiveIndex.current = activeIndex;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prevDot = dotRefs.current[prevIndex];

    if (reduceMotion || prevIndex === activeIndex || !prevDot) {
      gsap.set(indicator, { left: targetLeft, width: dotSize });
      return;
    }

    const prevRect = prevDot.getBoundingClientRect();
    const prevLeft = prevRect.left - rowRect.left;
    const bridgeLeft = Math.min(prevLeft, targetLeft);
    const bridgeWidth = Math.abs(targetLeft - prevLeft) + dotSize;

    gsap
      .timeline()
      .set(indicator, { left: prevLeft, width: dotSize })
      .to(indicator, { left: bridgeLeft, width: bridgeWidth, duration: 0.26, ease: 'power2.out' })
      .to(indicator, { left: targetLeft, width: dotSize, duration: 0.24, ease: 'back.out(1.6)' });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- yalnız index/featured.length değişince yeniden hesaplanır
  }, [activeIndex, featured.length]);

  // Otomatik ilerleme — manuel her etkileşimde sıfırlanır, sürükleme
  // sırasında durur.
  useEffect(() => {
    if (featured.length < 2) return undefined;
    timerRef.current = window.setInterval(() => {
      if (!drag.current.paused) goHero(1);
    }, AUTO_ADVANCE_MS);
    return () => window.clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- yalnız index/featured.length değişince yeniden kurulur
  }, [activeIndex, featured.length]);

  const onPointerDown = (e) => {
    drag.current = { active: true, startX: e.clientX, paused: true };
  };

  const onPointerUp = (e) => {
    if (!drag.current.active) return;
    const delta = e.clientX - drag.current.startX;
    if (Math.abs(delta) > SWIPE_THRESHOLD) goHero(delta < 0 ? 1 : -1);
    drag.current = { active: false, startX: 0, paused: false };
  };

  const onPointerCancel = () => {
    drag.current.active = false;
    drag.current.paused = false;
  };

  if (!current) return null;

  const logo = KNOWN_LOGOS[current.slug];
  const year = current.releaseDate ? new Date(current.releaseDate).getFullYear() : null;

  return (
    <div className={styles.hero}>
      <div
        className={styles.hero__stage}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerCancel}
        onPointerCancel={onPointerCancel}
      >
        <img className={styles.hero__layer} ref={layerRefs[0]} alt="" />
        <img className={styles.hero__layer} ref={layerRefs[1]} alt="" />

        <div className={styles.hero__scrim} />

        {logo && (
          <img className={styles.hero__logo} src={logo} alt={current.title} style={LOGO_LAYOUT[current.slug]} />
        )}

        {detail?.externalRating && (
          <div className={styles.hero__rating}>
            <span>{detail.externalRating}</span>
            <img src={imdbLogo} alt="IMDb" className={styles.hero__imdbLogo} />
          </div>
        )}

        <div className={styles.hero__content} ref={textRef}>
          <h2 className={styles.hero__title}>{current.title}</h2>

          <div className={styles.hero__metaRow}>
            {year && <span>{year}</span>}
            {genreNames.length > 0 && <span>{genreNames.join(' · ')}</span>}
          </div>

          {detail?.synopsis && <p className={styles.hero__synopsis}>{detail.synopsis}</p>}

          <div className={styles.hero__ctaRow}>
            <Link className={styles.hero__ctaOutline} to={`/series/${current.slug}`}>
              {t('seriesHub.explore')} <ArrowIcon />
            </Link>
            <button type="button" className={styles.hero__ctaGlass}>
              ▶ {t('seriesHub.watchTrailer')}
            </button>
          </div>
        </div>

        {featured.length > 1 && (
          <>
            <button
              type="button"
              className={styles.hero__navArrow}
              data-direction="prev"
              aria-label={t('common.previous')}
              onClick={() => goHero(-1)}
            >
              ‹
            </button>
            <button
              type="button"
              className={styles.hero__navArrow}
              data-direction="next"
              aria-label={t('common.next')}
              onClick={() => goHero(1)}
            >
              ›
            </button>

            <div className={styles.hero__dots} ref={dotsRowRef}>
              {featured.map((it, i) => (
                <button
                  key={it.slug}
                  type="button"
                  ref={(el) => {
                    dotRefs.current[i] = el;
                  }}
                  className={styles.hero__dot}
                  aria-label={it.title}
                  aria-current={i === activeIndex}
                  onClick={() => setActiveIndex(i)}
                />
              ))}
              <span className={styles.hero__dotIndicator} ref={dotIndicatorRef} aria-hidden="true" />
            </div>
          </>
        )}
      </div>

      <div className={styles.hero__row}>
        <h3 className={styles.hero__rowLabel}>{t('seriesHub.featuredTitles')}</h3>
        <FeaturedCarousel items={items} />
      </div>
    </div>
  );
}
