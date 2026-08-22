import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LocalizedLink as Link } from '../../shared/i18n/LocalizedLink';
import { useLocalizedNavigate as useNavigate } from '../../shared/i18n/useLocalizedNavigate';
import gsap from 'gsap';
import {
  armBlogFlip,
  isBlogReturnArmed,
  readBlogReturn,
  blogExpandedBox,
} from '../../motion/cinematic';
import styles from './RelatedContent.module.css';

// "Dive Deeper" içerik carousel'i — paylaşılan (birden çok sayfa kullanır)
// component. İlk kaynağı bölüm sayfasıydı (EpisodePage), Blog yazı sayfası
// da kendi Dive Deeper şeridi için AYNI component'i kullanır (learned-rules:
// "ikinci sayfada kullanılan component paylaşıma terfi eder"). Veri artık
// BURADA çekilmez — `items` prop'uyla beslenir, her sayfa kendi kaynağından
// (EpisodePage.data.js / BlogPost.data.js) besler; component salt
// sunumdan sorumludur.
//
// Yerleşim kullanıcı wireframe'inden ölçüldü — başlık sola dayalı, altında
// 2:3 dikey kart şeridi (sağda sıradaki kart görünür/kırpılı), en altta
// ORTALANMIŞ ok + nokta kontrolleri.
//
// Şeridin kaydırması NATIVE scroll + CSS scroll-snap (learned-rules:
// smooth-scroll kütüphanesi yasak); dokunmatik swipe bedavaya gelir.
//
// AÇILIŞ — kullanıcı kararı: TIKLAMAYLA. Karta tıklanınca görsel bulunduğu
// yerden büyüyüp ekranın ortasındaki kutuya oturur, arkası siyaha kararır ve
// /blog/:slug'a DEVREDİLİR. Büyüyen klon document.body'de yaşadığı için
// route değişiminde silinmez; hedef sayfa onu aynı geometride devralır
// (bkz. motion/cinematic.js). Scroll'a bağlı tetikleme YOK.
//
// GERİ DÖNÜŞ mantığı da BURADADIR (aşağıdaki return-armed effect): hangi
// sayfada render edilirse edilsin, Blog'dan dönüldüğünde kendi şeridindeki
// orijin karta küçülüp yerleşir — Blog → Blog geçişinde de (Dive Deeper
// şeridinden başka bir yazı açma) bu sayede ekstra kod gerekmeden doğru kart
// konumuna döner.
export function RelatedContent({ items, heading }) {
  const { t } = useTranslation();
  const resolvedHeading = heading ?? t('series.diveDeeperHeading');
  const navigate = useNavigate();
  const rootRef = useRef(null);
  const viewportRef = useRef(null);
  const trackRef = useRef(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [dragging, setDragging] = useState(false);

  const activeIndexRef = useRef(0);
  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  // Kart adımı (kart genişliği + gap) CSS'ten değil DOM'dan okunur — genişlik
  // clamp'li ve gap token'lı olduğu için tek doğru kaynak gerçek yerleşimdir.
  const stride = useCallback(() => {
    const [first, second] = trackRef.current?.children ?? [];
    if (!first) return 0;
    return second ? second.offsetLeft - first.offsetLeft : first.offsetWidth;
  }, []);

  const sync = useCallback(() => {
    const el = viewportRef.current;
    const track = trackRef.current;
    if (!el || !track) return;
    // Noktalar için "şu an ortadaki kart" — gezinme göstergesi.
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
    setActiveIndex(closest);
    setAtStart(el.scrollLeft <= 1);
    // Alt piksel yuvarlamaları için 1px tolerans.
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return undefined;
    sync();
    el.addEventListener('scroll', sync, { passive: true });
    // Kart genişliği clamp'li: yeniden boyutlandırmada adım ve uç durumları
    // değişir, oklar yanlış disabled kalmasın.
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', sync);
      ro.disconnect();
    };
  }, [sync]);

  // GERİ DÖNÜŞ: Blog'dan gelindiyse sayfa "sıfırdan yüklenmiş" gibi
  // görünmemeli — hem dikey scroll hem şeridin yatay konumu bırakıldığı yere
  // geri konur. Bayrak TÜKETİLMEZ, zaman penceresiyle sönümlenir: StrictMode
  // effect'i iki kez çağırıyor ve tüketilse hayatta kalan ikinci örnek
  // konumlandırmayı hiç yapmazdı.
  useEffect(() => {
    const ret = isBlogReturnArmed() ? readBlogReturn() : null;
    if (!ret) return undefined;

    if (viewportRef.current && ret.scrollLeft != null) {
      viewportRef.current.scrollLeft = ret.scrollLeft;
      sync();
    }
    if (ret.scrollY == null) return undefined;

    let raf = 0;
    let dropped = false;
    const deadline = performance.now() + 2000;

    // AÇILIŞIN TAM AYNASI: Blog sayfası kutuyu büyümüş hâlde ve perdeyi
    // siyah bırakıp devretti. Bu sayfa yerine oturunca kutu kartına
    // küçülürken perde açılır — açılışta kutu büyürken perde kapanıyordu.
    const removeNow = () => {
      const clone = document.querySelector('img[data-blog-flip]');
      const scrim = document.querySelector('div[data-blog-flip]');
      // Kartın GERÇEK konumu şimdi ölçülür — donmuş originRect yalnız yedek.
      // Belge yüksekliği remount sonrası birkaç piksel farklı oturabildiği
      // için sabit rect kullanınca klon kartın biraz yanına iniyordu.
      //
      // Ölçümden önce kartın geçişi DONDURULUR: aktif kart `scale(1.04)`
      // alıyor ama bu 300ms'lik bir CSS geçişi, ölçüm anında henüz
      // tamamlanmamış oluyordu — klon 280px'e inerken kart 291px'e büyüyor ve
      // aradaki fark "konum şaşması" olarak görünüyordu.
      const li = trackRef.current?.children[ret.originIndex];
      const cardEl = li?.firstElementChild;
      const liveEl = li?.querySelector('img');
      const prevTransition = cardEl?.style.transition;
      if (cardEl) {
        cardEl.style.transition = 'none';
        void cardEl.offsetWidth; // reflow: hedef transform anında uygulansın
      }
      const liveRect = liveEl?.getBoundingClientRect();
      if (cardEl) cardEl.style.transition = prevTransition ?? '';
      const target =
        liveRect && liveRect.width > 0
          ? { top: liveRect.top, left: liveRect.left, width: liveRect.width, height: liveRect.height }
          : ret.originRect;
      const drop = () => [clone, scrim].forEach((el) => el?.remove());

      // Kilit KLONUN ÜSTÜNDE, effect kapsamında değil: StrictMode effect'i
      // iki kez çağırıyor ve her örnek kendi bayrağını taşıdığı için aynı
      // klona İKİ timeline biniyordu — küçülme iki kat hızlı akıyordu.
      if (clone?.dataset.blogReturning) return;
      if (clone) clone.dataset.blogReturning = '1';

      if (!clone || !target || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        drop();
        return;
      }

      gsap
        .timeline({ onComplete: drop })
        .to(
          clone,
          {
            top: target.top,
            left: target.left,
            width: target.width,
            height: target.height,
            borderRadius: 0,
            duration: 0.65,
            ease: 'power3.inOut',
          },
          0
        )
        .to(scrim, { opacity: 0, duration: 0.65, ease: 'power2.inOut' }, 0);
    };

    // Blog sayfasından gelen klon kart konumunda ekranda DURUYOR — bu sayfa
    // yerine oturana kadar boşluğu o kapatıyor. Erken kaldırmak geçiş anında
    // boş bir kare bırakıyordu.
    const dropHandoffClone = () => {
      if (dropped) return;
      dropped = true;
      // Şerit görselleri `loading="lazy"` — remount sonrası henüz inmemiş
      // olabilir; altındaki gerçek görsel hazır olunca kaldırılır.
      const img = trackRef.current?.children[activeIndexRef.current]?.querySelector('img');
      if (img && !img.complete) {
        const fallback = setTimeout(removeNow, 600);
        const finish = () => {
          clearTimeout(fallback);
          requestAnimationFrame(removeNow);
        };
        img.addEventListener('load', finish, { once: true });
        img.addEventListener('error', finish, { once: true });
        return;
      }
      requestAnimationFrame(removeNow);
    };

    // Dikey konum TEK SEFERDE konamaz: sayfa yeniden mount olduğu için ilk
    // karelerde belge henüz kısadır (görseller/bölümler yerleşmemiştir) ve
    // scrollTo hedefi belge sonuna kırpar — sonuç sayfanın BAŞI olur.
    const settle = () => {
      window.scrollTo(0, ret.scrollY);
      if (Math.abs(window.scrollY - ret.scrollY) < 2) {
        dropHandoffClone();
        return;
      }
      if (performance.now() < deadline) raf = requestAnimationFrame(settle);
      // Hedefe hiç ulaşılamazsa bile klon asılı kalmamalı.
      else dropHandoffClone();
    };
    settle();
    return () => cancelAnimationFrame(raf);
  }, [sync]);

  // Bölüm girişi: learned-rules [imza-dalga] — elemanlar sağdan sola akar,
  // değerler markanın hareket dili olduğu için birebir korunur
  // (x:140, y:56, 0.9s power3.out, stagger 0.12).
  useEffect(() => {
    // Blog'dan geri dönüşte giriş dalgası OYNAMAZ: sayfa teknik olarak
    // yeniden mount oluyor ama kullanıcı için bu bir "açılış" değil, terk
    // ettiği yere dönüş — şerit bıraktığı hâlde durmalı (kullanıcı isteği).
    if (isBlogReturnArmed()) return undefined;

    const ctx = gsap.context((self) => {
      const mm = gsap.matchMedia();
      const targets = self.selector('[data-reveal]');

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from(targets, {
          opacity: 0,
          x: 140,
          y: 56,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.12,
          clearProps: 'opacity,transform',
          scrollTrigger: { trigger: rootRef.current, start: 'top 80%', once: true },
          // Dalga kartları geçici olarak sağa taşıdığı için şeridin
          // kaydırılabilir alanı animasyon boyunca genişler; transform
          // temizlendikten sonra uç durumlar (ok disabled) yeniden ölçülür.
          onComplete: sync,
        });
      });

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(targets, { opacity: 1, x: 0, y: 0 });
      });
    }, rootRef);

    return () => ctx.revert();
  }, [sync]);

  const step = (direction) => {
    const el = viewportRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * stride(), behavior: 'smooth' });
  };

  // Sürükle-kaydır — demonun shared/scripts.js'i birebir (kaynağı orada
  // codepen.io/thenutz/pen/VwYeYEE olarak veriliyor): pointerdown'da başlangıç
  // yakalanır, pointermove'da `walk = (x - startX) * 3` kadar ters yöne
  // scrollLeft yazılır. Sürükleme boyunca snap kapatılır (CSS'te
  // [data-dragging]), yoksa snap imleçle kavga edip şeridi kasıyor.
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
    // 6px eşiği aşan hareket "gerçek sürükleme" sayılır — bırakılan yer bir
    // karta denk gelse de tıklama sayılmasın (şeridi kaydırmak isterken
    // yanlışlıkla Blog sayfasına geçilirdi).
    if (Math.abs(e.pageX - drag.current.startX) > 6) drag.current.moved = true;
    el.scrollLeft = drag.current.startLeft - (e.pageX - drag.current.startX) * 3;
  };

  // ---- Büyütme: karta TIKLAMA → görsel bulunduğu yerden ortadaki kutuya ----
  //
  // Büyüyen görsel bir KLONDUR ve document.body'de yaşar (React ağacının
  // dışında): route değişiminde unmount olmaz, BlogPost onu tam aynı
  // geometride devralır. Süre/eğri geri dönüşün birebir aynısı — açılış ile
  // kapanış aynı eğrinin iki yönüdür (learned-rules: power3.inOut simetrik).
  // clone/scrim BU çağrının kendi elemanlarıdır — global seçiciyle
  // silinmezler. Global seçici denendi ve StrictMode'un dev modunda ilk
  // mount'ta yaptığı "mount→cleanup→mount" çiftinde patladı: Blog'dan geri
  // dönüşte RelatedContent yeniden mount olurken bu effect'in İLK cleanup'ı
  // (handedOff henüz false) sayfanın DEVRALDIĞI klon/perdeyi siliyordu —
  // animasyon hiç oynamadan kart kayboluyordu.
  const pendingFlip = useRef(null);
  const openingRef = useRef(false);

  // Devredilmeden sökülürsek (tarayıcı geri tuşu, başka route) BU çağrının
  // klonu ekranda asılı kalmasın. Devredildiyse klon ARTIK BlogPost'a aittir.
  useEffect(
    () => () => {
      if (pendingFlip.current && !pendingFlip.current.handedOff) {
        pendingFlip.current.clone.remove();
        pendingFlip.current.scrim.remove();
      }
    },
    []
  );

  const openBlogPost = (index) => {
    // Şeridi sürüklerken bırakılan yer bir karta denk gelse de tıklama
    // sayılmaz (6px eşiği, bkz. onPointerMove).
    if (drag.current.moved || openingRef.current) return;
    const item = items[index];
    const img = trackRef.current?.children[index]?.querySelector('img');
    if (!item || !img) return;
    openingRef.current = true;

    const rect = img.getBoundingClientRect();
    const originRect = { top: rect.top, left: rect.left, width: rect.width, height: rect.height };

    const handOff = () => {
      if (pendingFlip.current) pendingFlip.current.handedOff = true;
      armBlogFlip({
        imageUrl: item.imageUrl,
        originRect,
        // Dönüşte kartın GERÇEK konumu bununla yeniden ölçülür: belge
        // yüksekliği remount sonrası birkaç piksel farklı oturabiliyor ve
        // donmuş originRect o farkla iniyordu ("konumu biraz şaşıyor").
        originIndex: index,
        // Geri dönüş `navigate(-1)` ile YAPILMAZ: geçmişte geri gitmek
        // tarayıcının scroll geri-yüklemesini tetikleyip kaynak sayfanın
        // kendi konumlandırmasını asenkron olarak eziyordu.
        returnPath: window.location.pathname,
        returnScrollLeft: viewportRef.current?.scrollLeft ?? 0,
        returnScrollY: window.scrollY,
      });
      navigate(`/blog/${item.slug}`);
    };

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      handOff();
      return;
    }

    const box = blogExpandedBox();

    // Kutunun ARKASINDA düz SİYAH perde — arka plan GÖRSELİ değil (kullanıcı
    // kararı). Hedef sayfanın zemini de siyah olduğu için devir anında perde
    // ile sayfa zemini birbirinin aynısıdır.
    const scrim = document.createElement('div');
    scrim.dataset.blogFlip = '';
    scrim.style.cssText =
      'position:fixed;inset:0;z-index:69;background:#000;opacity:0;pointer-events:none;';
    document.body.appendChild(scrim);

    const clone = document.createElement('img');
    clone.dataset.blogFlip = '';
    clone.src = img.currentSrc || img.src;
    clone.alt = '';
    clone.style.cssText =
      `position:fixed;z-index:70;object-fit:cover;pointer-events:none;` +
      `top:${rect.top}px;left:${rect.left}px;width:${rect.width}px;height:${rect.height}px;` +
      `border-radius:0px;box-shadow:0 0 50px rgba(0,0,0,0.35);`;
    document.body.appendChild(clone);
    pendingFlip.current = { clone, scrim, handedOff: false };

    gsap
      .timeline({ onComplete: handOff })
      .to(
        clone,
        {
          top: (window.innerHeight - box.height) / 2,
          left: (window.innerWidth - box.width) / 2,
          width: box.width,
          height: box.height,
          borderRadius: 'var(--radius-lg)',
          duration: 0.65,
          ease: 'power3.inOut',
        },
        0
      )
      .to(scrim, { opacity: 1, duration: 0.65, ease: 'power2.inOut' }, 0);
  };

  // items API'den asenkron gelir (bkz. çağıranların .data.js'i) — yüklenene
  // ya da bağlam için hiç içerik dönmeyene kadar boş bir şerit YOK, section
  // hiç basılmaz.
  if (!items || items.length === 0) return null;

  return (
    <section className={styles.related} aria-labelledby="related-content-heading" ref={rootRef}>
      <div className={styles.related__inner}>
        <h2 className={styles.related__heading} id="related-content-heading" data-reveal>
          {resolvedHeading}
        </h2>

        <div
          className={styles.related__viewport}
          ref={viewportRef}
          data-dragging={dragging || undefined}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
          onPointerCancel={endDrag}
        >
          <ul className={styles.related__track} ref={trackRef}>
            {/* data-reveal KART DEĞİL li üzerinde: giriş dalgası (GSAP
                transform) ile kart içindeki CSS hover geçişi ayrı katmanlarda
                kalsın diye. */}
            {items.map((item, i) => (
              <li className={styles.related__item} key={item.id} data-reveal>
                {/* Kart GERÇEK bir link: hedef URL hover'da görünür, orta tık /
                    ctrl+tık yeni sekmede açar, klavyede Enter çalışır. Normal
                    tıklamada varsayılan gezinme iptal edilir ve yerine büyüme
                    animasyonu oynayıp sonunda devir yapılır. */}
                <Link
                  to={`/blog/${item.slug}`}
                  className={styles.card}
                  data-active={i === activeIndex || undefined}
                  draggable={false}
                  onClick={(e) => {
                    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                    e.preventDefault();
                    openBlogPost(i);
                  }}
                >
                  {/* __media SABİT kutudur (yerleşimi o belirler), __frame
                      hover'da üstten+alttan taşan medya katmanı —
                      FeaturedCarousel'deki uzama deseninin birebir aynısı. */}
                  <div className={styles.card__media}>
                    <div className={styles.card__frame}>
                      <img
                        className={styles.card__image}
                        src={item.imageUrl}
                        alt={item.imageAlt}
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                      />
                    </div>
                  </div>
                  <h3 className={styles.card__title}>{item.title}</h3>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.related__controls}>
          <button
            type="button"
            className={styles.related__arrow}
            onClick={() => step(-1)}
            disabled={atStart}
            aria-label={t('common.previous')}
          >
            &#8249;
          </button>

          {/* Gösterge — gezinme oklar ve native scroll'da olduğu için
              noktalar tıklanabilir değil, salt konum bildirir. */}
          <div className={styles.related__dots} aria-hidden="true">
            {items.map((item, i) => (
              <span
                className={styles.related__dot}
                key={item.id}
                data-active={i === activeIndex || undefined}
              />
            ))}
          </div>

          <button
            type="button"
            className={styles.related__arrow}
            onClick={() => step(1)}
            disabled={atEnd}
            aria-label={t('common.next')}
          >
            &#8250;
          </button>
        </div>
      </div>
    </section>
  );
}
