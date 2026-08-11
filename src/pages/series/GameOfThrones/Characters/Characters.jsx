import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { Footer } from '../../../../components/Footer/Footer';
import { RelatedContent } from '../../../../components/RelatedContent/RelatedContent';
import { fetchProductionDetail, fetchCharactersForSeries, getCharacterAnalysisBlogs, theme } from './Characters.data';
import { CharacterBio } from './CharacterBio/CharacterBio';
import styles from './Characters.module.css';

// Kartın gerçek boyu içeriğe (bio uzunluğu) göre değiştiği için hedef kutu
// ANALİTİK hesaplanmaz — CharacterBio mount olur olmaz kendi görsel
// elemanının gerçek rect'ini `onMeasured` ile bildirir, flip-clone O rect'e
// büyür (kullanıcı referansı: "Karakter blokları tasarımı" — ortalanmış kart,
// tam-viewport panel değil).
const HISTORY_STATE_KEY = 'characterCardOpen';

// Karakter kadrosu — hane/aile grubu YOK (Character entity'de böyle bir alan
// yok), sıralama backend'in billingOrder'ına göre gelir. GoT tema rengi
// (--accent vb.) diğer alt sayfalarla aynı şekilde basılır (aşağıdaki tema
// effect'i) — "jenerik, tema yok" önceki varsayımı kullanıcı kararıyla
// geçersiz: bu bir GoT alt sayfası, global brand-purple'da kalmamalı.
//
// Şerit `RelatedContent`'in (Blog/EpisodePage "Dive Deeper") Window Carousel
// mekaniğinin BİREBİR kopyasıdır (kullanıcı isteği) — sürükle-kaydır, ok/nokta
// kontrolleri, hover'da üstten+alttan uzayan medya katmanı, scroll'a bağlı
// object-position pan. Component birebir import edilmedi çünkü RelatedContent
// tıklamada blog flip+navigate'e kilitli; burada tıklama route DEĞİŞTİRMEZ,
// CharacterBio'yu aynı sayfada panel olarak açar.
//
// Kart seçimi YENİ SAYFAYA GEÇMEZ (kullanıcı kararı, referans: split-screen
// karakter slaytları) — CharacterBio, grid'in üstünde animasyonla açılan
// tam-ekran bir panel olarak render edilir.
export default function Characters() {
  const [characters, setCharacters] = useState(null);
  const [analysisBlogs, setAnalysisBlogs] = useState(null);
  const [activeIndex, setActiveIndex] = useState(null);
  const [closing, setClosing] = useState(false);

  const rootRef = useRef(null);
  const viewportRef = useRef(null);
  const trackRef = useRef(null);

  const [carouselActive, setCarouselActive] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // SeasonEpisodes'daki gibi iki adım: önce dizinin id'si, sonra o id'ye
    // bağlı karakter listesi (GET /api/series/:id/characters).
    fetchProductionDetail('series', 'game-of-thrones')
      .then((series) => fetchCharactersForSeries(series.id))
      .then((data) => {
        if (!cancelled) setCharacters(data);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    getCharacterAnalysisBlogs().then((data) => {
      if (!cancelled) setAnalysisBlogs(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // GoT tema rengini basar (learned-rules: "Yapım sayfaları TAM TEMA
  // kurar") — SeasonEpisodes/EpisodePage ile aynı davranış. Önceki "jenerik,
  // tema yok" varsayımı kullanıcı kararıyla geçersiz kılındı: bu sayfa da
  // diğer GoT alt sayfaları gibi markanın sıcak tonunu (--accent) taşır,
  // global brand-purple'da kalmaz.
  useEffect(() => {
    if (!characters) return undefined;
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
  }, [characters]);

  // Kart adımı (kart genişliği + gap) CSS'ten değil DOM'dan okunur —
  // RelatedContent.jsx ile birebir aynı yöntem.
  const stride = useCallback(() => {
    const [first, second] = trackRef.current?.children ?? [];
    if (!first) return 0;
    return second ? second.offsetLeft - first.offsetLeft : first.offsetWidth;
  }, []);

  const sync = useCallback(() => {
    const el = viewportRef.current;
    const track = trackRef.current;
    if (!el || !track) return;
    const center = el.scrollLeft + el.clientWidth / 2;
    let closest = 0;
    let bestDist = Infinity;
    [...track.children].forEach((child, i) => {
      const dist = Math.abs(child.offsetLeft + child.offsetWidth / 2 - center);
      if (dist < bestDist) {
        bestDist = dist;
        closest = i;
      }
    });
    setCarouselActive(closest);
    setAtStart(el.scrollLeft <= 1);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return undefined;
    sync();
    el.addEventListener('scroll', sync, { passive: true });
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', sync);
      ro.disconnect();
    };
  }, [sync, characters]);

  // Giriş: imza-dalga (learned-rules) — başlık tek blok önden, şerit ~0.15s
  // arkasından kademeli takip eder. Bu bölüm sayfanın EN ÜSTÜNDE (Hero yok) —
  // ScrollTrigger KULLANILMAZ: mount anında zaten "80% eşiğini geçmiş" sayılsa
  // da ScrollTrigger ilk oluşturulduğunda bu durumu güvenilir tetiklemiyordu
  // (kartlar opacity:0'da asılı kalıyordu) — düz mount-time gsap.from yeterli
  // ve RelatedContent'in aksine burada gerekli de değil (o bölüm sayfanın
  // aşağısında, gerçekten scroll'a bağlı).
  useLayoutEffect(() => {
    if (!characters || characters.length === 0) return undefined;
    const root = rootRef.current;
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from(root.querySelectorAll('[data-reveal]'), {
          opacity: 0,
          x: 140,
          y: 56,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.12,
          clearProps: 'opacity,transform',
          onComplete: sync,
        });
      });

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(root.querySelectorAll('[data-reveal]'), { opacity: 1, x: 0, y: 0 });
      });
    }, rootRef);

    return () => ctx.revert();
  }, [characters, sync]);

  const step = (direction) => {
    const el = viewportRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * stride(), behavior: 'smooth' });
  };

  // Sürükle-kaydır — RelatedContent.jsx ile birebir (kaynağı orada
  // codepen.io/thenutz/pen/VwYeYEE olarak veriliyor).
  const drag = useRef({ active: false, startX: 0, startLeft: 0, moved: false });

  const onPointerDown = (e) => {
    const el = viewportRef.current;
    if (!el) return;
    drag.current = { active: true, startX: e.pageX, startLeft: el.scrollLeft, moved: false };
    setDragging(true);
  };

  const endDrag = () => {
    if (!drag.current.active) return;
    drag.current.active = false;
    setDragging(false);
  };

  const onPointerMove = (e) => {
    if (!drag.current.active) return;
    const el = viewportRef.current;
    if (!el) return;
    e.preventDefault();
    if (Math.abs(e.pageX - drag.current.startX) > 6) drag.current.moved = true;
    el.scrollLeft = drag.current.startLeft - (e.pageX - drag.current.startX) * 3;
  };

  // ---- Açılış: kart görseli KENDİ konumundan CharacterBio kartının görsel
  // kutusuna büyür ("pencere açılır") — RelatedContent'in blog flip'iyle aynı
  // teknik (clone + gsap.to, 0.65s power3.inOut), tek fark hedefin route değil
  // bu sayfadaki kart olması. CharacterBio ANINDA mount olur (opacity:0,
  // pointer-events:none — bkz. JSX) ki mount olur olmaz kendi görsel
  // elemanının GERÇEK rect'ini `onMeasured` ile bildirsin; clone o ana kadar
  // origin'de bekler, rect gelince asıl büyüme başlar.
  const openingRef = useRef(false);
  const pendingCloneRef = useRef(null);
  const revealedRef = useRef(false);
  // React 18 dev/StrictMode CharacterBio'nun mount effect'ini (onMeasured)
  // iki kez çağırıyor — bu senkron bayrak olmadan aynı clone üstünde İKİ
  // çakışan gsap.to() tween'i başlıyordu (ikisi de aynı rAF'ta ilerleyip
  // gereksiz iş + gözlemlenebilir yavaşlama yaratıyordu).
  const measuringRef = useRef(false);
  const [revealed, setRevealed] = useState(false);
  // Sentinel'i pushState'lemeden HEMEN önceki state — popstate'te e.state bu
  // değerle eşleşmiyorsa olay bizim açtığımız kartla ilgisiz demektir (ör.
  // tarayıcı otomasyon eklentisinin kendi history yönetimi, gözlemlenen
  // {"idx":0} state'i gibi) ve kartı kapatmamalı.
  const baseHistoryStateRef = useRef(null);

  const openCharacter = (index) => {
    // Şeridi sürüklerken bırakılan yer bir karta denk gelse de tıklama
    // sayılmaz (6px eşiği, bkz. onPointerMove) — RelatedContent ile aynı kural.
    if (drag.current.moved || openingRef.current) return;
    const li = trackRef.current?.children[index];
    const img = li?.querySelector('img');
    if (!img) return;

    baseHistoryStateRef.current = window.history.state;
    window.history.pushState({ [HISTORY_STATE_KEY]: true }, '');

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      revealedRef.current = true;
      setActiveIndex(index);
      setRevealed(true);
      return;
    }

    openingRef.current = true;
    revealedRef.current = false;
    measuringRef.current = false;
    setRevealed(false);

    // Klon burada, kartın GÜNCEL (ortalanmış) ekran konumundan doğar.
    const startFlight = () => {
      const originRect = img.getBoundingClientRect();
      const clone = document.createElement('img');
      clone.src = img.currentSrc || img.src;
      clone.alt = '';
      clone.style.cssText =
        `position:fixed;z-index:80;object-fit:cover;pointer-events:none;` +
        `top:${originRect.top}px;left:${originRect.left}px;width:${originRect.width}px;height:${originRect.height}px;`;
      document.body.appendChild(clone);
      pendingCloneRef.current = clone;

      // CharacterBio hemen mount olur (görünmez) — onMeasured tetiklenince
      // handleMeasured clone'u gerçek hedefe büyütür.
      setActiveIndex(index);
    };

    // Tıklanan kart şeridin kenarına yakınsa görsel açılışta uzun/çapraz bir
    // yatay mesafe kat edip "uçuyormuş" gibi çirkin duruyordu (kullanıcı
    // raporu) — önce kart carousel viewport'unun ORTASINA kaydırılır, klon
    // ancak o zaman (kısa mesafeden) büyümeye başlar.
    const viewport = viewportRef.current;
    if (viewport) {
      const targetLeft = li.offsetLeft + li.offsetWidth / 2 - viewport.clientWidth / 2;
      const clampedLeft = Math.max(0, Math.min(targetLeft, viewport.scrollWidth - viewport.clientWidth));
      if (Math.abs(viewport.scrollLeft - clampedLeft) > 2) {
        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          viewport.removeEventListener('scrollend', finish);
          startFlight();
        };
        // 'scrollend' desteklenmeyen tarayıcılar için yedek zaman aşımı.
        viewport.addEventListener('scrollend', finish, { once: true });
        setTimeout(finish, 500);
        viewport.scrollTo({ left: clampedLeft, behavior: 'smooth' });
      } else {
        startFlight();
      }
    } else {
      startFlight();
    }
  };

  const handleMeasured = (targetRect) => {
    const clone = pendingCloneRef.current;
    if (!clone || revealedRef.current || measuringRef.current) return;
    measuringRef.current = true;

    // RelatedContent'teki (Dive Deeper / Blog flip) teknikle BİREBİR:
    // top/left/width/height doğrudan tween'lenir. Önceki "sadece transform
    // (x/y/scale)" yaklaşımı reflow'dan kaçınmak için seçilmişti ama küçük
    // grid resminden büyük bio kutusuna geniş ölçek farkında GPU'nun tek
    // dokuyu büyütmesi gözle görülür bir takılma yaratıyordu (kullanıcı
    // raporu) — kutuyu gerçekten büyüten bu yöntem her karede yeniden
    // rasterize ettiği için daha pürüzsüz akıyor.
    gsap.to(clone, {
      top: targetRect.top,
      left: targetRect.left,
      width: targetRect.width,
      height: targetRect.height,
      duration: 0.65,
      ease: 'power3.inOut',
      onComplete: () => {
        revealedRef.current = true;
        setRevealed(true);
        clone.remove();
        pendingCloneRef.current = null;
        openingRef.current = false;
      },
    });
  };

  // ---- Kapanış: TERSİ — kartın görseli KENDİ konumundan başlayıp orijinal
  // grid kartının konumuna küçülüp kaybolur. Kartın kendi fade-out'uyla
  // (`closing` prop → overlay opacity, --duration-slow) PARALEL oynar, ikisi
  // de ~aynı sürede bitip ANCAK O ZAMAN gerçek unmount olur. Tetikleyici
  // HER ZAMAN `window.history.back()` — back tuşu ve panel içi Back/Escape
  // AYNI popstate akışından geçer (bkz. aşağıdaki effect), çift kapanma olmaz.
  const closeCharacter = () => {
    const index = activeIndex;
    const bioImg = document.querySelector('[data-bio-image]');
    const cardImg = trackRef.current?.children[index]?.querySelector('img');
    setClosing(true);

    if (!bioImg || !cardImg || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setActiveIndex(null);
      setClosing(false);
      setRevealed(false);
      return;
    }

    const fromRect = bioImg.getBoundingClientRect();
    const toRect = cardImg.getBoundingClientRect();

    const clone = document.createElement('img');
    clone.src = bioImg.currentSrc || bioImg.src;
    clone.alt = '';
    clone.style.cssText =
      `position:fixed;z-index:80;object-fit:cover;pointer-events:none;` +
      `top:${fromRect.top}px;left:${fromRect.left}px;width:${fromRect.width}px;height:${fromRect.height}px;`;
    document.body.appendChild(clone);

    // Açılışla aynı gerekçe/teknik: top/left/width/height doğrudan tween.
    gsap.to(clone, {
      top: toRect.top,
      left: toRect.left,
      width: toRect.width,
      height: toRect.height,
      duration: 0.65,
      ease: 'power3.inOut',
      onComplete: () => {
        clone.remove();
        setActiveIndex(null);
        setClosing(false);
        setRevealed(false);
      },
    });
  };

  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;

  const closeCharacterRef = useRef(closeCharacter);
  closeCharacterRef.current = closeCharacter;

  // Geri tuşu kartı kapatır (kullanıcı kararı) — açılışta pushState edilen
  // sentinel state pop'landığında (hem gerçek geri tuşu hem panel içi
  // Back/Escape'in tetiklediği history.back() için) aynı kapanış animasyonu
  // oynar. Route/URL DEĞİŞMEZ (pushState boş path ile), bu yüzden App.jsx'in
  // sayfa geçişi mantığına dokunmaz.
  useEffect(() => {
    function onPopState(e) {
      if (activeIndexRef.current === null) return;
      // Sadece bizim pushState'imizden ÇIKAN geçişte kapat — state şekli
      // açılıştan önceki base state ile eşleşmiyorsa (ör. alakasız bir
      // popstate) yok say.
      if (JSON.stringify(e.state) !== JSON.stringify(baseHistoryStateRef.current)) return;
      closeCharacterRef.current();
    }
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const requestClose = () => window.history.back();

  return (
    <>
      <section className={styles.characters} ref={rootRef}>
        {/* BlogPost.module.css'teki .back ile aynı sabit-pill dil — bu sayfada
            hero yok ama navbar altındaki konum tüm alt sayfalarda ortak
            olmalı. */}
        <Link to="/series/game-of-thrones" className={styles.characters__back}>
          <span aria-hidden="true">&#8249;</span>
          <span>Back</span>
        </Link>

        <div className={styles.characters__inner}>
          <header className={styles.characters__head} data-reveal="">
            <span className={styles.characters__kicker}>Cast</span>
            <h1 className={styles.characters__heading}>Characters</h1>
          </header>

          {characters?.length === 0 && (
            <p className={styles.characters__empty}>No characters yet.</p>
          )}

          {characters && characters.length > 0 && (
            <>
              <div
                className={styles.characters__viewport}
                ref={viewportRef}
                data-dragging={dragging || undefined}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={endDrag}
                onPointerLeave={endDrag}
                onPointerCancel={endDrag}
              >
                <ul className={styles.characters__track} ref={trackRef}>
                  {characters.map((character, index) => (
                    <li className={styles.characters__item} key={character.id} data-reveal="">
                      <button
                        type="button"
                        className={styles.card}
                        data-active={index === carouselActive || undefined}
                        onClick={() => openCharacter(index)}
                      >
                        <div className={styles.card__media}>
                          <div className={styles.card__frame}>
                            {character.imageUrl && (
                              <img
                                className={styles.card__image}
                                src={character.imageUrl}
                                alt=""
                                loading="lazy"
                                decoding="async"
                                draggable={false}
                              />
                            )}
                          </div>
                        </div>
                        <span className={styles.card__name}>{character.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className={styles.characters__controls}>
                <button
                  type="button"
                  className={styles.characters__arrow}
                  onClick={() => step(-1)}
                  disabled={atStart}
                  aria-label="Previous"
                >
                  &#8249;
                </button>

                <div className={styles.characters__dots} aria-hidden="true">
                  {characters.map((character, i) => (
                    <span
                      className={styles.characters__dot}
                      key={character.id}
                      data-active={i === carouselActive || undefined}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  className={styles.characters__arrow}
                  onClick={() => step(1)}
                  disabled={atEnd}
                  aria-label="Next"
                >
                  &#8250;
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      <RelatedContent items={analysisBlogs} heading="Character Analysis" />

      <Footer />

      {characters && activeIndex !== null && (
        <CharacterBio
          character={characters[activeIndex]}
          index={activeIndex}
          visible={revealed && !closing}
          onMeasured={handleMeasured}
          onRequestClose={requestClose}
          onPrev={() => setActiveIndex((i) => (i - 1 + characters.length) % characters.length)}
          onNext={() => setActiveIndex((i) => (i + 1) % characters.length)}
        />
      )}
    </>
  );
}
