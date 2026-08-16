import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { clamp, withGlobalCursor, isTypingTarget, trackPointerGesture } from './Canvas.geometry';
import { MIN_ZOOM, MAX_ZOOM, FIT_PADDING } from './Canvas.constants';
import { resolveEffectiveLayout, patchLayoutMatrix } from '../PageBuilder.data';

// Tuvalin KENDİ çerçevesiyle ilgili her şey: sonsuz-tuval pan/zoom
// (view = {zoom, pan}), Space+sürükle/orta-tık pan, tekerlek pan/zoom,
// breakpoint/genişlik değişince otomatik sığdırma VE tuvalin alt
// kenarından sürükle-uzat (startCanvasHeightResize) — ikisi de "tuvalin
// kendi boyutu/dönüşümü" temasında, view.zoom'u PAYLAŞTIKLARI için AYNI
// hook'ta (ayrı hook'a bölünseydi zoom değerini hook'lar arası taşımak
// gerekirdi).
export function useCanvasViewport({ canvasWidth, canvasHeight, breakpoint, blocks, updateBlock, onCanvasHeightChange, viewportRef }) {
  // view = tuval dünyasının viewport'a göre transformu: ekran = pan + dünya*zoom
  // (translate SONRA scale — bkz. Canvas.module.css .canvasWorld yorumu).
  // pan zaten ekran-px cinsinden olduğu için hem sürükleme hem zoom-merkezleme
  // hesabı zoom seviyesinden bağımsız çalışır.
  const [view, setView] = useState({ zoom: 1, pan: { x: 0, y: 0 } });
  const [isPanning, setIsPanning] = useState(false);
  const spaceHeldRef = useRef(false);
  const hasFittedRef = useRef(false);

  const fitToView = useCallback(() => {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return;
    const zoom = clamp((rect.width - FIT_PADDING * 2) / canvasWidth, MIN_ZOOM, 1);
    setView({ zoom, pan: { x: (rect.width - canvasWidth * zoom) / 2, y: FIT_PADDING } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasWidth]);

  useLayoutEffect(() => {
    if (hasFittedRef.current) return;
    hasFittedRef.current = true;
    fitToView();
  }, [fitToView]);

  // Breakpoint değişince (ya da o breakpoint'in genişliği TopBar'dan
  // düzenlenince) tuval GERÇEKTEN o genişlikte render olur — görünümü de
  // otomatik yeniden sığdırır ki kullanıcı "kör" düzenlemesin.
  useEffect(() => {
    if (!hasFittedRef.current) return;
    fitToView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [breakpoint, canvasWidth]);

  // Space tuşu Figma'daki gibi geçici pan modu açar (metin alanındayken değil).
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.code === 'Space' && !isTypingTarget(document.activeElement)) spaceHeldRef.current = true;
    };
    const onKeyUp = (e) => {
      if (e.code === 'Space') spaceHeldRef.current = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // Wheel: preventDefault gerektirdiği için React'in passive onWheel'i değil,
  // native (passive:false) listener kullanılıyor. Düz tekerlek = pan (Figma
  // trackpad davranışı), Ctrl/Meta+tekerlek = imlecin altını sabit tutan zoom.
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const rect = viewportRef.current.getBoundingClientRect();
    const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
    if (e.ctrlKey || e.metaKey) {
      setView((v) => {
        const nextZoom = clamp(v.zoom * Math.exp(-e.deltaY * 0.01), MIN_ZOOM, MAX_ZOOM);
        const wx = (sx - v.pan.x) / v.zoom, wy = (sy - v.pan.y) / v.zoom;
        return { zoom: nextZoom, pan: { x: sx - wx * nextZoom, y: sy - wy * nextZoom } };
      });
    } else {
      setView((v) => ({ ...v, pan: { x: v.pan.x - e.deltaX, y: v.pan.y - e.deltaY } }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel, viewportRef]);

  const zoomBy = (factor) => {
    const rect = viewportRef.current.getBoundingClientRect();
    const sx = rect.width / 2, sy = rect.height / 2;
    setView((v) => {
      const nextZoom = clamp(v.zoom * factor, MIN_ZOOM, MAX_ZOOM);
      const wx = (sx - v.pan.x) / v.zoom, wy = (sy - v.pan.y) / v.zoom;
      return { zoom: nextZoom, pan: { x: sx - wx * nextZoom, y: sy - wy * nextZoom } };
    });
  };

  // Boşluk+sürükle veya orta-tık ile pan — capture fazında yakalanır ki
  // altındaki bloğun/tuvalin kendi pointerdown'ı (sürükleme, tıkla-ekle) hiç
  // tetiklenmesin.
  const handleViewportPointerDownCapture = (e) => {
    if (!(spaceHeldRef.current || e.button === 1)) return;
    e.preventDefault();
    e.stopPropagation();
    const startClientX = e.clientX, startClientY = e.clientY;
    const startPan = view.pan;
    setIsPanning(true);
    const onMove = (ev) => {
      setView((v) => ({ ...v, pan: { x: startPan.x + (ev.clientX - startClientX), y: startPan.y + (ev.clientY - startClientY) } }));
    };
    trackPointerGesture(onMove, () => setIsPanning(false));
  };

  // Tuvalin ALT kenarından sürükle-uzat — kullanıcı raporu: "componentler
  // bundan etkilenmemesi lazım, oranla değil". layout.y/h yüzde olarak
  // tuval yüksekliğine göredir; sadece canvasHeight'i büyütmek her block'u
  // orantılı büyütür/kaydırır. Bunu engellemek için sürüklemenin BAŞINDA
  // her block'un MUTLAK piksel y/h'ı (o anki canvasHeight'e göre) alınır,
  // her hareket adımında YENİ canvasHeight'e göre aynı mutlak pikseli
  // koruyacak yüzde yeniden hesaplanıp geri yazılır — görsel olarak
  // block'lar sabit kalır, sadece altta boş (siyah/desenli) alan büyür.
  const startCanvasHeightResize = (startEvent) => {
    startEvent.stopPropagation();
    const startClientY = startEvent.clientY;
    const startCanvasHeight = canvasHeight;
    const snapshots = blocks.map((block) => {
      const layout = resolveEffectiveLayout(block, breakpoint);
      return {
        block,
        absY: (layout.y / 100) * startCanvasHeight,
        absH: layout.h != null ? (layout.h / 100) * startCanvasHeight : null,
      };
    });
    const restoreCursor = withGlobalCursor('ns-resize');

    const onMove = (ev) => {
      const dy = (ev.clientY - startClientY) / view.zoom;
      const newHeight = clamp(startCanvasHeight + dy, 200, 20000);
      onCanvasHeightChange(breakpoint, newHeight);
      snapshots.forEach(({ block, absY, absH }) => {
        const patch = { y: (absY / newHeight) * 100 };
        if (absH != null) patch.h = (absH / newHeight) * 100;
        updateBlock(block.id, { layout: patchLayoutMatrix(block.layout, breakpoint, patch) });
      });
    };

    trackPointerGesture(onMove, restoreCursor);
  };

  return { view, isPanning, fitToView, zoomBy, handleViewportPointerDownCapture, startCanvasHeightResize };
}
