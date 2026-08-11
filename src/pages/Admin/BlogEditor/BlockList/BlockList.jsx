import { useEffect, useRef, useState } from 'react';
import { makeBlockKey } from '../BlogEditor.data';
import { BlockItem } from './BlockItem/BlockItem';
import styles from './BlockList.module.css';

const NUDGE_STEP = 0.5;
const NUDGE_STEP_LARGE = 2;
const DUPLICATE_OFFSET = 3;

function isTypingTarget(el) {
  return el instanceof HTMLElement && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT' || el.tagName === 'SELECT');
}

const MIN_CANVAS_HEIGHT = 400;
const SNAP_THRESHOLD_PX = 6;
const DRAG_THRESHOLD_PX = 4;

const RESIZE_CURSOR = {
  n: 'ns-resize',
  s: 'ns-resize',
  e: 'ew-resize',
  w: 'ew-resize',
  ne: 'nesw-resize',
  sw: 'nesw-resize',
  nw: 'nwse-resize',
  se: 'nwse-resize',
};

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

// Sürükleme/boyutlandırma sırasında imleç normal kalıyordu (kullanıcı
// raporu: "taşıdığım ya da boyutlandırdığım belli olsun") — fare küçük
// tutamacın üzerinden ayrılsa bile (hızlı hareket) DOCUMENT genelinde
// doğru imleç görünsün diye body'ye uygulanır, gesture bitince geri alınır.
function withGlobalCursor(cursor, onDone) {
  const previousCursor = document.body.style.cursor;
  const previousUserSelect = document.body.style.userSelect;
  document.body.style.cursor = cursor;
  document.body.style.userSelect = 'none';
  return () => {
    document.body.style.cursor = previousCursor;
    document.body.style.userSelect = previousUserSelect;
    onDone?.();
  };
}

