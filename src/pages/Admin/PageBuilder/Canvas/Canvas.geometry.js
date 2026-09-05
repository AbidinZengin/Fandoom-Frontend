// Canvas.jsx'in hook'ları arasında paylaşılan SAF (React state'ine
// kapanmayan) yardımcılar — snap/collision/piksel-geometri hesapları ve
// küçük DOM/string yardımcıları. Hiçbiri React'e bağımlı değil, hepsi
// gerekli değerleri (blocks/breakpoint/canvasRect gibi) parametre olarak
// alır — bu yüzden herhangi bir hook'tan çağrılabilir, test edilebilir.
import { SNAP_THRESHOLD_PX } from './Canvas.constants';
import { resolveEffectiveLayout } from '../PageBuilder.data';

export const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

// "34% 62%" → [34, 62] — sürükleme jestinin başlangıç noktasını okur.
// Tanımsız/beklenmeyen bir değerde CSS'in kendi varsayılanı olan merkeze
// (50%/50%) düşer.
export function parseObjectPosition(value) {
  const match = typeof value === 'string' && value.match(/^([\d.]+)%\s+([\d.]+)%$/);
  return match ? [parseFloat(match[1]), parseFloat(match[2])] : [50, 50];
}

export function isTypingTarget(el) {
  return el instanceof HTMLElement && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT' || el.tagName === 'SELECT');
}

// TÜM sürükleme jestlerinin (block taşı/boyutlandır, referans taşı/
// boyutlandır, tuval pan/yükseklik-uzat, marquee, yeni-block çiz) ORTAK
// window pointermove/pointerup kayıt deseni — artık BURADA, TEK yerde.
// Kök neden (kullanıcı raporu: "cursor taşıma modunda takılı kalıyor,
// özellikle görsellerden sonra"): jest ortasında native bir dialog açılırsa
// (ör. dosya seçici) veya pencere odağını kaybedersek (alt-tab), tarayıcı
// pointerup'ı HİÇ TESLİM ETMEYEBİLİR — withGlobalCursor'ın restore'u,
// event listener'ların temizliği hiç çalışmaz, cursor SONSUZA KADAR
// "move"/"grab" modunda asılı kalır. `blur` da AYNI bitiş fonksiyonunu
// (onEnd) tetikleyerek jesti güvenle sonlandırır — `done` bayrağı,
// pointerup VE blur'ün ikisi de tetiklenirse onEnd'in İKİ KEZ çalışmasını
// (ör. handleCanvasPointerDown'da blok İKİ KEZ eklenmesi) engeller.
export function trackPointerGesture(onMove, onEnd) {
  let done = false;
  let rafId = null;
  let pendingEvent = null;
  // KÖK NEDEN (kullanıcı raporu: "logo/buton taşırken tıkanıyor, yenilemeden
  // düzelmiyor"): onMove ESKİDEN her ham pointermove'da senkron çalışıyordu —
  // ağır render maliyetli block'larda (LOGO'nun blur'lu SVG'si + `zoom` CSS'i,
  // BUTTON'ın autosize+ResizeObserver'lı textarea'sı) her event bir tam
  // React render + reflow tetikleyip ana thread'i geride bırakıyor, olay
  // kuyruğu boşalamayınca sekme donuyordu. Artık event'ler bir sonraki
  // animasyon karesine kadar `pendingEvent`'te toplanır (coalesce), karede
  // TEK bir onMove çalışır — konum hâlâ akıcı takip eder, sadece event
  // başına değil kare başına en fazla bir kez işlenir.
  const flush = () => {
    rafId = null;
    if (pendingEvent) onMove(pendingEvent);
  };
  const onPointerMove = (ev) => {
    pendingEvent = ev;
    if (rafId == null) rafId = requestAnimationFrame(flush);
  };
  const finish = () => {
    if (done) return;
    done = true;
    // Bekleyen bir kare varsa bırakmadan ÖNCE işlenir — aksi halde son
    // pixel'lik hareket kaybolur, drop anındaki hedef/konum (dropTargetRef,
    // lastPointerRef) bir kare eskimiş kalırdı.
    if (rafId != null) {
      cancelAnimationFrame(rafId);
      rafId = null;
      if (pendingEvent) onMove(pendingEvent);
    }
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', finish);
    window.removeEventListener('blur', finish);
    onEnd();
  };
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', finish);
  window.addEventListener('blur', finish);
}

export function withGlobalCursor(cursor) {
  const prevCursor = document.body.style.cursor;
  const prevSelect = document.body.style.userSelect;
  document.body.style.cursor = cursor;
  document.body.style.userSelect = 'none';
  return () => {
    document.body.style.cursor = prevCursor;
    document.body.style.userSelect = prevSelect;
  };
}

// canvasCtx = { el: canvasRef.current, rect: canvasRect } — otomatik
// (auto) yükseklikli block'ların GERÇEK render edilmiş boyutunu okumak
// için DOM'a (canvasCtx.el) ihtiyaç var, sadece rect yetmiyor.
export function pixelEdgesOf(block, breakpoint, canvasCtx) {
  const layout = resolveEffectiveLayout(block, breakpoint);
  const { rect } = canvasCtx;
  const left = (layout.x / 100) * rect.width;
  const width = (layout.w / 100) * rect.width;
  let height = layout.h != null ? (layout.h / 100) * rect.height : null;
  if (height == null) {
    const el = canvasCtx.el?.querySelector(`[data-block-id="${block.id}"]`);
    height = el ? el.getBoundingClientRect().height : null;
  }
  const top = (layout.y / 100) * rect.height;
  return { left, right: left + width, centerX: left + width / 2, top, bottom: height != null ? top + height : null, centerY: height != null ? top + height / 2 : null };
}

