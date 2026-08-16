import { useEffect, useRef, useState } from 'react';
import { withGlobalCursor, trackPointerGesture } from './Canvas.geometry';
import { RESIZE_CURSOR } from './Canvas.constants';

// Faz 2 "Kodu Üret" referans ekran görüntüsünün tuval-içi davranışı:
// taşıma + boyutlandırma + seçim — kullanıcı raporu: "referans görsele
// de görsel gibi muamele edebilelim", ".block'un aynı dış-sarmalayıcı+
// tutamaç deseni" izlenir. Seçim durumunun KENDİSİ (referenceSelected)
// PageBuilder'da tutulur (Delete tuşu oradaki global keydown'da ele
// alınıyor) — bu hook'a prop olarak GELİR, burada sadece TÜKETİLİR.
export function useReferenceImage({ activeTool, referenceImage, referenceSelected, onSelectReference, onSelectMany, zoom }) {
  // Bilinçli olarak sabit tuval genişliği + serbest offset — kullanıcı
  // raporu: "boyutlandırılamasa da sağa sola hareket ettirilebilir, page
  // dışında da tutulabilir olsun" (SONRADAN boyutlandırma da eklendi,
  // aşağıdaki referenceSize). Tuval `overflow:hidden` UYGULAMADIĞI için
  // (bkz. Canvas.module.css .canvas yorumu) offset tuvalin dışına da
  // taşınabilir, hiçbir sınır yok.
  const [referenceOffset, setReferenceOffset] = useState({ x: 0, y: 0 });
  // w/h null = ilk haldeki "tuval genişliği + doğal en-boy oranı"
  // varsayılanı (kullanıcı hiç resize etmediyse eski davranışla birebir).
  const [referenceSize, setReferenceSize] = useState({ w: null, h: null });
  const referenceWrapRef = useRef(null);

  useEffect(() => {
    setReferenceOffset({ x: 0, y: 0 });
    setReferenceSize({ w: null, h: null });
  }, [referenceImage]);

  // Referans görsel seçimi Escape ile çıkar — diğer Escape-ile-çıkış
  // desenleriyle (panningBlockId, bkz. useBlockGestures) TUTARLI.
  useEffect(() => {
    if (!referenceSelected) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onSelectReference(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referenceSelected]);

  const startReferenceDrag = (startEvent) => {
    // Araç aktifken (yeni block yerleştiriliyorken) referans görsel olayı
    // YUTMAMALI — block'ların kendi handleBlockPointerDown'ındaki AYNI kural
    // (bkz. "Araç aktifken hedef ne olursa olsun yeni blok yerleştirilir"):
    // burada hiçbir şey yapılmadan çıkılır, olay üstteki .canvas'ın
    // handleCanvasPointerDown'ına (yerleştirme mantığı) bubble eder.
    if (activeTool) return;
    startEvent.stopPropagation();
    onSelectReference(true);
    onSelectMany([]);
    // Bkz. useBlockGestures'taki AYNI blur düzeltmesi.
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    const startClientX = startEvent.clientX, startClientY = startEvent.clientY;
    const startOffset = referenceOffset;
    const restoreCursor = withGlobalCursor('grabbing');
    const onMove = (ev) => {
      // Ekran pikseli tuval zoom'una göre ölçeklenir — aksi halde uzaklaştırılmış
      // görünümde sürükleme imleçten çok daha hızlı/yavaş kayardı.
      const dx = (ev.clientX - startClientX) / zoom;
      const dy = (ev.clientY - startClientY) / zoom;
      setReferenceOffset({ x: startOffset.x + dx, y: startOffset.y + dy });
    };
    trackPointerGesture(onMove, restoreCursor);
  };

  const startReferenceResize = (direction, startEvent) => {
    startEvent.stopPropagation();
    const rect = referenceWrapRef.current.getBoundingClientRect();
    const startW = referenceSize.w ?? rect.width / zoom;
    const startH = referenceSize.h ?? rect.height / zoom;
    const startOffset = referenceOffset;
    const startClientX = startEvent.clientX, startClientY = startEvent.clientY;
    const restoreCursor = withGlobalCursor(RESIZE_CURSOR[direction] ?? 'nwse-resize');

    const onMove = (ev) => {
      const dx = (ev.clientX - startClientX) / zoom;
      const dy = (ev.clientY - startClientY) / zoom;
      let w = startW, h = startH, offsetX = startOffset.x, offsetY = startOffset.y;
      if (direction.includes('e')) w = Math.max(startW + dx, 20);
      if (direction.includes('w')) { const nw = Math.max(startW - dx, 20); offsetX = startOffset.x + (startW - nw); w = nw; }
      if (direction.includes('s')) h = Math.max(startH + dy, 20);
      if (direction.includes('n')) { const nh = Math.max(startH - dy, 20); offsetY = startOffset.y + (startH - nh); h = nh; }
      setReferenceSize({ w, h });
      setReferenceOffset({ x: offsetX, y: offsetY });
    };
    trackPointerGesture(onMove, restoreCursor);
  };

  return { referenceOffset, referenceSize, referenceWrapRef, startReferenceDrag, startReferenceResize };
}
