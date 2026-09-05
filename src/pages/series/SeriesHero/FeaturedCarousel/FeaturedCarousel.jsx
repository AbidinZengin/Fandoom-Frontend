import { useCallback, useEffect, useRef, useState } from 'react';
import { LocalizedLink as Link } from '../../../../shared/i18n/LocalizedLink';
import { CarouselArrow } from './CarouselArrow/CarouselArrow';
import styles from './FeaturedCarousel.module.css';

// Blog/TopBlogsRow.jsx'in carousel FİZİĞİNİN BİREBİR portu (kullanıcı
// isteği): native scroll + scroll-snap, sürükle-kaydır (walk=(x-startX)*3),
// stride ölçümü DOM'dan, ok'lar uçlarda disabled. Blog'a özel olan kısım
// (kart tıklayınca post'a "kesintisiz devir" flip'i, armBlogFlip/
// blogExpandedBox, dönüş restore efekti) TAŞINMADI — burada tıklama yalnız
// kendi görsel seçili durumunu değiştirir (Hero'dan bağımsız, SeriesHero
// düzeltmesiyle aynı ilke).
export function FeaturedCarousel({ items }) {
  const rootRef = useRef(null);
  const viewportRef = useRef(null);
  const trackRef = useRef(null);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [dragging, setDragging] = useState(false);

  // Kart adımı DOM'dan okunur — genişlik yüzdelik olduğu için tek doğru
  // kaynak gerçek yerleşim (TopBlogsRow.jsx ile aynı gerekçe).
  const stride = useCallback(() => {
    const [first, second] = trackRef.current?.children ?? [];
    if (!first) return 0;
    return second ? second.offsetLeft - first.offsetLeft : first.offsetWidth;
  }, []);

  const sync = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
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
  }, [sync, items]);

  const step = (direction) => {
    viewportRef.current?.scrollBy({ left: direction * stride(), behavior: 'smooth' });
  };

  // Sürükle-kaydır — TopBlogsRow.jsx ile aynı fizik.
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

  return (
    <div className={styles.row} ref={rootRef}>
      <CarouselArrow direction="prev" onClick={() => step(-1)} disabled={atStart} />

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
          {items.map((item, i) => (
            <li className={styles.row__card} key={item.id}>
              <span className={styles.row__rank}>{String(i + 1).padStart(2, '0')}</span>
              <Link
                to={`/series/${item.slug}`}
                className={styles.row__thumb}
                data-active={i === selectedIndex || undefined}
                aria-current={i === selectedIndex}
                onClick={(e) => {
                  if (drag.current.moved) e.preventDefault();
                  else setSelectedIndex(i);
                }}
              >
                {item.posterUrl && (
                  <img
                    className={styles.row__image}
                    src={item.posterUrl}
                    alt=""
                    loading="lazy"
                    draggable={false}
                  />
                )}
                <span className={styles.row__caption}>
                  <span className={styles.row__title}>{item.title}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <CarouselArrow direction="next" onClick={() => step(1)} disabled={atEnd} />
    </div>
  );
}
