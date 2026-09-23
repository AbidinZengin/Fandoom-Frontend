import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { ChevronIcon, CloseIcon } from '../ThreadIcons';
import styles from './Lightbox.module.css';

const FLIP_EASE = 'cubic-bezier(0.65, 0, 0.35, 1)';

// Süre --duration-base token'ından okunur (CSS animasyonlarıyla aynı kalsın).
const flipDuration = () =>
  parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--duration-base')) * 1000 || 600;

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Medyanın son (ekranda duran) kutusunu `origin` karo kutusuna oturtan kare: tek
// tip ÖLÇEK (bozulma yok, fotoğraf net kalır) + karonun object-fit:cover kırpmasını
// taklit eden clip-path. Ölçek karoyu tamamen kaplayacak kadardır (max).
function originFrame(end, origin) {
  const scale = Math.max(origin.width / end.width, origin.height / end.height);
  const dx = origin.left + origin.width / 2 - (end.left + end.width / 2);
  const dy = origin.top + origin.height / 2 - (end.top + end.height / 2);
  const cropX = Math.max(0, (end.width - origin.width / scale) / 2);
  const cropY = Math.max(0, (end.height - origin.height / scale) / 2);
  return {
    transform: `translate(${dx}px, ${dy}px) scale(${scale})`,
    clipPath: `inset(${cropY}px ${cropX}px ${cropY}px ${cropX}px)`,
  };
}

// Medyanın doğal oranını CSS'e (--ratio) yazar: kutu ekrana sığacak kadar büyür
// (bkz. .lightbox__media[data-fit]). Render'dan bağımsız, doğrudan DOM'a yazılır ki
// açılış animasyonu ölçümü yapmadan önce yerleşim hazır olsun.
function fitMedia(el) {
  if (!el) return;
  const width = el.naturalWidth || el.videoWidth;
  const height = el.naturalHeight || el.videoHeight;
  if (!width || !height) return;
  el.style.setProperty('--ratio', String(width / height));
  el.dataset.fit = '';
}

const FULL_FRAME ={ transform: 'translate(0px, 0px) scale(1)', clipPath: 'inset(0px 0px 0px 0px)' };

