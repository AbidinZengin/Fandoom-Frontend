import { useLayoutEffect, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLocalizedNavigate as useNavigate } from '../../../../shared/i18n/useLocalizedNavigate';
import gsap from 'gsap';
import { Footer } from '../../../../components/Footer/Footer';
import { RelatedContent } from '../../../../components/RelatedContent/RelatedContent';
import { armInPageNav, hideNavbar, isBlogReturnArmed } from '../../../../motion/cinematic';
import { theme, resolveGenreNames } from '../From.data';
import { fetchProductionDetail, fetchSeasonDetail, still, stillSrcSet } from './EpisodePage.data';
import { EpisodeBrief } from './EpisodeBrief/EpisodeBrief';
import { EpisodeBlocks } from './EpisodeBlocks/EpisodeBlocks';
import { getRelatedBlogs } from './RelatedContent/RelatedContent.data';
import styles from './EpisodePage.module.css';

const ROMAN_MAP = [
  [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
  [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
  [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
];

function toRoman(num) {
  let n = num;
  let result = '';
  for (const [value, symbol] of ROMAN_MAP) {
    while (n >= value) {
      result += symbol;
      n -= value;
    }
  }
  return result;
}

const pad2 = (n) => String(n).padStart(2, '0');

// Hero'nun alt kenarındaki sis erimesi (bkz. EpisodePage.module.css
// .hero__media). Giriş animasyonunun klonu gerçek görselle AYNI maskeyi
// taşımalı — yoksa klon kalkıp gerçek görsel görününce alt kenar aniden
// sisleniyormuş gibi bir sıçrama olur.
const FOG_MASK =
  'linear-gradient(to bottom,#000 0%,#000 62%,rgba(0,0,0,0.78) 76%,rgba(0,0,0,0.38) 88%,transparent 100%)';

// BreakingBad/HouseOfTheDragon EpisodePage'in BİREBİR aynısı (standart imza
// şablonu) — cover card → fixed header scroll dönüşümü, cinematic
// merkez-reveal girişi, bölüm/sezon crossfade navigasyonu dahil TÜM mekanik
// korundu. Platform-marka rozeti (HotD'deki HBO Max) YOK — From (Apple
// TV+) için eşdeğer bir logo asset'i verilmedi, bkz. EpisodeBrief.
export default function EpisodePage() {
  const { t } = useTranslation();
  const { seasonNumber: seasonNumberParam, episodeNumber: episodeNumberParam } = useParams();
  const navigate = useNavigate();

  const [series, setSeries] = useState(null);
  const [episodes, setEpisodes] = useState(null);
  const [notFound, setNotFound] = useState(false);
  // Bölümün kendi genre alanı şemada YOK — EpisodeBrief'teki genre pill'leri
  // dizinin (production) genreId'lerinden çözülür.
  const [genreNames, setGenreNames] = useState([]);
  // Bölüm sayfasının altındaki "Dive Deeper" şeridi — backend'den asenkron
  // gelir; null iken RelatedContent boş şeridi hiç basmaz (bkz. component).
  const [relatedBlogs, setRelatedBlogs] = useState(null);

  const heroRef = useRef(null);
  const mediaRef = useRef(null);
  const imageRef = useRef(null);
  const contentRef = useRef(null);
  const titleRef = useRef(null);
  const seasonNumRef = useRef(null);
  // Ekranda gösterilen sezon — crossfade'de roman rakamının da fade'lenip
  // fade'lenmeyeceğini belirler (bölüm değişiminde rakam sabit kalmalı).
  const shownSeasonRef = useRef(null);
  // Ekranda GÖRÜNEN bölüm — route'un işaret ettiğinden geri kalabilir.
  // Yeni bölümün görseli decode edilene kadar eski kare durur, sonra ikisi
  // (görsel + başlık) BİRLİKTE crossfade eder; doğrudan src değiştirmek
  // görsel inene dek siyah bir boşluk bırakıyordu.
  const [displayedEpisode, setDisplayedEpisode] = useState(null);
  // Giriş efektinin bu commit'te "ele aldığı" stillImageUrl — crossfade
  // effect'i AYNI src için tekrar tetiklenmesin diye. Giriş effect'inin
  // GÖVDESİNDE senkron set edilir, animasyon bitişini BEKLEMEZ.
  const enteredSrcRef = useRef(undefined);
  // Hangi sezonun bölümleri `episodes` state'inde yüklü — season nav
  // butonu zaten hedef sezonu yükleyip navigate ettiğinde effect'in
  // AYNI veriyi tekrar çekmesini önler.
  const loadedSeasonIdRef = useRef(null);

  const seasonNumber = Number(seasonNumberParam);
  const episodeNumber = Number(episodeNumberParam);

  useEffect(() => {
    let cancelled = false;
    fetchProductionDetail('series', 'from')
      .then((data) => {
        if (!cancelled) setSeries(data);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Dizi verisi gelince genre isimleri bir kez çözülür — bölüm değiştikçe
  // tekrar tekrar tetiklenmez (genre sezon/bölüme değil diziye bağlı).
  useEffect(() => {
    if (!series) return undefined;
    let cancelled = false;
    resolveGenreNames(series.genreIds).then((names) => {
      if (!cancelled) setGenreNames(names);
    });
    return () => {
      cancelled = true;
    };
  }, [series]);

  // Doğrudan URL'den açılış / tarayıcı geri-ileri navigasyonu için
  // fallback fetch — düğmeyle sezon değişimi kendi verisini goToSeason
  // içinde önceden çekip navigate ettiği için burada tekrar tetiklenmez.
  useEffect(() => {
    if (!series) return undefined;
    const season = series.seasons.find((s) => s.seasonNumber === seasonNumber);
    if (!season) {
      setNotFound(true);
      return undefined;
    }
    if (loadedSeasonIdRef.current === season.id) return undefined;
    let cancelled = false;
    fetchSeasonDetail(season.id).then((detail) => {
      if (cancelled) return;
      loadedSeasonIdRef.current = season.id;
      setEpisodes(detail.episodes);
    });
    return () => {
      cancelled = true;
    };
  }, [series, seasonNumber]);

  const currentSeason = series?.seasons.find((s) => s.seasonNumber === seasonNumber) ?? null;
  const currentEpisode = episodes?.find((ep) => ep.episodeNumber === episodeNumber) ?? null;

  useEffect(() => {
    if (episodes && !currentEpisode) setNotFound(true);
  }, [episodes, currentEpisode]);

  // Bölüm değişince şeridi yeniden çeker — GET /api/blogs/related.
  useEffect(() => {
    if (!currentEpisode) return undefined;
    let cancelled = false;
    setRelatedBlogs(null);
    getRelatedBlogs({ seasonNumber, episodeNumber: currentEpisode.episodeNumber })
      .then((items) => {
        if (!cancelled) setRelatedBlogs(items);
      })
      .catch(() => {
        if (!cancelled) setRelatedBlogs([]);
      });
    return () => {
      cancelled = true;
    };
  }, [seasonNumber, currentEpisode]);

  // From tema rengini basar (learned-rules: "Yapım sayfaları TAM TEMA kurar").
  useEffect(() => {
    if (!series) return undefined;
    const root = document.documentElement;
    const prev = {
      bg: root.style.getPropertyValue('--bg'),
      accent: root.style.getPropertyValue('--accent'),
      cardBg: root.style.getPropertyValue('--card-bg'),
    };

    root.style.setProperty('--bg', theme.bg);
    root.style.setProperty('--accent', theme.accent);
    root.style.setProperty('--card-bg', theme.cardBg);

    return () => {
      root.style.setProperty('--bg', prev.bg || '#050505');
      root.style.setProperty('--accent', prev.accent || '#a02cd8');
      root.style.setProperty('--card-bg', prev.cardBg || '#101012');
    };
  }, [series]);

  // Giriş: ekran önce kararır, sonra tam merkezden sinematik kare (still
  // görsel) büyüyerek+belirerek yerini alır. Tek GSAP timeline: siyah perde
  // fade-in → görsel klon transform-origin merkezde scale+opacity 0'dan 1'e
  // büyür → altındaki gerçek hero__image zaten aynı kadrajda durduğu için
  // klon kaldırılınca kesintisiz "yerinde" kalır.
  useLayoutEffect(() => {
    if (!currentEpisode) return undefined;
    // Senkron, animasyon başlamadan — crossfade effect'i aynı commit'te
    // hemen ardından çalışır ve bu değeri okur.
    enteredSrcRef.current = currentEpisode.stillImageUrl;

    // Blog'dan geri dönüşte giriş animasyonu OYNAMAZ.
    if (isBlogReturnArmed()) return undefined;

    // Perde/klon React'in DIŞINDA document.body'ye eklenir; ctx.revert()
    // tween'leri öldürür ama bu DOM düğümlerini KALDIRMAZ — cleanup'ta
    // koşulsuz silinir.
    const overlays = [];

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const src = currentEpisode.stillImageUrl;
        hideNavbar(0.7);

        if (src) {
          gsap.set(contentRef.current.children, { opacity: 0 });
          gsap.set(imageRef.current, { opacity: 0 });

          const curtain = document.createElement('div');
          curtain.style.cssText =
            'position:fixed;inset:0;background:#000;z-index:49;pointer-events:none;';
          document.body.appendChild(curtain);
          overlays.push(curtain);

          const clone = document.createElement('img');
          clone.src = still(src, 1920);
          clone.srcset = stillSrcSet(src) ?? '';
          clone.sizes = '100vw';
          clone.alt = '';
          clone.decoding = 'async';
          clone.style.cssText =
            'position:fixed;top:0;left:0;width:100vw;height:100vh;object-fit:cover;' +
            'object-position:center 20%;z-index:50;pointer-events:none;' +
            `-webkit-mask-image:${FOG_MASK};mask-image:${FOG_MASK};` +
            '-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;';
          document.body.appendChild(clone);
          overlays.push(clone);
          gsap.set(clone, { transformOrigin: '50% 50%', scale: 0, opacity: 0 });

          gsap
            .timeline({
              onComplete: () => {
                curtain.remove();
                clone.remove();
                gsap.set(imageRef.current, { opacity: 1 });
                gsap.to(contentRef.current.children, {
                  opacity: 1,
                  y: 0,
                  duration: 0.6,
                  ease: 'power2.out',
                  stagger: 0.06,
                  clearProps: 'opacity,transform',
                });
              },
            })
            .to(clone, { scale: 1, opacity: 1, duration: 0.65, ease: 'power3.inOut' });
        } else {
          gsap.from(contentRef.current.children, {
            opacity: 0,
            y: 24,
            duration: 0.8,
            ease: 'power2.out',
            stagger: 0.1,
            clearProps: 'opacity,transform',
          });
        }
      });

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(contentRef.current.children, { opacity: 1, y: 0 });
      });
    }, heroRef);

    const imgEl = imageRef.current;
    const contentEl = contentRef.current;

    return () => {
      ctx.revert();
      overlays.forEach((el) => el.remove());
      if (imgEl) gsap.set(imgEl, { clearProps: 'opacity' });
      if (contentEl) gsap.set(contentEl.children, { clearProps: 'opacity,transform' });
    };
    // Yalnızca sayfa ilk episode'u aldığında bir kez oynar — sonraki
    // episode/season değişimleri aşağıdaki crossfade effect'ine ait.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Boolean(currentEpisode)]);

  // Route yeni bir bölüme işaret ettiğinde: görseli ÖNCE arka planda decode
  // et, ancak hazır olunca ekrandakini değiştir. Böylece tıklama ile yeni
  // kare arasında siyah boşluk oluşmaz — eski kare son ana kadar durur.
  useEffect(() => {
    if (!currentEpisode) return undefined;
    if (!displayedEpisode) {
      setDisplayedEpisode(currentEpisode);
      return undefined;
    }
    if (currentEpisode.id === displayedEpisode.id) return undefined;

    const next = currentEpisode;
    if (!next.stillImageUrl) {
      setDisplayedEpisode(next);
      return undefined;
    }

    let cancelled = false;
    const commit = () => {
      if (!cancelled) setDisplayedEpisode(next);
    };
    const pre = new Image();
    pre.srcset = stillSrcSet(next.stillImageUrl) ?? '';
    pre.sizes = '100vw';
    pre.src = still(next.stillImageUrl, 1920);
    Promise.resolve()
      .then(() => (pre.decode ? pre.decode() : Promise.reject(new Error('no decode'))))
      .then(commit)
      .catch(() => {
        if (pre.complete) commit();
        else {
          pre.onload = commit;
          pre.onerror = commit;
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentEpisode, displayedEpisode]);

  // Görünen bölüm değişince görsel + başlık (sezon değiştiyse roman rakamı
  // da) BİRLİKTE crossfade eder.
  useLayoutEffect(() => {
    if (!displayedEpisode) return undefined;
    if (displayedEpisode.stillImageUrl === enteredSrcRef.current) return undefined;

    const seasonChanged = shownSeasonRef.current !== seasonNumber;
    shownSeasonRef.current = seasonNumber;

    const img = imageRef.current;
    const text = [titleRef.current, seasonChanged ? seasonNumRef.current : null].filter(Boolean);
    const all = [img, ...text].filter(Boolean);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    gsap.killTweensOf(all);
    if (reduced) {
      gsap.set(all, { opacity: 1, y: 0 });
      return undefined;
    }

    gsap.fromTo(img, { opacity: 0 }, { opacity: 1, duration: 0.55, ease: 'power2.out' });
    gsap.fromTo(
      text,
      { opacity: 0, y: 14 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: 'power2.out',
        stagger: 0.06,
        clearProps: 'transform',
      }
    );

    return () => gsap.killTweensOf(all);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayedEpisode?.id]);

  if (notFound) {
    return (
      <>
        <div className={styles.notfound}>
          <h1 className={styles.notfound__title}>{t('common.episodeNotFound')}</h1>
        </div>
        <Footer />
      </>
    );
  }

  if (!series || !currentSeason || !currentEpisode) return null;
  const shownEpisode = displayedEpisode ?? currentEpisode;

  const seasonIdx = series.seasons.findIndex((s) => s.seasonNumber === seasonNumber);
  const isFirstSeason = seasonIdx <= 0;
  const isLastSeason = seasonIdx >= series.seasons.length - 1;
  const isFirstEpisode = episodeNumber <= 1 && isFirstSeason;
  const isLastEpisode = !episodes || (episodeNumber >= episodes.length && isLastSeason);

  const goToSeason = (delta, landOnLast = false) => {
    const target = series.seasons[seasonIdx + delta];
    if (!target) return;
    fetchSeasonDetail(target.id).then((detail) => {
      loadedSeasonIdRef.current = target.id;
      setEpisodes(detail.episodes);
      armInPageNav();
      const num = landOnLast ? Math.max(1, detail.episodes.length) : 1;
      navigate(`/series/from/seasons/${target.seasonNumber}/episodes/${num}`);
    });
  };

  const goToEpisode = (num) => {
    if (!episodes) return;
    if (num > episodes.length) {
      if (!isLastSeason) goToSeason(1);
      return;
    }
    if (num < 1) {
      if (!isFirstSeason) goToSeason(-1, true);
      return;
    }
    armInPageNav();
    navigate(`/series/from/seasons/${seasonNumber}/episodes/${num}`);
  };

  return (
    <>
      <section className={styles.hero} ref={heroRef}>
        <div className={styles.hero__media} ref={mediaRef} aria-hidden="true">
          {shownEpisode.stillImageUrl && (
            <img
              ref={imageRef}
              className={styles.hero__image}
              src={still(shownEpisode.stillImageUrl, 1920)}
              srcSet={stillSrcSet(shownEpisode.stillImageUrl)}
              sizes="100vw"
              alt=""
              fetchPriority="high"
            />
          )}
          <div className={styles.hero__overlay} />
          <div className={styles.hero__scrim} />
        </div>

        <div className={styles.hero__content} ref={contentRef}>
          <p className={`${styles.hero__label} ${styles.hero__collapsible}`}>{t('series.selectSeason')}</p>
          <div className={`${styles.hero__seasonNav} ${styles.hero__collapsible}`}>
            <button
              type="button"
              className={styles.hero__arrow}
              onClick={() => goToSeason(-1)}
              disabled={isFirstSeason}
              aria-label={t('series.previousSeason')}
            >
              &#8249;
            </button>
            <span className={styles.hero__seasonNumber} ref={seasonNumRef}>
              {toRoman(seasonNumber)}
            </span>
            <button
              type="button"
              className={styles.hero__arrow}
              onClick={() => goToSeason(1)}
              disabled={isLastSeason}
              aria-label={t('series.nextSeason')}
            >
              &#8250;
            </button>
          </div>

          <div
            className={`${styles.hero__ornament} ${styles.hero__collapsible}`}
            aria-hidden="true"
          >
            <span className={styles.hero__ornamentLine} />
            <span className={styles.hero__ornamentDot} />
            <span className={styles.hero__ornamentLine} />
          </div>

          <h1 className={styles.hero__title} ref={titleRef}>
            {shownEpisode.title}
          </h1>

          <p className={`${styles.hero__label} ${styles.hero__collapsible}`}>{t('series.selectEpisode')}</p>
          <div className={styles.hero__episodeStrip}>
            <button
              type="button"
              className={`${styles.hero__arrow} ${styles.hero__arrowPrev}`}
              onClick={() => goToEpisode(episodeNumber - 1)}
              disabled={isFirstEpisode}
              aria-label={t('series.previousEpisode')}
            >
              &#8249;
            </button>
            <div className={`${styles.hero__episodeList} ${styles.hero__listCollapse}`}>
              {episodes?.map((ep) => (
                <button
                  key={ep.id}
                  type="button"
                  className={styles.hero__episodePill}
                  data-active={ep.episodeNumber === episodeNumber || undefined}
                  title={ep.title}
                  aria-label={t('series.episodeLabel', { number: ep.episodeNumber, title: ep.title })}
                  onClick={() => goToEpisode(ep.episodeNumber)}
                  aria-current={ep.episodeNumber === episodeNumber || undefined}
                >
                  {pad2(ep.episodeNumber)}
                </button>
              ))}
            </div>
            <button
              type="button"
              className={`${styles.hero__arrow} ${styles.hero__arrowNext}`}
              onClick={() => goToEpisode(episodeNumber + 1)}
              disabled={isLastEpisode}
              aria-label={t('series.nextEpisode')}
            >
              &#8250;
            </button>
          </div>

          <button
            type="button"
            className={`${styles.hero__explore} ${styles.hero__collapsible}`}
            onClick={() =>
              document
                .getElementById('episode-brief')
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
          >
            <span>{t('series.exploreEpisode')}</span>
            <span className={styles.hero__exploreChevron} aria-hidden="true">
              &#8964;
            </span>
          </button>
        </div>
      </section>

      {/* Hero position:fixed'e geçince akıştan çıkar; yerini bu tutar. */}
      <div className={styles.hero__spacer} aria-hidden="true" />

      <EpisodeBrief
        episode={shownEpisode}
        seasonNumber={seasonNumber}
        genres={genreNames}
        rating={shownEpisode.externalRating != null ? shownEpisode.externalRating.toFixed(1) : null}
      />

      <EpisodeBlocks episodeId={shownEpisode.id} />

      <RelatedContent items={relatedBlogs} />

      <Footer />
    </>
  );
}