// Sürükleme/boyutlandırma mantığı BURADA yaşar (BlockItem'da değil) çünkü
// hizalama kılavuzları DİĞER bloklara göre hesaplanır — tek bir blok kendi
// kardeşlerini göremez, canvas'ın tamamı gerekir. BlockItem sadece pointer
// event'ini yukarı iletir.
export function BlockList({ blocks, canvasHeight, onChange, onCommit, onCanvasHeightChange }) {
  const canvasRef = useRef(null);
  const [guides, setGuides] = useState({ v: null, h: null });
  const [collidingKey, setCollidingKey] = useState(null);
  // "Aktif" blok — son etkileşilen blok, klavye kısayollarının (Delete/
  // Ctrl+D/ok tuşları) hedefini belirler. Metin yazarken (textarea/input
  // odaklıyken) kısayollar devre dışı kalır, native davranış bozulmasın.
  const [activeKey, setActiveKey] = useState(null);

  const patchBlock = (key, next) => {
    onChange(blocks.map((b) => (b._key === key ? next : b)));
  };

  const removeBlock = (key) => {
    onChange(blocks.filter((b) => b._key !== key));
    onCommit();
  };

  // Z-sırası ayrı bir alan değil, dizi sırası (learned-rules
  // [blog-blok-pozisyon]) — öne al = sona taşı, arkaya al = başa taşı.
  const bringToFront = (key) => {
    const block = blocks.find((b) => b._key === key);
    if (!block) return;
    onChange([...blocks.filter((b) => b._key !== key), block]);
    onCommit();
  };

  const sendToBack = (key) => {
    const block = blocks.find((b) => b._key === key);
    if (!block) return;
    onChange([block, ...blocks.filter((b) => b._key !== key)]);
    onCommit();
  };

  const duplicateBlock = (key) => {
    const block = blocks.find((b) => b._key === key);
    if (!block) return;
    const copy = {
      ...block,
      _key: makeBlockKey(),
      x: Math.min(100 - block.width, block.x + DUPLICATE_OFFSET),
      y: block.y + DUPLICATE_OFFSET,
    };
    onChange([...blocks, copy]);
    onCommit();
    setActiveKey(copy._key);
  };

  useEffect(() => {
    const onKeyDown = (e) => {
      if (!activeKey || isTypingTarget(document.activeElement)) return;
      const block = blocks.find((b) => b._key === activeKey);
      if (!block) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        removeBlock(activeKey);
        setActiveKey(null);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        duplicateBlock(activeKey);
        return;
      }
      const step = e.shiftKey ? NUDGE_STEP_LARGE : NUDGE_STEP;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        patchBlock(activeKey, { ...block, x: clamp(block.x - step, 0, 100 - block.width) });
        onCommit();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        patchBlock(activeKey, { ...block, x: clamp(block.x + step, 0, 100 - block.width) });
        onCommit();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        patchBlock(activeKey, { ...block, y: clamp(block.y - step, 0, 100) });
        onCommit();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        patchBlock(activeKey, { ...block, y: clamp(block.y + step, 0, 100) });
        onCommit();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey, blocks]);

  // Bir bloğun kenar/merkez konumlarını PİKSEL cinsinden döner — kılavuzlar
  // bunlarla karşılaştırılır. height null (otomatik) ise gerçek render
  // yüksekliği DOM'dan ölçülür (y ekseni hizalaması o zaman da çalışsın).
  const pixelEdgesOf = (block, canvasRect) => {
    const left = (block.x / 100) * canvasRect.width;
    const width = (block.width / 100) * canvasRect.width;
    let height = block.height != null ? (block.height / 100) * canvasRect.height : null;
    if (height == null) {
      const el = canvasRef.current?.querySelector(`[data-block-key="${block._key}"]`);
      height = el ? el.getBoundingClientRect().height : null;
    }
    const top = (block.y / 100) * canvasRect.height;
    return {
      left,
      right: left + width,
      centerX: left + width / 2,
      top,
      bottom: height != null ? top + height : null,
      centerY: height != null ? top + height / 2 : null,
    };
  };

  // Hareket eden/boyutlanan bloğun aday piksel kutusunu diğer bloklara ve
  // canvas kenarlarına/merkezine karşı test eder; eşik içindeyse hizalar
  // (yumuşak mıknatıslama — ASLA kilitlemez, sürüklemeye devam edince
  // kılavuzun dışına çıkılabilir). Sadece TAŞIMADA kullanılır (boyutlandırma
  // sırasında kılavuz YOK — kapsam dışı bırakıldı, bkz. teslim notu).
  const findSnap = (movingKey, left, top, width, height, canvasRect) => {
    const targetsX = [0, canvasRect.width / 2, canvasRect.width];
    const targetsY = [0, canvasRect.height / 2, canvasRect.height];
    blocks.forEach((b) => {
      if (b._key === movingKey) return;
      const e = pixelEdgesOf(b, canvasRect);
      targetsX.push(e.left, e.centerX, e.right);
      if (e.bottom != null) targetsY.push(e.top, e.centerY, e.bottom);
    });

    const myLeft = left;
    const myRight = left + width;
    const myCenterX = left + width / 2;
    const myTop = top;
    const myBottom = height != null ? top + height : null;
    const myCenterY = height != null ? top + height / 2 : null;

    let deltaX = 0;
    let guideX = null;
    let bestX = SNAP_THRESHOLD_PX;
    [myLeft, myCenterX, myRight].forEach((val) => {
      targetsX.forEach((t) => {
        const d = Math.abs(val - t);
        if (d < bestX) {
          bestX = d;
          deltaX = val - t;
          guideX = t;
        }
      });
    });

    let deltaY = 0;
    let guideY = null;
    let bestY = SNAP_THRESHOLD_PX;
    if (myBottom != null) {
      [myTop, myCenterY, myBottom].forEach((val) => {
        targetsY.forEach((t) => {
          const d = Math.abs(val - t);
          if (d < bestY) {
            bestY = d;
            deltaY = val - t;
            guideY = t;
          }
        });
      });
    }

    return { deltaX, deltaY, guideX, guideY };
  };

  // Bir bloğun kutusu başka bir bloğun kutusuyla kesişiyor mu — sadece
  // GÖRSEL sinyal için (kullanıcı isteği: "onun alanına girince işaret
  // vermesi"), otomatik itme/reflow YAPILMAZ (kısıtlayıcı olmasın diye
  // bilerek).
  const findCollision = (movingKey, left, top, width, height, canvasRect) => {
    if (height == null) return null;
    const a = { left, right: left + width, top, bottom: top + height };
    return (
      blocks.find((b) => {
        if (b._key === movingKey) return false;
        const e = pixelEdgesOf(b, canvasRect);
        if (e.bottom == null) return false;
        return a.left < e.right && a.right > e.left && a.top < e.bottom && a.bottom > e.top;
      })?._key ?? null
    );
  };

  const startDragBlock = (key, startEvent) => {
    const block = blocks.find((b) => b._key === key);
    if (!block) return;
    setActiveKey(key);
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const startClientX = startEvent.clientX;
    const startClientY = startEvent.clientY;
    const startX = block.x;
    const startY = block.y;
    let dragging = false;
    let restoreCursor = null;

    const onMove = (ev) => {
      const dxClient = ev.clientX - startClientX;
      const dyClient = ev.clientY - startClientY;
      if (!dragging) {
        if (Math.hypot(dxClient, dyClient) < DRAG_THRESHOLD_PX) return;
        dragging = true;
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
        restoreCursor = withGlobalCursor('grabbing');
      }

      const widthPx = (block.width / 100) * canvasRect.width;
      const el = canvasRef.current?.querySelector(`[data-block-key="${key}"]`);
      const heightPx = block.height != null ? (block.height / 100) * canvasRect.height : el?.getBoundingClientRect().height ?? null;

      let leftPx = (startX / 100) * canvasRect.width + dxClient;
      let topPx = (startY / 100) * canvasRect.height + dyClient;

      const snap = findSnap(key, leftPx, topPx, widthPx, heightPx, canvasRect);
      leftPx -= snap.deltaX;
      topPx -= snap.deltaY;
      setGuides({ v: snap.guideX, h: snap.guideY });
      setCollidingKey(findCollision(key, leftPx, topPx, widthPx, heightPx, canvasRect));

      const nextX = clamp((leftPx / canvasRect.width) * 100, 0, 100 - block.width);
      const nextY = clamp((topPx / canvasRect.height) * 100, 0, 100);
      patchBlock(key, { ...block, x: nextX, y: nextY });
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      setGuides({ v: null, h: null });
      setCollidingKey(null);
      restoreCursor?.();
      if (dragging) onCommit();
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  // 8 yönlü boyutlandırma: n/s kenarları height'i, e/w kenarları width'i,
  // köşeler ikisini birden değiştirir. w/n kenarları x/y'yi de kaydırır
  // (karşı kenar sabit kalsın diye).
  const startResizeBlock = (key, direction, startEvent) => {
    const block = blocks.find((b) => b._key === key);
    if (!block) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const startClientX = startEvent.clientX;
    const startClientY = startEvent.clientY;
    const startX = block.x;
    const startY = block.y;
    const startWidth = block.width;
    const el = canvasRef.current?.querySelector(`[data-block-key="${key}"]`);
    const startHeight = block.height ?? ((el?.getBoundingClientRect().height ?? 0) / canvasRect.height) * 100;
    const restoreCursor = withGlobalCursor(RESIZE_CURSOR[direction] ?? 'nwse-resize');

    const onMove = (ev) => {
      const dxPct = ((ev.clientX - startClientX) / canvasRect.width) * 100;
      const dyPct = ((ev.clientY - startClientY) / canvasRect.height) * 100;

      let x = startX;
      let y = startY;
      let width = startWidth;
      // height sadece n/s yönü dahilse DOKUNULUR — e/w-only resize'da
      // block.height null (otomatik) ise null KALIR (önceki bug: her
      // resize height'i ölçülen değere "kilitliyordu", artık sadece dikey
      // tutamaçlar height'i sabit bir sayıya çeviriyor).
      let height = block.height;

      if (direction.includes('e')) width = clamp(startWidth + dxPct, 6, 100 - startX);
      if (direction.includes('w')) {
        const newWidth = clamp(startWidth - dxPct, 6, startX + startWidth);
        x = startX + startWidth - newWidth;
        width = newWidth;
      }
      if (direction.includes('s')) height = clamp(startHeight + dyPct, 3, 100 - startY);
      if (direction.includes('n')) {
        const newHeight = clamp(startHeight - dyPct, 3, startY + startHeight);
        y = startY + startHeight - newHeight;
        height = newHeight;
      }

      patchBlock(key, { ...block, x, y, width, height });
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      restoreCursor();
      onCommit();
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  // canvasHeight değişince y/height YÜZDELERİ aynı kalsa da PİKSEL
  // konumları orantılı kayar — kullanıcı raporu: "canvas yüksekliği
  // arttıkça tüm componentler arası mesafe değişiyor, sabit kalsın".
  // Çözüm: gesture boyunca blokların y/height'ini de yeni yüksekliğe göre
  // TERS orantılı ölçekleyip piksel konumlarını sabitlemek — canvas sadece
  // altta boş alan kazanır/kaybeder, mevcut bloklar YERİNDE durur.
  const startCanvasResize = (e) => {
    e.preventDefault();
    const startClientY = e.clientY;
    const startHeight = canvasHeight;
    const startBlocks = blocks.map((b) => ({ key: b._key, y: b.y, height: b.height }));
    const restoreCursor = withGlobalCursor('ns-resize');

    const onMove = (ev) => {
      const newHeight = Math.max(MIN_CANVAS_HEIGHT, startHeight + (ev.clientY - startClientY));
      const scale = startHeight / newHeight;
      onChange(
        blocks.map((b) => {
          const start = startBlocks.find((s) => s.key === b._key);
          if (!start) return b;
          return { ...b, y: start.y * scale, height: start.height != null ? start.height * scale : null };
        })
      );
      onCanvasHeightChange(newHeight);
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      restoreCursor();
      onCommit();
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <div className={styles.canvasWrap}>
      <div ref={canvasRef} data-canvas-root className={styles.canvas} style={{ height: `${canvasHeight}px` }}>
        {blocks.length === 0 && <p className={styles.canvas__empty}>No blocks yet — drag one in from the left panel.</p>}
        {blocks.map((block) => (
          <BlockItem
            key={block._key}
            block={block}
            isColliding={collidingKey === block._key}
            onChange={(next) => patchBlock(block._key, next)}
            onRemove={() => removeBlock(block._key)}
            onCommit={onCommit}
            onStartDrag={(e) => startDragBlock(block._key, e)}
            onStartResize={(direction, e) => startResizeBlock(block._key, direction, e)}
            onBringToFront={() => bringToFront(block._key)}
            onSendToBack={() => sendToBack(block._key)}
            onDuplicate={() => duplicateBlock(block._key)}
          />
        ))}
        {guides.v != null && <div className={styles.guideV} style={{ left: `${guides.v}px` }} />}
        {guides.h != null && <div className={styles.guideH} style={{ top: `${guides.h}px` }} />}
      </div>
      <div
        className={styles.canvasResize}
        onPointerDown={startCanvasResize}
        role="separator"
        aria-orientation="horizontal"
        aria-label="Canvas yüksekliğini ayarla"
      >
        ⋯ canvas yüksekliğini sürükle
      </div>
    </div>
  );
}
