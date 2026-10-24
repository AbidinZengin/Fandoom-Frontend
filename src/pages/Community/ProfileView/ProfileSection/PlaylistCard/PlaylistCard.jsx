import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LocalizedLink } from '../../../../../shared/i18n/LocalizedLink';
import { useListAccent } from '../../../../Account/ListDetail/useListAccent';
import { getListPreviewImages } from '../../../../Account/Account.data';
import styles from './PlaylistCard.module.css';

// Profildeki herkese açık liste kartı. Arka plan portal atmosferi gibidir: kapak
// görselinin canlı baskın renginden (useListAccent — liste detayıyla AYNI kaynak:
// kayıtlı accentColor ya da bir kez hesaplanıp kaydedilen) siyah zemine eriyen gradyan.
// Kapak yoksa / canvas CORS'ta tainted olursa nötr gri tona düşer. Sağda listenin
// ilk öğelerinin poster destesi durur (yüklenene / boşsa hiç çizilmez); kartlar tek
// düz sırada üst üste basamaklanır, tekerlek / dokunmayla öndeki sola kayıp
// kaybolur, arkadaki öne çıkar. Salt sergileme: edit/delete CustomListsSection'ın işi.
const PREVIEW_COUNT = 12;
const SCROLL_EASE = 0.12; // kare başına hedefe yaklaşma oranı (düşük = daha yumuşak)
const WHEEL_PER_CARD = 240; // bir kartı geçmek için tekerlek deltası (px)
const TOUCH_PER_CARD = 90; // bir kartı geçmek için parmak kaydırması (px)
const SETTLE_DELAY = 140; // girdi bitince tam karta oturma gecikmesi (ms)
const DECK_DEPTH = 5; // sırada görünen kat sayısı (bundan arkadaki kartlar gizli)
const DECK_DX = 26; // her katın yana basamağı (px, sağa)
const DECK_TURN = 24; // kartların Y ekseni dönüşü (derece)
const DECK_FADE = 0.1; // her katta solma

export function PlaylistCard({ list }) {
  const { t } = useTranslation();
  const accent = useListAccent(list);
  const [posters, setPosters] = useState([]);
  const stackRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    getListPreviewImages(list.id, PREVIEW_COUNT).then((images) => {
      if (!cancelled) setPosters(images);
    });
    return () => {
      cancelled = true;
    };
  }, [list.id]);

  // Deste fiziği: tek bir sürekli konum (pos, 0..n-1) var; kart i sırada k = i - pos
  // yerindedir. pos ilerledikçe öndeki kart sıra boyunca sola geçip solar,
  // arkadaki öne gelir; geri sarınca ters yoldan döner. Tekerlek / dokunma hedefi
  // (target) sürer, rAF pos'u lerp ile süzer ve
  // girdi bitince en yakın tam karta oturur. Stiller doğrudan DOM'a yazılır
  // (kare başına React render'ı yok). Native listener: React'in wheel'i passive,
  // preventDefault ancak böyle çalışır; uçta kalınca olay sayfaya bırakılır.
  useEffect(() => {
    const el = stackRef.current;
    if (!el) return undefined;
    const cards = [...el.children];
    const last = cards.length - 1;
    let pos = 0;
    let target = 0;
    let raf = 0;
    let settleTimer = 0;

    const render = () => {
      cards.forEach((card, i) => {
        const k = i - pos; // çaprazdaki sıra: 0 en önde, büyüdükçe geride
        if (k <= -1 || k >= DECK_DEPTH) {
          card.style.opacity = '0';
          return;
        }
        // Kartlar düz tek sırada yan yana dizilir, hepsi Y ekseninde dönük; derinlik
        // yok → arkadakiler küçülmez, yalnız z-index ile öndekinin altında kalıp
        // kenarı görünür. k < 0 aynı sıranın devamıdır: öndeki kart sola geçip solar;
        // k arkada DECK_DEPTH'e yaklaşırken de solarak gizlenir.
        const fade = k < 0 ? 1 + k : Math.min(DECK_DEPTH - k, 1) * (1 - k * DECK_FADE);
        card.style.opacity = String(fade);
        card.style.zIndex = String(1000 - Math.round(k * 10));
        card.style.transform = `translateX(${k * DECK_DX}px) rotateY(${DECK_TURN}deg)`;
      });
    };
    const tick = () => {
      pos += (target - pos) * SCROLL_EASE;
      if (Math.abs(target - pos) < 0.002) pos = target;
      render();
      raf = pos === target ? 0 : requestAnimationFrame(tick);
    };
    const run = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const settle = () => {
      clearTimeout(settleTimer);
      settleTimer = setTimeout(() => {
        target = Math.round(target);
        run();
      }, SETTLE_DELAY);
    };
    const onWheel = (e) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      const atEdge = (e.deltaY < 0 && target <= 0) || (e.deltaY > 0 && target >= last);
      if (last <= 0 || atEdge) return;
      e.preventDefault();
      target = Math.min(last, Math.max(0, target + e.deltaY / WHEEL_PER_CARD));
      run();
      settle();
    };
    let touchX = null;
    const onTouchStart = (e) => {
      touchX = e.touches[0].clientX;
    };
    const onTouchMove = (e) => {
      if (touchX === null) return;
      const x = e.touches[0].clientX;
      target = Math.min(last, Math.max(0, target + (touchX - x) / TOUCH_PER_CARD));
      touchX = x;
      run();
    };
    const onTouchEnd = () => {
      touchX = null;
      settle();
    };

    render();
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd);
    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      cancelAnimationFrame(raf);
      clearTimeout(settleTimer);
    };
  }, [posters.length]);

  return (
    <LocalizedLink
      to={`/community/lists/${list.id}`}
      className={styles.playlistCard}
      style={accent ? { '--list-accent': accent.join(',') } : undefined}
    >
      {posters.length > 0 && (
        <div ref={stackRef} className={styles.playlistCard__stack} data-lenis-prevent aria-hidden="true">
          {posters.map((src) => (
            <img key={src} src={src} alt="" className={styles.playlistCard__poster} />
          ))}
        </div>
      )}
      <div className={styles.playlistCard__body}>
        <p className={styles.playlistCard__title}>{list.title}</p>
        {list.description && <p className={styles.playlistCard__description}>{list.description}</p>}
        <span className={styles.playlistCard__meta}>{t('account.customLists.itemsCount', { count: list.itemCount })}</span>
      </div>
    </LocalizedLink>
  );
}
