import { useEffect } from 'react';

// Yüzen sekme/sıralama adası — YÖNE bağlı, kendi başına yumuşak açılıp kapanan
// headroom (kullanıcı, 2026-09-20: "sadece smooth şekilde açığa çıkıp
// kaybolmasını istemiştim" — navbar gibi; 1:1 scroll takibi reddedildi).
// Aşağı scroll'da ada kayarak solar (HIDE_AFTER px'lik küçük titreşimler
// tetiklemez); yukarı scroll'da KESİNTİSİZ ISLAND_REVEAL_AFTER px sonra
// kayarak gelir. Hareketi CSS transition yapar (`data-hidden`), JS yalnız
// durumu belirler. Navbar ondan da DAHA fazla yukarı scroll (NAV_REVEAL_AFTER px)
// sonra döner; eşiği <html data-nav-reveal-after> ile Navbar.jsx'e bildiririz.
// Yukarı/aşağı mesafe yön değişiminde sıfırlanır.
const HIDE_AFTER = 8;
const ISLAND_REVEAL_AFTER = 200;
const NAV_REVEAL_AFTER = 400;
// Tek büyük sıçramadan (tekerlek, End/PageDown) sonra scroll olayı gelmeyebilir:
// hareket durunca durum bir kez daha değerlendirilir.
const SETTLE_MS = 150;

export function useControlsReveal(ref) {
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.navRevealAfter = String(NAV_REVEAL_AFTER);

    let lastY = window.scrollY;
    let upDistance = 0;
    let downDistance = 0;
    let hidden = false;
    let frame = 0;
    let settleTimer = 0;

    const update = () => {
      frame = 0;
      const el = ref.current;
      if (!el) return;

      const y = window.scrollY;
      const delta = y - lastY;
      lastY = y;
      if (delta > 0) {
        upDistance = 0;
        downDistance += delta;
      } else if (delta < 0) {
        downDistance = 0;
        upDistance -= delta;
      }

      // Yapışıklık: çubuk `top` çizgisine ulaştı mı. Gizleme transform'u
      // ekrandaki konumu kaydırdığı için (o an uygulanan translateY) çıkarılır.
      const style = getComputedStyle(el);
      const top = parseFloat(style.top) || 0;
      const shown = new DOMMatrix(style.transform).m42;
      const stuck = el.getBoundingClientRect().top - shown <= top + 0.5;

      let next = hidden;
      if (!stuck) next = false; // doğal akışta (sayfa başına yakın) hep görünür
      else if (upDistance >= ISLAND_REVEAL_AFTER) next = false;
      else if (downDistance >= HIDE_AFTER) next = true;

      if (next !== hidden) {
        hidden = next;
        el.dataset.hidden = String(hidden);
      }
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
      clearTimeout(settleTimer);
      settleTimer = setTimeout(update, SETTLE_MS);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
      clearTimeout(settleTimer);
      delete root.dataset.navRevealAfter;
    };
  }, [ref]);
}