export function findSnap(blocks, movingId, left, top, width, height, breakpoint, canvasCtx) {
  const { rect } = canvasCtx;
  const targetsX = [0, rect.width / 2, rect.width];
  const targetsY = [0, rect.height / 2, rect.height];
  blocks.forEach((b) => {
    if (b.id === movingId || b.hidden) return;
    const e = pixelEdgesOf(b, breakpoint, canvasCtx);
    targetsX.push(e.left, e.centerX, e.right);
    if (e.bottom != null) targetsY.push(e.top, e.centerY, e.bottom);
  });

  const myLeft = left, myRight = left + width, myCenterX = left + width / 2;
  const myTop = top, myBottom = height != null ? top + height : null, myCenterY = height != null ? top + height / 2 : null;

  let deltaX = 0, guideX = null, bestX = SNAP_THRESHOLD_PX;
  [myLeft, myCenterX, myRight].forEach((val) => {
    targetsX.forEach((t) => {
      const d = Math.abs(val - t);
      if (d < bestX) { bestX = d; deltaX = val - t; guideX = t; }
    });
  });

  let deltaY = 0, guideY = null, bestY = SNAP_THRESHOLD_PX;
  if (myBottom != null) {
    [myTop, myCenterY, myBottom].forEach((val) => {
      targetsY.forEach((t) => {
        const d = Math.abs(val - t);
        if (d < bestY) { bestY = d; deltaY = val - t; guideY = t; }
      });
    });
  }
  return { deltaX, deltaY, guideX, guideY };
}

// Bir bloğun O ANDAKİ render edilmiş piksel boyutunu okur — kullanıcı
// kararı (2026-08-19): VAR OLAN bir blok bir container'a girerken (Grupla,
// sürükle-bırak) görünümü/boyutu HİÇ değişmemeli. `document`-geneli
// (canvasRef'e bağlı DEĞİL) — LeftPanel.jsx (Layers sürükle-bırak) da
// Canvas'ın dışında olduğu için aynı `data-block-id` seçicisiyle bu
// fonksiyonu kullanır (bkz. schema.js applyPreservedPxSize'ın girdisi).
//
// KRİTİK — getBoundingClientRect zoom'DAN ETKİLENİR (Canvas.jsx'in
// `.canvasWorld`'ü sonsuz-tuval pan/zoom için `transform: scale(zoom)`
// taşır) — tuval %85 zoom'daysa ölçülen piksel gerçek tuval-uzayı
// değerinden %15 küçük çıkar, sonra bu (yanlış) değer donmuş
// fixedCross/fixedPrimary olarak KALICI yazılırdı (zoom değişse bile).
// `.canvasWorld`'ün computed transform matrix'inden gerçek scale'i okuyup
// böleriz — `.canvasWorld` her zaman `[data-canvas-root]`'un DOĞRUDAN
// ebeveyni (bkz. Canvas.jsx JSX yapısı), class adına (hash'lenmiş CSS
// modül) bağımlı olmadan güvenilir şekilde bulunur.
export function getBlockPxSize(blockId) {
  const el = document.querySelector(`[data-block-id="${blockId}"]`);
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  const worldEl = el.closest('[data-canvas-root]')?.parentElement;
  let scale = 1;
  if (worldEl) {
    const transform = getComputedStyle(worldEl).transform;
    if (transform && transform !== 'none') scale = new DOMMatrix(transform).a || 1;
  }
  return { w: rect.width / scale, h: rect.height / scale };
}

// Nested/auto-layout bloklar (Faz 3, bkz.
// docs/plans/2026-08-18-pagebuilder-nested-blocks-design.md) — sürüklenen
// bloğun imleç konumunda hangi CONTAINER'ın üstünde durduğunu bulur.
// DOM rect tabanlı (getBoundingClientRect zaten ekran-uzayında, zoom/pan
// transform'larını manuel hesaba katmaya GEREK YOK). İç içe container'lar
// üst üste binebilir — en KÜÇÜK alanlı (en "iç") eşleşme kazanır, Figma'nın
// aynı davranışı. `excludeId`: sürüklenen bloğun kendisi — döngü koruması
// (kendi alt-ağacına bırakma) reparentBlock'ta (schema.js) zaten var,
// burada tekrar edilmiyor.
export function findContainerAtPoint(canvasEl, blocksById, clientX, clientY, excludeId) {
  if (!canvasEl) return null;
  let best = null;
  canvasEl.querySelectorAll('[data-block-id]').forEach((el) => {
    const id = el.getAttribute('data-block-id');
    if (!id || id === excludeId) return;
    const block = blocksById[id];
    if (!block || block.componentType !== 'CONTAINER') return;
    const rect = el.getBoundingClientRect();
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return;
    const area = rect.width * rect.height;
    if (!best || area < best.area) best = { id, area };
  });
  return best?.id ?? null;
}

export function findCollision(blocks, movingId, left, top, width, height, breakpoint, canvasCtx) {
  if (height == null) return null;
  const a = { left, right: left + width, top, bottom: top + height };
  return (
    blocks.find((b) => {
      if (b.id === movingId || b.hidden) return false;
      const e = pixelEdgesOf(b, breakpoint, canvasCtx);
      if (e.bottom == null) return false;
      return a.left < e.right && a.right > e.left && a.top < e.bottom && a.bottom > e.top;
    })?.id ?? null
  );
}
