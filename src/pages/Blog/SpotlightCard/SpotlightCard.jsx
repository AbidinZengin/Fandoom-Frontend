import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { armBlogFlip, isBlogReturnArmed, readBlogReturn, blogExpandedBox } from '../../../motion/cinematic';
import { CarouselArrow } from '../CarouselArrow/CarouselArrow';
import styles from './SpotlightCard.module.css';

// Ana öne çıkan blog kutusu — BlogPost'un hero anatomisini yansıtır (kapak →
// başlık → meta → Learn More). `item` gelene kadar (learned-rules [veri])
// kapak kesik çerçeve + gradient bloom, başlık satır uzunluğunu taklit eden
// nötr BAR'dır. `item` gelince tıklama, RelatedContent.jsx'teki ("Dive
// Deeper") ile AYNI "kesintisiz devir" flip'ini tetikler (kullanıcı isteği:
// "carousel dive deeper gibi olmalı animasyon olarak") — tek öğe olduğu için
// sürükleme/stride yok, sadece açılış/dönüş flip'i.
export function SpotlightCard({ item }) {
  const navigate = useNavigate();
  const coverRef = useRef(null);
  const imgRef = useRef(null);
  const openingRef = useRef(false);
  const pendingFlip = useRef(null);

  // Devredilmeden sökülürsek (route değişmeden unmount) klon asılı kalmasın.
  useEffect(
    () => () => {
      if (pendingFlip.current && !pendingFlip.current.handedOff) {
        pendingFlip.current.clone.remove();
        pendingFlip.current.scrim.remove();
      }
    },
    []
  );

  // GERİ DÖNÜŞ: yalnız BU component flip'in KAYNAĞIYSA (originComponent
  // 'spotlight') klonu kendi kapak dikdörtgenine küçültür — Blog hub'da
  // TopBlogsRow de aynı anda flip kaynağı olabildiği için ayırt edici şart
  // (bkz. motion/cinematic.js).
  useEffect(() => {
    const ret = isBlogReturnArmed() ? readBlogReturn() : null;
    if (!ret || ret.originComponent !== 'spotlight') return undefined;
    if (ret.scrollY == null) return undefined;

    let raf = 0;
    let dropped = false;
    const deadline = performance.now() + 2000;

    const removeNow = () => {
      const clone = document.querySelector('img[data-blog-flip]');
      const scrim = document.querySelector('div[data-blog-flip]');
      const cardEl = coverRef.current;
      const prevTransition = cardEl?.style.transition;
      if (cardEl) {
        cardEl.style.transition = 'none';
        void cardEl.offsetWidth;
      }
      const liveRect = cardEl?.getBoundingClientRect();
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
      const img = imgRef.current;
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
  }, []);

  const openBlogPost = () => {
    if (openingRef.current) return;
    const img = imgRef.current;
    if (!item || !img) return;
    openingRef.current = true;

    const rect = img.getBoundingClientRect();
    const originRect = { top: rect.top, left: rect.left, width: rect.width, height: rect.height };

    const handOff = () => {
      if (pendingFlip.current) pendingFlip.current.handedOff = true;
      armBlogFlip({
        imageUrl: item.imageUrl,
        originRect,
        originComponent: 'spotlight',
        returnPath: window.location.pathname,
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

  if (!item) {
    return (
      <div className={styles.spotlight}>
        <CarouselArrow direction="prev" />

        <div className={styles.spotlight__content}>
          <div className={styles.spotlight__cover} data-pending>
            <div className={styles.spotlight__caption}>
              <span className={`${styles.bar} ${styles['bar--title']}`} />
              <span className={`${styles.bar} ${styles['bar--title']} ${styles['bar--titleShort']}`} />
              <span className={`${styles.bar} ${styles['bar--meta']}`} />
            </div>
          </div>
        </div>

        <CarouselArrow direction="next" />
      </div>
    );
  }

  return (
    <div className={styles.spotlight}>
      <CarouselArrow direction="prev" />

      <Link
        to={`/blog/${item.slug}`}
        className={styles.spotlight__content}
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
          e.preventDefault();
          openBlogPost();
        }}
      >
        <div className={styles.spotlight__cover} ref={coverRef}>
          <img
            ref={imgRef}
            className={styles.spotlight__image}
            src={item.imageUrl}
            alt={item.imageAlt ?? ''}
            loading="lazy"
            decoding="async"
          />

          {/* Kullanıcı isteği: metin görselin ÜSTÜNDE, büyük — TopBlogsRow'un
              overlay-caption deseniyle aynı aile (alt kenara gömülü blok). */}
          <div className={styles.spotlight__caption}>
            <h3 className={styles.spotlight__title}>{item.title}</h3>
            <div className={styles.spotlight__footer}>
              {item.readingTimeMinutes != null && (
                <span className={styles.spotlight__meta}>{item.readingTimeMinutes} min read</span>
              )}
              <span className={styles.spotlight__link}>
                Learn More <span aria-hidden="true">›</span>
              </span>
            </div>
          </div>
        </div>
      </Link>

      <CarouselArrow direction="next" />
    </div>
  );
}
