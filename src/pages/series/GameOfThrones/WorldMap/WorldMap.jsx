import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Footer } from '../../../../components/Footer/Footer';
import { Seal } from './Seal/Seal';
import { Explore } from './Explore/Explore';
import { fetchProductionDetail, fetchWorldMapStops, theme } from './WorldMap.data';
import styles from './WorldMap.module.css';

gsap.registerPlugin(ScrollTrigger);

// Bağımsız Westeros sayfası (2026-08-05'te GoT ana sayfasından ayrıldı —
// Intro'nun kendi ScrollTrigger'larıyla aynı akışta olması pin-spacer
// çakışmasına yol açıyordu; ayrı route = ayrı DOM/ScrollTrigger context'i).
// Girişi Highlights'ın (eski adıyla TabExhibit) "Westeros" kartı sağlar.
// Pinned kamera sahnesi (bu
// depodaki İLK aktif pin deseni — kullanıcı onayı 2026-08-05). Görsel +
// durak işaretleri TEK bir "camera" sarmalayıcı içinde (--stop-x/y işaretin
// kendi fraksiyonel koordinatı, camera'nın doğal/unscaled boyutuna göre) —
// transform SADECE bu sarmalayıcıya uygulanır, böylece işaretler haritayla
// birebir aynı pan/zoom'u alır (kullanıcı düzeltmesi: önceki sürümde
// işaretler stage'e göre sabitti, kamera hareket edince haritadaki gerçek
// noktadan kopuyordu). object-fit KULLANILMAZ — kırpma fraksiyonel
// koordinat hesabını bozar.
// Kart paneli mobil/reduced-motion'da DOĞAL AKIŞTA liste (erişilebilirlik
// — hepsi eşit görünür); masaüstü+motion-ok'ta JS panel'i stage üstünde
// mutlak konuma taşıyıp aynı hücrede üst üste yığar, GSAP crossfade eder.
// Tempo sinematik yavaş (learned-rules): her durak segmenti kendi 0-1
// biriminde kapanır, komşu segmentlere taşmaz (tween çakışması yok).
// Kamera "hub-and-spoke" gezinir (kullanıcı isteği): GENİŞ AÇI kuş bakışı
// sabit merkez — her durağa oradan ZOOM IN ile girilir, oradan ZOOM OUT ile
// geniş açıya dönülür, sonraki durağa yine oradan girilir. Tek noktadan
// diğerine düz pan YOK; her varış/ayrılış kendi zoom vuruşunu alır (ilk
// girişteki zoom hissi her durakta tekrarlanır).
export default function WorldMap() {
  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const cameraRef = useRef(null);
  const mapRef = useRef(null);
  const stopsRef = useRef(null);
  const vignetteRef = useRef(null);
  const sealImgRef = useRef(null);
  const [series, setSeries] = useState(null);
  const [stops, setStops] = useState([]);

  useEffect(() => {
    let cancelled = false;
    fetchProductionDetail('series', 'game-of-thrones').then((data) => {
      if (!cancelled) setSeries(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!series) return undefined;
    let cancelled = false;
    fetchWorldMapStops(series.id).then((items) => {
      if (!cancelled) setStops(items);
    });
    return () => {
      cancelled = true;
    };
  }, [series]);

  // GoT tema rengini basar — diğer alt sayfalarla (Characters, SeasonEpisodes)
  // aynı davranış.
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
    root.style.setProperty('--card-bg', theme.cardBg ?? theme.bg);

    return () => {
      root.style.setProperty('--bg', prev.bg || '#050505');
      root.style.setProperty('--accent', prev.accent || '#a02cd8');
      root.style.setProperty('--card-bg', prev.cardBg || '#101012');
    };
  }, [series]);

  useLayoutEffect(() => {
    if (stops.length === 0) return undefined;
    const section = sectionRef.current;
    const stage = stageRef.current;
    const cameraEl = cameraRef.current;
    const mapEl = mapRef.current;
    const stopsEl = stopsRef.current;
    const vignetteEl = vignetteRef.current;
    const sealEl = sealImgRef.current;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add(
        {
          motionOk: '(prefers-reduced-motion: no-preference)',
          desktop: '(min-width: 901px)',
        },
        (mmCtx) => {
          const { motionOk, desktop } = mmCtx.conditions;
          // Mobil ve reduced-motion: DOM'un doğal hâli yeterli fallback —
          // kart listesi stage altında akışta, tüm duraklar eşit görünür.
          if (!motionOk || !desktop) return undefined;

          const cards = gsap.utils.toArray(stopsEl.querySelectorAll('[data-stop-card]'));
          const markers = gsap.utils.toArray(cameraEl.querySelectorAll('[data-marker]'));
          const leaderLines = gsap.utils.toArray(stopsEl.querySelectorAll('[data-leader-line]'));
          const articles = cards.map((li) => li.querySelector('article'));

          // Kart paneli artık stage'i TAMAMEN kaplayan bir konumlama
          // bağlamı (inset:0) — her kart kendi içinde BAĞIMSIZ mutlak
          // konumlanır (aşağıdaki resolvePlacement), çünkü sabit tek bir
          // FOCUS_X ("kuş bakışı" hariç kamera odağı) bazı duraklarda
          // haritanın sağ/sol kenarını viewport'un dışında bırakıp siyah
          // boşluk açıyordu (kullanıcı düzeltmesi, ekran görüntüsü
          // 2026-08-05 231712). Grid/gridArea yığması TERK edildi.
          gsap.set(stopsEl, {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 2,
            display: 'block',
            padding: 0,
          });
          gsap.set(leaderLines, { display: 'block' });
          gsap.set(markers, { opacity: 0.5, scale: 1 });

          // Haritanın tamamını genişlik boyunca kadraja alan sabit "kuş
          // bakışı" merkez — her durak buradan zoom'lanır, buraya döner.
          // Kuş bakışında kart yok, focus hep ekran ortasında (0.5).
          // scale>=1 matematiksel olarak yeterli (fx=0.5'te tam kenar
          // kapsama sınırı budur) — 1.1 ekstra güvenlik payı bırakır,
          // özellikle son karede (CLOSING_HOLD) uzun süre sabit durduğu
          // için kenarda ufak bir boşluk bile fark edilir olurdu.
          const WIDE_VIEW = { x: 0.5, y: 0.45, scale: 1.1 };

          // Rendered (unscaled) camera boyutu üzerinden fx/fy'yi verilen
          // focusX noktasına getiren translate hesabı — resize'da yeniden
          // okunur. focusX artık sabit değil, her durak için ayrı hesaplanır.
          const cameraTarget = (view, focusX) => {
            const w = stage.clientWidth;
            const h = w * (mapEl.naturalHeight / mapEl.naturalWidth);
            const { x: fx, y: fy, scale } = view;
            return {
              x: stage.clientWidth * focusX - fx * w * scale,
              y: stage.clientHeight / 2 - fy * h * scale,
              scale,
            };
          };

          // Bir durak için harita her iki kenardan da viewport'u kaplasın
          // diye focusX'in düşmesi gereken güvenli aralık:
          //   [1-(1-fx)*scale, fx*scale]
          // (türetim: sol kenar taşmasın → focusX <= fx*scale; sağ kenar
          // boşluk bırakmasın → focusX >= 1-(1-fx)*scale). Önce SAĞDA kart
          // (focusX=0.36, ekranın solunda dursun) denenir; sığmıyorsa
          // AYNA alınıp SOLDA karta geçilir (focusX=0.64) — bu da kartların
          // "bazen sağdan bazen soldan" gelmesini doğal olarak sağlar
          // (kullanıcı isteği). İkisi de sığmazsa güvenli aralığın
          // ortasına düşülür.
          const CARD_SIDE_MARGIN = 0.36;
          const resolvePlacement = (camera) => {
            const { x: fx, scale } = camera;
            const lo = 1 - (1 - fx) * scale;
            const hi = fx * scale;
            const fits = (focusX) => focusX >= lo - 1e-6 && focusX <= hi + 1e-6;

            if (fits(CARD_SIDE_MARGIN)) return { focusX: CARD_SIDE_MARGIN, side: 'right' };
            const mirrored = 1 - CARD_SIDE_MARGIN;
            if (fits(mirrored)) return { focusX: mirrored, side: 'left' };

            const clampedLo = Math.max(0, lo);
            const clampedHi = Math.min(1, hi);
            const mid = (clampedLo + clampedHi) / 2;
            return { focusX: mid, side: mid < 0.5 ? 'right' : 'left' };
          };

          let tl;
          let trigger;
          let loadListener;

          const build = () => {
            // mapEl.naturalWidth/Height fetch tamamlanmadan 0'dır (img
            // above-the-fold olduğu için lazy KULLANILMIYOR ama ilk
            // render'da network henüz bitmemiş olabilir) — bu durumda
            // h = w*(0/0) = NaN'a düşüp kamera dikey ekseni tamamen
            // kırılıyordu (her durak Duvar bölgesinde donuk kalıyordu).
            // Görsel yüklenene dek inşayı ertele.
            if (!mapEl.complete || !mapEl.naturalWidth) {
              loadListener = () => build();
              mapEl.addEventListener('load', loadListener, { once: true });
              return;
            }

            tl?.kill();
            trigger?.kill();

            gsap.set(cameraEl, { transformOrigin: '0 0', ...cameraTarget(WIDE_VIEW, 0.5) });
            gsap.set(cards, { autoAlpha: 0, y: 16 });
            gsap.set(vignetteEl, { '--vp': 0 });
            gsap.set(sealEl, { opacity: 0, scale: 0.4 });

            // Her kartın ekran YATAY konumu ve akış yönü, o durağın
            // resolvePlacement sonucuna göre BİR KEZ sabitlenir (kamera
            // scrub'ı sadece dikeyde/zoom'da hareket eder, kart yerinde
            // durur) — çizgi+kart bazen sağdan (side:'right') bazen soldan
            // (side:'left') açılır, hangisi haritayı taşırmadan sığdırıyorsa.
            // Çizgi ve kart, LI'nin flex akışına DEĞİL, ikisi de stopsEl'e
            // göre BAĞIMSIZ mutlak konuma yerleştirilir (kullanıcı
            // düzeltmesi sonrası bulunan gerçek kök neden): LI'yi flex
            // container yapıp article'ı flex-child olarak konumlamak,
            // article'ın kendi CSS width'i olsa bile LI'nin shrink-to-fit
            // hesabını "kalan viewport alanı"na göre büyütüp article'ı
            // oraya kadar geriyordu (çok geniş/kenara yapışık kart bug'ı).
            // LI artık SADECE autoAlpha fade hedefi — opacity, absolute
            // konumlanmış çocuklarına da (stacking context sayesinde) işler.
            // Piksel bazlı hesap KASITLI: stopsEl'in CSS containing-block'u
            // .worldmap section'ı (stage değil) — section'ın gerçek render
            // yüksekliği stage'in 100svh'ından farklı çıkabiliyor (header
            // payı vb.), bu da top:'50%' gibi CSS yüzdelerini stage'in
            // gerçek merkeziyle UYUŞMAZ hale getirip kartı üstten/alttan
            // taşırıyordu. Kamera matematiğiyle AYNI kaynağı (stage.client
            // Width/Height) kullanmak bu belirsizliği ortadan kaldırıyor.
            const stageW = stage.clientWidth;
            const stageH = stage.clientHeight;
            const centerY = stageH / 2;
            const MARKER_CLEARANCE = 36;
            const LINE_WIDTH = 96;
            const GAP = 24; // --space-lg
            const placements = stops.map((stop) => resolvePlacement(stop.camera));
            placements.forEach((placement, i) => {
              const cardOnRight = placement.side === 'right';
              const markerX = placement.focusX * stageW;
              const lineOffset = cardOnRight
                ? markerX + MARKER_CLEARANCE
                : stageW - markerX + MARKER_CLEARANCE;
              const cardOffset = cardOnRight
                ? markerX + MARKER_CLEARANCE + LINE_WIDTH + GAP
                : stageW - markerX + MARKER_CLEARANCE + LINE_WIDTH + GAP;

              gsap.set(leaderLines[i], {
                position: 'absolute',
                top: centerY,
                yPercent: -50,
                left: cardOnRight ? lineOffset : 'auto',
                right: cardOnRight ? 'auto' : lineOffset,
              });
              gsap.set(articles[i], {
                position: 'absolute',
                top: centerY,
                yPercent: -50,
                left: cardOnRight ? cardOffset : 'auto',
                right: cardOnRight ? 'auto' : cardOffset,
              });
            });

            tl = gsap.timeline({ paused: true });

            // Her durak dört fazdan geçer: geniş açıdan ZOOM IN → HOLD
            // (kart okunur) → ZOOM OUT geniş açıya → kısa nefes payı. Son
            // durak da aynı zoom-out'u alır — sahne tüm krallığın geniş
            // açı görünümüyle kapanır (kullanıcı isteği), kartsız/markersız
            // sade bir kapanış karesi olarak daha uzun tutulur.
            const ZOOM_IN = 0.9;
            const HOLD = 1.0;
            const ZOOM_OUT = 0.8;
            const WIDE_HOLD = 0.3;
            const CLOSING_HOLD = 2.6;
            // CLOSING_HOLD'un iç bölüşümü: son durağın kartı/işareti
            // söndükten sonra ekran bir süre TEMİZ geniş açıda durur
            // (PRE_DARK_HOLD — kullanıcı düzeltmesi: "Highgarden yazısı
            // gittikten sonra kararmaya başlasın"), ancak DARKEN_DURATION
            // boyunca vinyet kapanır; kalan pay tam-siyah hold'dur.
            // PRE_DARK_HOLD büyütüldü (kullanıcı düzeltmesi: metin tamamen
            // gitmeden kararma başlıyordu — kamera zoom-out'u bitip metin
            // gerçekten kaybolduktan SONRA bu payın başlaması gerekiyor;
            // önceki 0.35 değeri `scrub`'ın yakalama gecikmesiyle ezilip
            // fark edilmez oluyordu, 1.0'a çıkarıldı).
            const PRE_DARK_HOLD = 1.0;
            const DARKEN_DURATION = 1.3;

            // Mühür artık scroll pozisyonuna göre HER karede set edilmiyor
            // (kullanıcı düzeltmesi: önceki sürüm `vp`'den doğrudan opacity
            // hesaplıyordu — hızlı bir scroll/trackpad hareketi o aralığı
            // birkaç yüz milisaniyede geçtiği için pencereyi ne kadar
            // genişletirsek genişletelim mühür "bir anda çıkıyor" hissi
            // veriyordu; scroll pozisyonuna bağlı animasyonun GERÇEK süresi
            // her zaman scroll hızına bağlıdır, mesafeye değil). Bunun yerine
            // eşik (SEAL_START_VP) geçildiği AN bir kere tetiklenen, sabit
            // SÜRELİ (gerçek saniye) bir gsap.to tween'i oynatılır — scroll
            // ne kadar hızlı olursa olsun mühür aynı tempoda belirir/söner.
            let sealState = 'hidden';

            let t = 0;
            let closingHoldStart = 0;
            stops.forEach((stop, i) => {
              tl.addLabel(`arrive${i}`, t);
              tl.to(
                cameraEl,
                {
                  ...cameraTarget(stop.camera, placements[i].focusX),
                  duration: ZOOM_IN,
                  ease: 'power2.inOut',
                },
                t
              );
              tl.to(
                markers[i],
                { opacity: 1, scale: 1.3, duration: ZOOM_IN * 0.3 },
                t + ZOOM_IN * 0.7
              );
              tl.to(markers[i], { scale: 1, duration: ZOOM_IN * 0.2 }, t + ZOOM_IN * 0.9);
              tl.fromTo(
                cards[i],
                { autoAlpha: 0, y: 16 },
                { autoAlpha: 1, y: 0, duration: ZOOM_IN * 0.45, ease: 'power1.inOut' },
                t + ZOOM_IN * 0.6
              );
              t += ZOOM_IN + HOLD;

              const isLast = i === stops.length - 1;
              tl.to(
                cards[i],
                { autoAlpha: 0, y: -16, duration: ZOOM_OUT * 0.4, ease: 'power1.inOut' },
                t
              );
              tl.to(markers[i], { opacity: 0.5, scale: 1, duration: ZOOM_OUT * 0.4 }, t);
              tl.to(
                cameraEl,
                { ...cameraTarget(WIDE_VIEW, 0.5), duration: ZOOM_OUT, ease: 'power2.inOut' },
                t
              );
              if (isLast) closingHoldStart = t + ZOOM_OUT;
              t += ZOOM_OUT + (isLast ? CLOSING_HOLD : WIDE_HOLD);
            });

            // Kapanış vinyeti + mühür: `tl`'nin KENDİ `onUpdate`'ine bağlanır
            // — ScrollTrigger'ın `onUpdate`'ine DEĞİL (kullanıcı düzeltmesi,
            // kök neden: kartların/kameranın fade-out'u `scrub:1.2` ile
            // GECİKMELİ oynayan `tl`'den geliyordu, ama vinyet+mühür daha
            // önce ScrollTrigger'ın HAM/gecikmesiz `self.progress`'ini
            // kullanıyordu — hızlı scroll'da ham pozisyon önden gidip mühür
            // HENÜZ FADE OLMAMIŞ kartın üstüne "kendiliğinden" biniyordu,
            // ekran görüntüsüyle doğrulandı: Highgarden kartı hâlâ tam
            // görünürken mühür üstüne binmişti). `tl`'nin onUpdate'i tl'nin
            // KENDİ gecikmeli oynatım pozisyonuyla birebir aynı anda,
            // scroll durduktan sonraki "yakalama" kareleri dahil, tetiklenir
            // — kart fade-out'uyla AYNI kaynaktan beslenince ikisi birbirini
            // asla geçemez.
            // Mühür artık ayrı bir section DEĞİL — haritanın ÜSTÜNE binen
            // bir overlay (kullanıcı isteği).
            // vp: PRE_DARK_HOLD kadar gecikmeli başlar (son durağın kartı/
            // işareti söndükten sonra ekran bir süre TEMİZ durur, hemen
            // kararmaz — kullanıcı düzeltmesi). Mühür vp'nin KENDİSİYLE
            // DEĞİL, vp %70'i geçtikten sonraki payla (SEAL_START_VP) büyür
            // — vinyet yeterince kapanıp mührün kendi kare siyah zemini
            // (seal.webp) haritayla karışana kadar mühür görünmez kalır
            // (kullanıcı düzeltmesi: "kenarları görünüyor, kararma
            // küçülünce ortaya çıksın", sonra "biraz daha geç gelsin").
            // Hedef scale 1.35 + büyük taban boyut (kullanıcı: "biraz daha
            // fazla büyüsün", sonra "hâlâ büyük değil"). Mührün KENDİ geçişi
            // sabit SÜRELİ (gerçek saniye) bir gsap.to tween — eşik
            // (SEAL_START_VP) geçildiği AN bir kere tetiklenir, her karede
            // set edilmez, scroll ne kadar hızlı olursa olsun aynı tempoda
            // belirir/söner.
            tl.eventCallback('onUpdate', () => {
              const rawT = tl.progress() * t;
              const vp = gsap.utils.clamp(
                0,
                1,
                (rawT - closingHoldStart - PRE_DARK_HOLD) / DARKEN_DURATION
              );
              gsap.set(vignetteEl, { '--vp': vp });

              const SEAL_START_VP = 0.7;
              if (vp >= SEAL_START_VP && sealState !== 'shown') {
                sealState = 'shown';
                gsap.to(sealEl, {
                  opacity: 1,
                  scale: 1.35,
                  duration: 1.4,
                  ease: 'power2.out',
                  overwrite: true,
                });
              } else if (vp < SEAL_START_VP && sealState !== 'hidden') {
                sealState = 'hidden';
                gsap.to(sealEl, {
                  opacity: 0,
                  scale: 0.5,
                  duration: 0.7,
                  ease: 'power2.in',
                  overwrite: true,
                });
              }
            });

            trigger = ScrollTrigger.create({
              trigger: section,
              start: 'top top',
              end: () => `+=${t * window.innerHeight * 0.85}`,
              scrub: 1.2,
              pin: true,
              invalidateOnRefresh: true,
              animation: tl,
            });
          };

          build();

          // Resize'da rota px bazlı olduğu için yeniden inşa (debounce) —
          // dragon-path deseninin resize dersi.
          let resizeTimer;
          const onResize = () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(build, 200);
          };
          window.addEventListener('resize', onResize);

          return () => {
            window.removeEventListener('resize', onResize);
            clearTimeout(resizeTimer);
            if (loadListener) mapEl.removeEventListener('load', loadListener);
            tl?.kill();
            trigger?.kill();
          };
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, [stops]);

  if (!series) return null;

  return (
    <>
      <header className={styles.worldmap__head}>
        <Link className={styles.worldmap__back} to="/series/game-of-thrones">
          ← Game of Thrones
        </Link>
        <span className={styles.worldmap__kicker}>Realm</span>
        <h1 className={styles.worldmap__heading}>Westeros</h1>
      </header>

      {stops.length > 0 && (
        <section className={styles.worldmap} aria-label="World map" ref={sectionRef}>
          <div className={styles.worldmap__stage} ref={stageRef}>
            <div className={styles.worldmap__camera} ref={cameraRef}>
              <img
                className={styles.worldmap__map}
                src="/got/world-map.png"
                alt="Westeros haritası"
                decoding="async"
                ref={mapRef}
              />
              {stops.map((stop) => (
                <span
                  key={stop.id}
                  className={styles.worldmap__marker}
                  data-marker
                  style={{ '--stop-x': stop.camera.x, '--stop-y': stop.camera.y }}
                  aria-hidden="true"
                >
                  <img
                    className={styles.worldmap__markerImg}
                    src={stop.image}
                    alt=""
                    loading="lazy"
                  />
                </span>
              ))}
            </div>
            <div className={styles.worldmap__vignette} ref={vignetteRef} aria-hidden="true" />
            <div className={styles.worldmap__sealLayer}>
              <Seal imgRef={sealImgRef} />
            </div>
          </div>

          <ul className={styles.worldmap__stops} aria-live="polite" ref={stopsRef}>
            {stops.map((stop) => (
              <li key={stop.id} className={styles.worldmap__stop} data-stop-card>
                <span
                  className={styles.worldmap__leaderLine}
                  data-leader-line
                  aria-hidden="true"
                />
                <article className={styles.worldmap__card}>
                  <figure className={styles.worldmap__cardFigure}>
                    <img
                      className={styles.worldmap__cardImg}
                      src={stop.image}
                      alt={stop.title}
                      loading="lazy"
                    />
                  </figure>
                  <div className={styles.worldmap__cardText}>
                    <span className={styles.worldmap__house}>{stop.house}</span>
                    <h3 className={styles.worldmap__title}>{stop.title}</h3>
                    <div className={styles.worldmap__descBlock} data-lead="true">
                      {stop.description.map((paragraph, i) => (
                        <p key={i} className={styles.worldmap__desc}>
                          {paragraph}
                        </p>
                      ))}
                    </div>
                    {stop.linkUrl && (
                      <Link className={styles.worldmap__link} to={stop.linkUrl}>
                        Keşfet →
                      </Link>
                    )}
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Explore />

      <Footer />
    </>
  );
}
