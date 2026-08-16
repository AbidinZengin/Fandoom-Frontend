import { useState } from 'react';
import { BLOCK_TYPES, BLOCK_TYPE_LABELS, createEmptyBlock } from '../SeriesHeroEditor.data';
import styles from './AddBlockBar.module.css';

const DRAG_THRESHOLD_PX = 4;

// Basit, geometrik ikonlar — yeni bir ikon paketi EKLENMEZ (learned-rules:
// yeni npm paketi yasak). Excalidraw'ın ikon-öncelikli araç çubuğu hissi
// (Task 8) — düz metin butonları yerine ikon + kısa etiket.
const ICONS = {
  IMAGE: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" />
      <circle cx="5.5" cy="6" r="1.2" />
      <path d="M2 12l3.5-3.5L8 11l2.5-2.5L14 12" />
    </svg>
  ),
  LOGO: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
      <path d="M8 1.5l1.9 4 4.4.4-3.3 3 1 4.3L8 10.9l-3.9 2.3 1-4.3-3.3-3 4.4-.4z" />
    </svg>
  ),
  TITLE: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M3 3h10M8 3v10" />
    </svg>
  ),
  META: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <path d="M2.5 5h11M2.5 8h7M2.5 11h4" />
    </svg>
  ),
  SYNOPSIS: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <path d="M2.5 4h11M2.5 7h11M2.5 10h8M2.5 13h5" />
    </svg>
  ),
  BUTTON: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="1.5" y="5.5" width="13" height="5" rx="2.5" />
    </svg>
  ),
  BOX: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="1.5" y="4.5" width="8" height="8" rx="1.5" />
      <circle cx="11.5" cy="11.5" r="3" />
    </svg>
  ),
};

// BlogEditor/AddBlockBar ile BİREBİR aynı bas-sürükle-bırak mantığı.
export function AddBlockBar({ onAdd }) {
  const [ghost, setGhost] = useState(null);

  const startDragCreate = (type, startEvent) => {
    const startX = startEvent.clientX;
    const startY = startEvent.clientY;
    let dragging = false;

    const onMove = (ev) => {
      if (!dragging) {
        if (Math.hypot(ev.clientX - startX, ev.clientY - startY) < DRAG_THRESHOLD_PX) return;
        dragging = true;
      }
      setGhost({ x: ev.clientX, y: ev.clientY, label: BLOCK_TYPE_LABELS[type] });
    };

    const onUp = (ev) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      setGhost(null);

      if (!dragging) {
        onAdd(createEmptyBlock(type));
        return;
      }

      const canvas = document.querySelector('[data-canvas-root]');
      const rect = canvas?.getBoundingClientRect();
      const insideCanvas =
        rect && ev.clientX >= rect.left && ev.clientX <= rect.right && ev.clientY >= rect.top && ev.clientY <= rect.bottom;

      if (insideCanvas) {
        const xPct = ((ev.clientX - rect.left) / rect.width) * 100;
        const yPct = ((ev.clientY - rect.top) / rect.height) * 100;
        onAdd(createEmptyBlock(type, { x: xPct, y: yPct }));
      } else {
        onAdd(createEmptyBlock(type));
      }
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <div className={styles.addBlockBar}>
      {BLOCK_TYPES.map((type) => (
        <button
          key={type}
          type="button"
          className={styles.addBlockBar__button}
          title={`Add ${BLOCK_TYPE_LABELS[type]}`}
          onPointerDown={(e) => startDragCreate(type, e)}
        >
          <span className={styles.addBlockBar__icon} aria-hidden="true">
            {ICONS[type]}
          </span>
          <span className={styles.addBlockBar__label}>{BLOCK_TYPE_LABELS[type]}</span>
        </button>
      ))}
      {ghost && (
        <div className={styles.addBlockBar__ghost} style={{ left: ghost.x, top: ghost.y }}>
          + {ghost.label}
        </div>
      )}
    </div>
  );
}
