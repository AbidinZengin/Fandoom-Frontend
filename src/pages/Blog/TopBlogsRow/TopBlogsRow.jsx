import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { armBlogFlip, isBlogReturnArmed, readBlogReturn, blogExpandedBox } from '../../../motion/cinematic';
import { CarouselArrow } from '../CarouselArrow/CarouselArrow';
import styles from './TopBlogsRow.module.css';

// Yükleme öncesi/veri boşsa (learned-rules [veri]) gösterilecek sabit sayıda
// iskelet kart — gerçek `items` gelince yerini alır, fazladan fake kart
// EKLENMEZ (items.length kadar gerçek kart basılır).
const SKELETON_COUNT = 4;

// RelatedContent.jsx'in ("Dive Deeper" carousel'i, EpisodePage/BlogPost)
// carousel fiziğinin BİREBİR portu — kullanıcı isteği: "carousel episode
// page altındaki dive deeper gibi olmalı animasyon olarak". Kendi görsel
// kimliği (rütbe rakamı, 2:3 poster) korunur; RelatedContent'in "Dive
// Deeper" başlığı/nokta göstergesi buraya taşınmadı, istenen hareket/
// etkileşim fiziğiydi.
export function TopBlogsRow({ items = [] }) {
  const pending = items.length === 0;
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

  // Kart adımı DOM'dan okunur — genişlik clamp'li/yüzdelik olduğu için tek
  // doğru kaynak gerçek yerleşim (RelatedContent.jsx ile aynı gerekçe).
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
    setActiveIndex(closest);
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
  }, [sync]);

  // Skeleton → gerçek veri geçişinde track'in çocukları değişir (farklı DOM
  // düğümleri) — uç durumlar (ok disabled) yeniden ölçülmeli.
  useEffect(() => {
    sync();
  }, [items, sync]);

  // GERİ DÖNÜŞ: yalnız BU component flip'in KAYNAĞIYSA (originComponent
  // 'top10') restore yapar — Blog hub'da SpotlightCard de aynı anda flip
  // kaynağı olabildiği için ayırt edici şart (bkz. motion/cinematic.js).
  useEffect(() => {
    const ret = isBlogReturnArmed() ? readBlogReturn() : null;
    if (!ret || ret.originComponent !== 'top10') return undefined;

    if (viewportRef.current && ret.scrollLeft != null) {
      viewportRef.current.scrollLeft = ret.scrollLeft;
      sync();
    }
    if (ret.scrollY == null) return undefined;

    let raf = 0;
    let dropped = false;
    const deadline = performance.now() + 2000;

    const removeNow = () => {
      const clone = document.querySelector('img[data-blog-flip]');
      const scrim = document.querySelector('div[data-blog-flip]');
      const li = trackRef.current?.children[ret.originIndex];
      const cardEl = li?.querySelector('[data-row-thumb]');
      const liveEl = li?.querySelector('img');
      const prevTransition = cardEl?.style.transition;
      if (cardEl) {
        cardEl.style.transition = 'none';
        void cardEl.offsetWidth;
      }
      const liveRect = liveEl?.getBoundingClientRect();
      if (cardEl) cardEl.style.transition = prevTransition ?? '';
      const target =
        liveRect && liveRect.width > 0
          ? { top: liveRect.top, left: liveRect.left, width: liveRect.width, height: liveRect.height }
          : ret.originRect;
      const drop = () => [clone, scrim].forEach((el) => el?.remove());

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
            borderRadius: 'var(--radius-lg)',
            duration: 0.65,
            ease: 'power3.inOut',
          },
          0
        )
        .to(scrim, { opacity: 0, duration: 0.65, ease: 'power2.inOut' }, 0);
    };

    const dropHandoffClone = () => {
      if (dropped) return;
      dropped = true;
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

    const settle = () => {
      window.scrollTo(0, ret.scrollY);
      if (Math.abs(window.scrollY - ret.scrollY) < 2) {
        dropHandoffClone();
        return;
      }
      if (performance.now() < deadline) raf = requestAnimationFrame(settle);
      else dropHandoffClone();
    };
    settle();
    return () => cancelAnimationFrame(raf);
  }, [sync]);

  // Giriş dalgası — learned-rules [imza-dalga] (RelatedContent ile birebir
  // aynı değerler): sağdan sola akar, x:140/y:56/0.9s power3.out/stagger:.12.
  useEffect(() => {
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
          scrollTrigger: { trigger: rootRef.current, start: 'top 85%', once: true },
          onComplete: sync,
        });
      });

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(targets, { opacity: 1, x: 0, y: 0 });
      });
    }, rootRef);

    return () => ctx.revert();
  }, [sync, pending, items]);

  const step = (direction) => {
    const el = viewportRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * stride(), behavior: 'smooth' });
  };

  // Sürükle-kaydır — RelatedContent.jsx ile aynı fizik (walk=(x-startX)*3).
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

  // ---- Karta tıklama → "kesintisiz devir" flip'i (RelatedContent.jsx'teki
  // openBlogPost ile birebir mantık, bkz. motion/cinematic.js) ----
  const pendingFlip = useRef(null);
  const openingRef = useRef(false);

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
    if (drag.current.moved || openingRef.current) return;
    const item = items[index];
    const li = trackRef.current?.children[index];
    const img = li?.querySelector('img');
    if (!item || !img) return;
    openingRef.current = true;

    const rect = img.getBoundingClientRect();
    const originRect = { top: rect.top, left: rect.left, width: rect.width, height: rect.height };

    const handOff = () => {
      if (pendingFlip.current) pendingFlip.current.handedOff = true;
      armBlogFlip({
        imageUrl: item.imageUrl,
        originRect,
        originIndex: index,
        // Blog hub'da SpotlightCard de flip kaynağı olabiliyor — dönüşte
        // hangi component'in restore yapacağını bu ayırt eder.
        originComponent: 'top10',
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
      `border-radius:var(--radius-lg);box-shadow:0 0 50px rgba(0,0,0,0.35);`;
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

  return (
    <div className={styles.row} ref={rootRef}>
      <CarouselArrow direction="prev" onClick={() => step(-1)} disabled={pending || atStart} />

      <div
        className={styles.row__viewport}
        ref={viewportRef}
        data-dragging={dragging || undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onPointerCancel={endDrag}
      >
        <ul className={styles.row__track} ref={trackRef}>
          {pending
            ? Array.from({ length: SKELETON_COUNT }, (_, i) => (
                <li className={styles.row__card} key={i} data-reveal>
                  <span className={styles.row__rank}>{String(i + 1).padStart(2, '0')}</span>
                  <div className={styles.row__thumb} data-pending>
                    <span className={styles.row__caption}>
                      <span className={`${styles.bar} ${styles['bar--title']}`} />
                    </span>
                  </div>
                </li>
              ))
            : items.map((item, i) => (
                <li
                  className={styles.row__card}
                  key={item.id}
                  data-reveal
                  data-active={i === activeIndex || undefined}
                >
                  <span className={styles.row__rank}>{String(i + 1).padStart(2, '0')}</span>
                  <Link
                    to={`/blog/${item.slug}`}
                    className={styles.row__thumb}
                    data-row-thumb
                    draggable={false}
                    onClick={(e) => {
                      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                      e.preventDefault();
                      openBlogPost(i);
                    }}
                  >
                    <img
                      className={styles.row__image}
                      src={item.imageUrl}
                      alt={item.imageAlt ?? ''}
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                    />
                    {/* Kullanıcı isteği: başlık görselin ÜSTÜNDE, alt kenara
                        gömülü (BlogPost story__figcaption'ın birebir aynı
                        deseni) — ayrı zeminli bant DEĞİL. */}
                    <span className={styles.row__caption}>
                      <span className={styles.row__title}>{item.title}</span>
                    </span>
                  </Link>
                </li>
              ))}
        </ul>
      </div>

      <CarouselArrow direction="next" onClick={() => step(1)} disabled={pending || atEnd} />
    </div>
  );
}
