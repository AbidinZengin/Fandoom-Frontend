import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { fetchExhibitContent } from './Highlights.data';
import styles from './Highlights.module.css';

gsap.registerPlugin(ScrollTrigger);

// Metin overlay'inin sola/sağa mikro-kayması — referans: kullanıcının kendi
// ipad-pro-highlights component'indeki CAPTION_ENTER deseni (framer-motion),
// burada GSAP'e uyarlandı. Değer (56px) o dosyadan birebir alındı — imza-dalga
// gibi JS-only bir hareket sabiti, CSS token'ı değil. Kart index'ine göre
// dönüşümlü atanır (çift: soldan, tek: sağdan) — kullanıcı isteği ("yazıların
// çıkış animasyonları da sağdan ve soldan olacak").
const CAPTION_OFFSET = 56;
const CAPTION_DURATION = 0.32;

// Apple "get the highlights" esintili yatay carousel (eski adıyla
// TabExhibit'in yerine geçti — bkz. docs/plans/2026-08-08). Kart kompozisyonu
// VE kaydırma mekaniği kullanıcının kendi ipad-pro-highlights referans
// component'inin (D:\...\React\Claude Project\src\components\common\
// Highlight) birebir kopyası: NATIVE scroll-snap (wheel/trackpad/touch/
// scrollbar bedavaya gelir, OS'in kendi momentum'u kullanılır) + üstüne
// RelatedContent'teki kanıtlanmış pointer-drag deseni (mouse click-drag
// için). GSAP Draggable/InertiaPlugin BİLEREK KULLANILMADI — denendi,
// hem "farklı/katı" hissetti hem de type:'scrollLeft' modu (ScrollProxy)
// flex/gap düzenini bozdu; native scroll referansın gerçek davranışı.
// TÜM kartlar normal/parlak görünür (aktif/peek arasında opaklık farkı
// YOK) — sadece metin overlay'i aktif kartta görünür. OTOMATİK GEÇİŞ YOK.
export function Highlights({ entityId }) {
  const [active, setActive] = useState(0);
  const [exhibitTitle, setExhibitTitle] = useState('');
  const [tabItems, setTabItems] = useState([]);
  const [dragging, setDragging] = useState(false);
  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const cardRefs = useRef([]);
  const activeRef = useRef(0);
  const overlaysReady = useRef(false);
  const scrollRafRef = useRef(null);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    let cancelled = false;
    fetchExhibitContent(entityId).then(({ title, items }) => {
      if (cancelled) return;
      setExhibitTitle(title ?? '');
      setTabItems(items);
    });
    return () => {
      cancelled = true;
    };
  }, [entityId]);

  // Canlı takip: aktif kart scroll SÜRERKEN her frame'de güncellenir (wheel/
  // trackpad/touch/scrollbar/pointer-drag hepsi native scroll ürettiği için
  // TEK bir kaynaktan okunur). Referans: kullanıcının ipad-pro-highlights
  // component'indeki `handleScroll` — merkez-snap mantığı birebir.
  const syncActiveFromScroll = useCallback(() => {
    if (scrollRafRef.current) return;
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null;
      const stage = stageRef.current;
      if (!stage) return;
      const center = stage.scrollLeft + stage.clientWidth / 2;
      let closest = 0;
      let minDistance = Infinity;
      cardRefs.current.forEach((card, i) => {
        if (!card) return;
        const d = Math.abs(card.offsetLeft + card.offsetWidth / 2 - center);
        if (d < minDistance) {
          minDistance = d;
          closest = i;
        }
      });
      setActive(closest);
    });
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || tabItems.length === 0) return undefined;
    stage.addEventListener('scroll', syncActiveFromScroll, { passive: true });
    return () => {
      stage.removeEventListener('scroll', syncActiveFromScroll);
      if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current);
    };
  }, [tabItems, syncActiveFromScroll]);

  function goTo(index) {
    const clamped = Math.max(0, Math.min(index, tabItems.length - 1));
    const card = cardRefs.current[clamped];
    if (!card) return;
    setActive(clamped);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    card.scrollIntoView({ inline: 'center', block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
  }

  function handleStageKeyDown(e) {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      goTo(activeRef.current + 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goTo(activeRef.current - 1);
    }
  }

  // Mouse click-drag — RelatedContent'teki kanıtlanmış desenin birebir aynısı
  // (kaynağı orada codepen.io/thenutz/pen/VwYeYEE olarak veriliyor):
  // pointerdown'da başlangıç yakalanır, pointermove'da `walk = (x-startX)*3`
  // kadar ters yöne scrollLeft yazılır. Wheel/trackpad/touch zaten NATIVE
  // çalışıyor, bu sadece mouse'la "tut-çek" imkanı ekliyor.
  const drag = useRef({ active: false, startX: 0, startLeft: 0, moved: false });

  function onPointerDown(e) {
    const stage = stageRef.current;
    if (!stage) return;
    drag.current = { active: true, startX: e.pageX, startLeft: stage.scrollLeft, moved: false };
    setDragging(true);
  }

  function endDrag() {
    if (!drag.current.active) return;
    drag.current.active = false;
    setDragging(false);
  }

  function onPointerMove(e) {
    if (!drag.current.active) return;
    const stage = stageRef.current;
    if (!stage) return;
    e.preventDefault();
    if (Math.abs(e.pageX - drag.current.startX) > 6) drag.current.moved = true;
    stage.scrollLeft = drag.current.startLeft - (e.pageX - drag.current.startX) * 3;
  }

  function onCardClick(e, index) {
    // Sürükleyip bırakılan yer bir karta denk gelse de tıklama sayılmaz.
    if (drag.current.moved) {
      e.preventDefault();
      return;
    }
    if (index !== activeRef.current) {
      e.preventDefault();
      goTo(index);
    }
  }

  // Bölüm girişi — mevcut imza-dalga deseni (eski TabExhibit'ten korunan
  // davranış): başlık tek blok önden girer, stage + dot-nav ~0.15s
  // arkasından kademeli reveal ile takip eder.
  useLayoutEffect(() => {
    if (tabItems.length === 0) return undefined;
    const section = sectionRef.current;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from(section.querySelector('[data-title]'), {
          autoAlpha: 0,
          x: 140,
          y: 56,
          duration: 0.9,
          ease: 'power3.out',
          clearProps: 'opacity,visibility,transform',
          scrollTrigger: { trigger: section, start: 'top 72%', once: true },
        });
        gsap.from(section.querySelectorAll('[data-reveal]'), {
          autoAlpha: 0,
          y: 48,
          duration: 1.1,
          ease: 'power3.out',
          stagger: 0.16,
          delay: 0.15,
          clearProps: 'opacity,visibility,transform',
          scrollTrigger: { trigger: section, start: 'top 72%', once: true },
        });
      });

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(section.querySelectorAll('[data-title], [data-reveal]'), { opacity: 1 });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [tabItems]);

  // Metin overlay'inin sağdan/soldan giriş-çıkışı — sadece aktif kartın
  // overlay'i görünür (opacity 1, x 0); diğerleri kendi yönlerine göre
  // sönük parkta durur. İlk kurulumda animasyonsuz (`gsap.set`) yerleşir,
  // sonraki her `active` değişiminde geçişli (`gsap.to`) akar.
  useEffect(() => {
    if (tabItems.length === 0) return undefined;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    cardRefs.current.forEach((card, i) => {
      const overlay = card?.querySelector('[data-overlay]');
      if (!overlay) return;
      const dir = i % 2 === 0 ? -1 : 1;
      const isActive = i === active;
      const target = { opacity: isActive ? 1 : 0, x: isActive ? 0 : dir * CAPTION_OFFSET };

      if (reduce || !overlaysReady.current) {
        gsap.set(overlay, target);
      } else {
        gsap.to(overlay, {
          ...target,
          duration: CAPTION_DURATION,
          ease: isActive ? 'power2.out' : 'power2.in',
          overwrite: true,
        });
      }
    });

    overlaysReady.current = true;
  }, [active, tabItems]);

  return (
    <section id="got-highlights" className={styles.highlights} aria-label={exhibitTitle} ref={sectionRef}>
      <header className={styles.highlights__head} data-title>
        <h2 className={styles.highlights__title}>{exhibitTitle}</h2>
      </header>

      <div
        className={styles.highlights__stage}
        ref={stageRef}
        data-reveal
        data-dragging={dragging || undefined}
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        onKeyDown={handleStageKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onPointerCancel={endDrag}
      >
        {tabItems.map((item, i) => (
          <article
            key={i}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            className={styles.highlights__card}
            data-index={i}
            onClickCapture={(e) => onCardClick(e, i)}
          >
            {item.image ? (
              <img
                className={styles['highlights__card-image']}
                src={item.image}
                alt=""
                loading="lazy"
                decoding="async"
                draggable={false}
              />
            ) : (
              <span className={styles.highlights__placeholder}>IMAGE</span>
            )}

            {/* Okunabilirlik scrim'i — HER kartta sabit (referans dili),
                metnin kendisi değil bu her zaman görünür. */}
            <div className={styles['highlights__card-scrim']} aria-hidden="true" />

            {/* Metin overlay'i SADECE aktif kartta görünür — görünürlük ve
                sağdan/soldan geçiş GSAP'ten gelir (yukarıdaki effect).
                Sıra: sol blok (etiket/başlık/açıklama) — sağda "Explore ›"
                (kullanıcı isteği: CTA görselin sağında). */}
            <div className={styles['highlights__card-overlay']} data-overlay>
              <div className={styles['highlights__card-copy']}>
                <span className={styles['highlights__card-tag']}>{item.label}</span>
                <h3 className={styles['highlights__card-title']}>{item.title}</h3>
                {item.description && (
                  <p className={styles['highlights__card-description']}>{item.description}</p>
                )}
              </div>
              <Link
                to={item.labelLinkUrl}
                className={styles['highlights__card-cta']}
                aria-label={`${item.label} sayfasını keşfet`}
                tabIndex={i === active ? 0 : -1}
                draggable={false}
              >
                Explore <span aria-hidden="true">›</span>
              </Link>
            </div>
          </article>
        ))}
      </div>

      {/* Dot-nav (referans: ipad-pro-highlights kontrolleri) — eski metin
          pill listesinin YERİNE geçti, etiket artık kartın kendi içinde.
          Otomatik geçiş/ilerleme-dolumu YOK (kullanıcı kararı). */}
      <div className={styles.highlights__dots} role="tablist" aria-label={exhibitTitle} data-reveal>
        {tabItems.map((item, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-label={item.label}
            className={styles.highlights__dot}
            data-active={i === active ? '' : undefined}
            onClick={() => goTo(i)}
          />
        ))}
      </div>
    </section>
  );
}
