import { useLayoutEffect, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import gsap from 'gsap';
import { Footer } from '../../../../components/Footer/Footer';
import { RelatedContent } from '../../../../components/RelatedContent/RelatedContent';
import { armInPageNav, hideNavbar, isBlogReturnArmed } from '../../../../motion/cinematic';
import { theme, resolveGenreNames } from '../GameOfThrones.data';
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

// Bölüm sayfasının "ilk kısmı" — referans (mod_10.png) üstteki hero bloğu.
// Kenarlardaki dekoratif çerçeve/HBO şeridi kullanıcı kararıyla dışarıda
// bırakıldı; sinopsis/ekip paneli (referansın 2. bloğu) sonraki göreve ait.
// Girişte SeasonRow'dan tıklanınca imza-şerit (cinematic) reveal oynar,
// doğrudan URL'den açılışta standart fade+rise'a düşer (learned-rules:
// "her sayfanın hero'su ilk açılışta giriş animasyonu alır").
export default function EpisodePage() {
  const { seasonNumber: seasonNumberParam, episodeNumber: episodeNumberParam } = useParams();
  const navigate = useNavigate();

  const [series, setSeries] = useState(null);
  const [episodes, setEpisodes] = useState(null);
  const [notFound, setNotFound] = useState(false);
  // Bölümün kendi genre alanı şemada YOK — EpisodeBrief'teki genre pill'leri
  // dizinin (production) genreId'lerinden çözülür (ProductionDetail.jsx'teki
  // resolveGenreNames deseninin aynısı).
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
  // effect'i AYNI src için tekrar tetiklenmesin diye (bkz. aşağıdaki iki
  // effect'in sırası yorumunda anlatılan çakışma). Giriş effect'inin
  // GÖVDESİNDE senkron set edilir, animasyon bitişini BEKLEMEZ — aksi
  // halde aynı commit'te hemen ardından çalışan crossfade effect'i eski
  // (henüz false'a çekilmemiş) değeri görüp ilk mount'ta da devreye girer
  // ve arka plan görselini kendi bağımsız fade'iyle paralelde açardı.
  const enteredSrcRef = useRef(undefined);
  // Hangi sezonun bölümleri `episodes` state'inde yüklü — season nav
  // butonu zaten hedef sezonu yükleyip navigate ettiğinde effect'in
  // AYNI veriyi tekrar çekmesini (ve ID eşleşene kadar episodes'un bir
  // önceki sezona ait kalıp episodeNumber ile yanlış eşleşmesini) önler.
  const loadedSeasonIdRef = useRef(null);

  const seasonNumber = Number(seasonNumberParam);
  const episodeNumber = Number(episodeNumberParam);

  useEffect(() => {
    let cancelled = false;
    fetchProductionDetail('series', 'game-of-thrones')
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
  // Backend'de şu an her bölüm için gerçek kayıt YOK; boş dönerse
  // RelatedContent kendi kararıyla hiçbir şey render etmez.
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

  // GoT tema rengini basar (learned-rules: "Yapım sayfaları TAM TEMA kurar")
  // — SeasonEpisodes/GameOfThrones.jsx ile aynı davranış.
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
  // görsel) büyüyerek+belirerek yerini alır (kullanıcı kararı — tıklanan
  // satırdan büyüyen FLIP DEĞİL, her girişte AYNI merkez reveal; navbar da
  // reveal boyunca geri çekili kalır, ancak sonra yukarı scroll'da normal
  // akışıyla geri gelir). Tek GSAP timeline: siyah perde fade-in → görsel
  // klon transform-origin merkezde scale+opacity 0'dan 1'e büyür ("kare"
  // kamera karesi anlamında, still'in kendi oranını korur) → altındaki
  // gerçek hero__image zaten aynı kadrajda durduğu için klon kaldırılınca
  // kesintisiz "yerinde" kalır.
  useLayoutEffect(() => {
    if (!currentEpisode) return undefined;
    // Senkron, animasyon başlamadan — crossfade effect'i aynı commit'te
    // hemen ardından çalışır ve bu değeri okur (yukarıdaki ref yorumu).
    enteredSrcRef.current = currentEpisode.stillImageUrl;

    // Blog'dan geri dönüşte giriş animasyonu OYNAMAZ: sayfa teknik olarak
    // yeniden mount oluyor ama kullanıcı için bu bir "açılış" değil, terk
    // ettiği sayfaya dönüş. Oynarsa bölüm karesi merkezden büyüyerek tekrar
    // gösteriliyor ve dönüş geçişinin üstüne biniyor.
    if (isBlogReturnArmed()) return undefined;

    // Perde/klon React'in DIŞINDA document.body'ye eklenir; ctx.revert()
    // tween'leri öldürür ama bu DOM düğümlerini KALDIRMAZ. Animasyon
    // ortasında sayfadan çıkılırsa (ya da sekme arka plandayken donup
    // unmount olursa) tam ekran siyah perde asılı kalırdı — bu yüzden
    // düğümler effect kapsamında tutulup cleanup'ta koşulsuz silinir.
    const overlays = [];

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const src = currentEpisode.stillImageUrl;
        hideNavbar(0.7);

        if (src) {
          gsap.set(contentRef.current.children, { opacity: 0 });
          gsap.set(imageRef.current, { opacity: 0 });

          // Perde ANLIK siyah (referans klipte kareyle aynı anda başlıyor,
          // önünde ayrı bir fade-in beat'i yok — o beat eklenince "siyah
          // ekranda çok bekliyor" hissi oluştu). Tek iş: klon henüz scale:0
          // iken altındaki (opacity:0 yapılmış) gerçek görseli örtmek.
          const curtain = document.createElement('div');
          curtain.style.cssText =
            'position:fixed;inset:0;background:#000;z-index:49;pointer-events:none;';
          document.body.appendChild(curtain);
          overlays.push(curtain);

          // Klon, gerçek <img> ile AYNI srcset/sizes'ı taşır — tarayıcı aynı
          // adayı seçip tek indirmeyi paylaşsın diye (farklı URL iki ayrı
          // indirme demek olurdu).
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

          // Süre + ease referans klipten ölçüldü (frame-by-frame analiz:
          // tam ekran→küçük kare büyüklük eğrisi ~0.5s'de tamamlanıyor,
          // yavaş-hızlı-yavaş simetrik bir eğri). power3.inOut kendi
          // tersiyle simetrik olduğu için aynı eğri kapanışta da kullanılır.
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

    // Cleanup'ta ref.current okunmaz (o ana kadar değişmiş olabilir) —
    // düğümler effect çalışırken yakalanır.
    const imgEl = imageRef.current;
    const contentEl = contentRef.current;

    return () => {
      ctx.revert();
      overlays.forEach((el) => el.remove());
      // revert() giriş için gizlenen gerçek görsel/metni geri açar; yine de
      // opacity:0 kalmış bir kalıntı olmadığından emin ol.
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
    // İlk bölüm beklemeden yerleşir: giriş animasyonu kendi klonunu zaten
    // yüklüyor, burada ikinci kez beklemek açılışı geciktirirdi.
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
    // Gerçek <img> ile aynı aday seçilsin diye srcset/sizes önce atanır.
    pre.srcset = stillSrcSet(next.stillImageUrl) ?? '';
    pre.sizes = '100vw';
    pre.src = still(next.stillImageUrl, 1920);
    // decode() desteklenmeyen/başarısız olan durumlarda load olayına düşer;
    // her hâlükârda commit edilir ki geçiş asla asılı kalmasın.
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
  // da) BİRLİKTE crossfade eder — önceden yalnız görsel fade'lenip başlık
  // anında sıçradığı için geçiş kopuk hissettiriyordu. Girişin AYNI src'i
  // yukarıdaki entrance effect'ine aitse (enteredSrcRef) burada atlanır.
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

    // Görsel salt opacity ile geçer (kadraj sabit kalsın); metin hafif
    // yükselerek gelir — giriş animasyonuyla aynı dil, daha kısa süre.
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
    // seasonNumber kasten bağımlılık DEĞİL — geçişi tetikleyen görünen
    // bölümün değişmesidir; sezon yalnız "roman rakamı da fade'lensin mi"
    // sorusunu yanıtlar (shownSeasonRef ile okunur).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayedEpisode?.id]);

  if (notFound) {
    return (
      <>
        <div className={styles.notfound}>
          <h1 className={styles.notfound__title}>Episode not found.</h1>
        </div>
        <Footer />
      </>
    );
  }

  if (!series || !currentSeason || !currentEpisode) return null;
  // Görsel/başlık ekranda duran bölümden okunur (ön-yükleme sırasında bir
  // önceki bölüm kalır); pill'lerin aktif durumu ise URL'den gelir, böylece
  // tıklama geri bildirimi anında olur.
  const shownEpisode = displayedEpisode ?? currentEpisode;

  const seasonIdx = series.seasons.findIndex((s) => s.seasonNumber === seasonNumber);
  const isFirstSeason = seasonIdx <= 0;
  const isLastSeason = seasonIdx >= series.seasons.length - 1;
  // Bölüm okları yalnız DİZİNİN uçlarında kapanır — sezonun ucu artık ölü
  // son değil, komşu sezona geçiştir (bkz. goToEpisode).
  const isFirstEpisode = episodeNumber <= 1 && isFirstSeason;
  const isLastEpisode = !episodes || (episodeNumber >= episodes.length && isLastSeason);

  // Yeni sezonun verisini ÖNCE çeker, episodes'u ve URL'i AYNI anda
  // günceller — aradaki tek render'da bile eski sezonun bölümüyle yeni
  // seasonNumber eşleşip yanlış içerik göstermesin diye (React 18 state
  // güncellemelerini bu .then içinde batch'ler).
  // landOnLast: sezon sınırını GERİYE doğru aşan bölüm oku için — önceki
  // sezona onun ilk değil SON bölümüyle girilir ki akış kesintisiz olsun.
  const goToSeason = (delta, landOnLast = false) => {
    const target = series.seasons[seasonIdx + delta];
    if (!target) return;
    fetchSeasonDetail(target.id).then((detail) => {
      loadedSeasonIdRef.current = target.id;
      setEpisodes(detail.episodes);
      armInPageNav();
      const num = landOnLast ? Math.max(1, detail.episodes.length) : 1;
      navigate(`/series/game-of-thrones/seasons/${target.seasonNumber}/episodes/${num}`);
    });
  };

  // Sezon sınırını aşan ok, komşu sezonun ucuna devreder (kullanıcı isteği):
  // son bölümden ileri → sonraki sezonun 1. bölümü, ilk bölümden geri →
  // önceki sezonun SON bölümü. Dizinin iki ucunda butonlar zaten disabled.
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
    navigate(`/series/game-of-thrones/seasons/${seasonNumber}/episodes/${num}`);
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
          {/* Kart header'a küçüldükçe belirir — bkz. .hero__scrim yorumu. */}
          <div className={styles.hero__scrim} />
        </div>


        <div className={styles.hero__content} ref={contentRef}>
          <p className={`${styles.hero__label} ${styles.hero__collapsible}`}>Select Season</p>
          <div className={`${styles.hero__seasonNav} ${styles.hero__collapsible}`}>
            <button
              type="button"
              className={styles.hero__arrow}
              onClick={() => goToSeason(-1)}
              disabled={isFirstSeason}
              aria-label="Previous season"
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
              aria-label="Next season"
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

          <p className={`${styles.hero__label} ${styles.hero__collapsible}`}>Select Episode</p>
          {/* Şerit cover'da ESKİ hâlinde (‹ 01 02 … ›). Kart küçülürken
              ORTADAKİ liste söner, oklar ise sağa/sola kayarak kartın
              kenarlarındaki son konumlarına gider (kullanıcı kararı). */}
          <div className={styles.hero__episodeStrip}>
            <button
              type="button"
              className={`${styles.hero__arrow} ${styles.hero__arrowPrev}`}
              onClick={() => goToEpisode(episodeNumber - 1)}
              disabled={isFirstEpisode}
              aria-label="Previous episode"
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
                  // Şerit yalnız numara gösteriyor; başlık hem imleç ipucu
                  // (masaüstü) hem de ekran okuyucu etiketi olarak verilir —
                  // "07 neydi?" sorusu tıklamadan yanıtlansın diye.
                  title={ep.title}
                  aria-label={`Episode ${ep.episodeNumber}: ${ep.title}`}
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
              aria-label="Next episode"
            >
              &#8250;
            </button>
          </div>

          {/* Artık gerçek bir hedefi var (alttaki künye bloğu) — dekoratif
              ipucu olmaktan çıkıp odaklanabilir bir butona dönüştü. */}
          <button
            type="button"
            className={`${styles.hero__explore} ${styles.hero__collapsible}`}
            onClick={() =>
              document
                .getElementById('episode-brief')
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
          >
            <span>Explore Episode</span>
            <span className={styles.hero__exploreChevron} aria-hidden="true">
              &#8964;
            </span>
          </button>
        </div>
      </section>

      {/* Hero position:fixed'e geçince akıştan çıkar; yerini bu tutar
          (demodaki body{padding-top:100vh} karşılığı). Efekt desteklenmiyorsa
          CSS'te display:none kalır. */}
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
