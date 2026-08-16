import { useEffect, useRef, useState } from 'react';
import { makeBlockId } from '../SeriesHeroEditor.data';
import { BlockItem } from './BlockItem/BlockItem';
import styles from './BlockList.module.css';

const NUDGE_STEP = 0.5;
const NUDGE_STEP_LARGE = 2;
const DUPLICATE_OFFSET = 3;

function isTypingTarget(el) {
  return el instanceof HTMLElement && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT' || el.tagName === 'SELECT');
}

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

// BlogEditor/BlockList/BlockList.jsx'in BİREBİR sürükle/boyutlandır/hizala
// mantığı — tamamen jenerik (blockType'tan bağımsız, sadece x/y/width/height
// yüzde okuyup yazıyor). TEK fark: Blog'un serbest-yükseklikli, elle
// sürüklenerek uzatılan canvas'ı YOK — burada canvas Hero'nun GERÇEK
// kadrajıyla (21:9, Hero.module.css) AYNI sabit oranda; admin blokları
// gerçek sayfada göründüğü ORANLA görür, canvasHeight kavramı anlamsız.
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

// selectedKey/onSelectKey PARENT'tan kontrol edilir (SeriesHeroEditor) —
// Figma/Excalidraw tarzı sağ-dok Properties Panel'in hangi bloğu
// göstereceğini bilmesi için seçim artık BlockList'in İÇİNDE hapsolmuyor.
export function BlockList({ blocks, onChange, onCommit, selectedKey, onSelectKey, onContextMenu }) {
  const canvasRef = useRef(null);
  const [guides, setGuides] = useState({ v: null, h: null });
  const [collidingKey, setCollidingKey] = useState(null);
  const activeKey = selectedKey;
  const setActiveKey = onSelectKey;

  const patchBlock = (key, next) => {
    onChange(blocks.map((b) => (b._key === key ? next : b)));
  };

  const removeBlock = (key) => {
    onChange(blocks.filter((b) => b._key !== key));
    onCommit();
  };

  const duplicateBlock = (key) => {
    const block = blocks.find((b) => b._key === key);
    if (!block) return;
    const newId = makeBlockId();
    const copy = {
      ...block,
      id: newId,
      _key: newId,
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

  return (
    <div className={styles.canvasWrap}>
      <div
        ref={canvasRef}
        data-canvas-root
        className={styles.canvas}
        onPointerDown={(e) => {
          if (e.target === e.currentTarget) setActiveKey(null);
        }}
      >
        {blocks.length === 0 && <p className={styles.canvas__empty}>No blocks yet — drag one in from the left panel.</p>}
        {blocks.map((block) => (
          <BlockItem
            key={block._key}
            block={block}
            isColliding={collidingKey === block._key}
            isSelected={activeKey === block._key}
            onChange={(next) => patchBlock(block._key, next)}
            onCommit={onCommit}
            onStartDrag={(e) => startDragBlock(block._key, e)}
            onStartResize={(direction, e) => startResizeBlock(block._key, direction, e)}
            onContextMenu={(clientX, clientY) => {
              setActiveKey(block._key);
              onContextMenu?.(block._key, clientX, clientY);
            }}
          />
        ))}
        {guides.v != null && <div className={styles.guideV} style={{ left: `${guides.v}px` }} />}
        {guides.h != null && <div className={styles.guideH} style={{ top: `${guides.h}px` }} />}
      </div>
    </div>
  );
}