// Tam ekran medya görüntüleyici (2026-09-23, kullanıcı kararı — önceki "+N aynı
// kutuda galeri" kararının YERİNE geçti). Portal ile body seviyesinde çizilir:
// kartların overflow/transform bağlamı fixed konumu kırpmasın.
// `getOriginRect(index)`: o medyanın kartta durduğu kutu (DOMRect) — açılışta fotoğraf
// oradan büyür, kapanışta oraya döner.
export function Lightbox({ media, initialIndex = 0, getOriginRect, onClose }) {
  const { t } = useTranslation();
  const closeRef = useRef(null);
  const trackRef = useRef(null);
  const [index, setIndex] = useState(initialIndex);
  // Kapanış animasyonu: önce `closing` (ters yönde ease-in-out), animasyon bitince
  // gerçek onClose — üst bileşen unmount'u anında yapmasın.
  const [closing, setClosing] = useState(false);
  const closingRef = useRef(false);
  const count = media.length;
  const item = media[index];

  // Ekranda duran (aktif slayttaki) medya elemanı.
  const activeMedia = useCallback(
    (at) => trackRef.current?.children[at]?.querySelector('img, video') ?? null,
    [],
  );

  // Açılış: aktif medya karosunun konumundan büyüyerek yerine oturur. Boyanmadan
  // önce çalışır (layout effect), yoksa tam boy kare bir an görünürdü. Medya henüz
  // ölçülemiyorsa (0 boyut) yüklenince başlar.
  useLayoutEffect(() => {
    const el = activeMedia(initialIndex);
    const origin = getOriginRect?.(initialIndex);
    if (!el || !origin || prefersReducedMotion()) return undefined;

    let animation;
    let cancelled = false;
    const start = () => {
      if (cancelled) return;
      fitMedia(el);
      const end = el.getBoundingClientRect();
      if (!end.width || !end.height) return;
      animation = el.animate([originFrame(end, origin), FULL_FRAME], {
        duration: flipDuration(),
        easing: FLIP_EASE,
        fill: 'backwards',
      });
      el.style.visibility = '';
    };

    el.style.visibility = 'hidden';
    if (el.getBoundingClientRect().width) start();
    else {
      el.addEventListener('load', start, { once: true });
      el.addEventListener('loadedmetadata', start, { once: true });
    }
    return () => {
      cancelled = true;
      el.style.visibility = '';
      animation?.cancel();
    };
  }, [activeMedia, getOriginRect, initialIndex]);

  // Kapanış: aktif medya (kaydırıldıysa o an görüneni) kendi karosuna geri küçülür;
  // zeminin fade'i CSS'te (data-closing), bitişi kökteki onAnimationEnd bildirir.
  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    // Hareket azaltılmışsa animasyon yok, animationend de gelmez — hemen kapat.
    if (prefersReducedMotion()) {
      onClose();
      return;
    }
    const el = activeMedia(index);
    const origin = getOriginRect?.(index);
    if (el && origin) {
      // Açılış animasyonu bitmiş olsa da ölçüm son (transform'suz) kutuyu almalı.
      el.getAnimations().forEach((animation) => animation.cancel());
      el.animate([FULL_FRAME, originFrame(el.getBoundingClientRect(), origin)], {
        duration: flipDuration(),
        easing: FLIP_EASE,
        fill: 'forwards',
      });
    }
    setClosing(true);
  }, [activeMedia, getOriginRect, index, onClose]);

  // Komşu slayttaki video kayarak görüş dışına çıkarken çalmaya devam etmesin.
  useEffect(() => {
    trackRef.current?.querySelectorAll('video').forEach((video) => {
      if (video.closest('[inert]')) video.pause();
    });
  }, [index]);

  // Açılışta sayfa kaymasını kilitler, odağı kapat butonuna alır; kapanışta
  // önceki overflow değerini ve odağı tetikleyiciye geri verir.
  useEffect(() => {
    const trigger = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      trigger?.focus?.();
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        requestClose();
        return;
      }
      // Video kontrolleri ok tuşlarını kendi seek'i için kullanır.
      if (event.target instanceof HTMLVideoElement) return;
      if (event.key === 'ArrowLeft') setIndex((current) => Math.max(0, current - 1));
      else if (event.key === 'ArrowRight') setIndex((current) => Math.min(count - 1, current + 1));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [count, requestClose]);

  if (!item) return null;

  // Zemine (medya/butonlar dışına) tıklayınca kapanır — stage pointer-events:none olduğu
  // için boş alan tıklaması doğrudan kök elemana düşer.
  return createPortal(
    <div
      className={styles.lightbox}
      role="dialog"
      aria-modal="true"
      aria-label={t('community.thread.mediaViewer', { defaultValue: 'Medya görüntüleyici' })}
      data-closing={closing || undefined}
      onClick={requestClose}
      onAnimationEnd={(event) => {
        // Çocuk (stage) animasyonlarından gelen bubble'ı yok say — yalnız kökün kapanışı.
        if (closing && event.target === event.currentTarget) onClose();
      }}
    >
      {/* Şerit: tüm medyalar yan yana, index değişince translateX ile kayar (çıkan ve
          giren birlikte akar). Yalnız aktif ve komşu slaytların medyası çizilir —
          uzaktakiler boş kalır, gereksiz yükleme/decode olmaz. */}
      <div className={styles.lightbox__stage}>
        <div
          ref={trackRef}
          className={styles.lightbox__track}
          style={{ transform: `translateX(${-index * 100}%)` }}
        >
          {media.map((slide, slideIndex) => (
            <div key={slideIndex} className={styles.lightbox__slide} inert={slideIndex !== index}>
              {Math.abs(slideIndex - index) <= 1 &&
                (slide.type === 'VIDEO' ? (
                  <video
                    ref={fitMedia}
                    src={slide.url}
                    controls
                    playsInline
                    preload="metadata"
                    className={styles.lightbox__media}
                    onLoadedMetadata={(event) => fitMedia(event.currentTarget)}
                  />
                ) : (
                  <img
                    ref={fitMedia}
                    src={slide.url}
                    alt=""
                    className={styles.lightbox__media}
                    onLoad={(event) => fitMedia(event.currentTarget)}
                  />
                ))}
            </div>
          ))}
        </div>
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            className={styles.lightbox__button}
            data-position="prev"
            onClick={(event) => {
              event.stopPropagation();
              setIndex((current) => current - 1);
            }}
            disabled={index === 0}
            aria-label={t('common.previous')}
          >
            <span data-direction="prev">
              <ChevronIcon />
            </span>
          </button>
          <button
            type="button"
            className={styles.lightbox__button}
            data-position="next"
            onClick={(event) => {
              event.stopPropagation();
              setIndex((current) => current + 1);
            }}
            disabled={index === count - 1}
            aria-label={t('common.next')}
          >
            <span data-direction="next">
              <ChevronIcon />
            </span>
          </button>
          <span className={styles.lightbox__counter}>
            {index + 1} / {count}
          </span>
        </>
      )}

      <button
        ref={closeRef}
        type="button"
        className={styles.lightbox__button}
        data-position="close"
        onClick={requestClose}
        aria-label={t('community.thread.closeGallery')}
      >
        <CloseIcon />
      </button>
    </div>,
    document.body,
  );
}
