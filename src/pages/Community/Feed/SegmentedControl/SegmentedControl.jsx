import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { LocalizedLink as Link } from '../../../../shared/i18n/LocalizedLink';
import styles from './SegmentedControl.module.css';

// Kayan pill'li segmented kontrol — referans: 21st.dev pricing toggle'ı
// (2026-09-20, ray #323232 + seçili pill #cdcdcd). SurfaceFilter (route
// linkleri) ve SortBar (butonlar) aynı mekanizmayı paylaşır: `to` verilen
// öğeler link, verilmeyenler buton olur. Seçili pill'in konumu/genişliği
// aktif öğeden ÖLÇÜLÜR ve CSS değişkenine yazılır; geçişi CSS transition yapar
// (transform + width) — render/GSAP yok.
export function SegmentedControl({ items, activeKey, onSelect, label, size = 'md' }) {
  const trackRef = useRef(null);
  const readyRef = useRef(false);

  const measure = useCallback(() => {
    const track = trackRef.current;
    const active = track?.querySelector('[data-active="true"]');
    if (!track || !active) return;
    track.style.setProperty('--pill-x', `${active.offsetLeft}px`);
    track.style.setProperty('--pill-w', `${active.offsetWidth}px`);
    if (!readyRef.current) {
      // İlk konum animasyonsuz oturmalı: transition, değerler yazıldıktan ve
      // stil hesaplandıktan SONRA açılır.
      void track.offsetWidth;
      track.dataset.ready = 'true';
      readyRef.current = true;
    }
  }, []);

  useLayoutEffect(() => {
    measure();
  }, [activeKey, measure]);

  // Font geç yüklenince / dil değişince / pencere daralınca öğe genişlikleri
  // değişir — pill yeniden ölçülür.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    document.fonts?.ready.then(measure);
    return () => observer.disconnect();
  }, [measure]);

  const isNav = items.some((item) => item.to);
  const Wrapper = isNav ? 'nav' : 'div';

  return (
    <Wrapper
      ref={trackRef}
      className={styles.segmented}
      data-size={size}
      aria-label={label}
      role={isNav ? undefined : 'group'}
    >
      <span className={styles.segmented__pill} aria-hidden="true" />
      {items.map((item) => {
        const active = item.key === activeKey;
        return item.to ? (
          <Link
            key={item.key}
            to={item.to}
            className={styles.segmented__item}
            data-active={active}
            aria-current={active ? 'page' : undefined}
          >
            {item.label}
          </Link>
        ) : (
          <button
            key={item.key}
            type="button"
            className={styles.segmented__item}
            data-active={active}
            aria-pressed={active}
            onClick={() => onSelect?.(item.key)}
          >
            {item.label}
          </button>
        );
      })}
    </Wrapper>
  );
}
