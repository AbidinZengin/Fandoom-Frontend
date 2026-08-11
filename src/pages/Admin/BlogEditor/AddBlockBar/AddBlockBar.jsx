import { useState } from 'react';
import { BLOCK_TYPES, BLOCK_TYPE_LABELS, createEmptyBlock } from '../BlogEditor.data';
import styles from './AddBlockBar.module.css';

const DRAG_THRESHOLD_PX = 4;

// Bloklar önceden hep AYNI varsayılan konumda (x:10,y:10) beliriyordu,
// yazar sonra elle sürüklüyordu (kullanıcı raporu: "başlık alıntı vs
// eklerken hep aynı yerde ortaya çıkıyorlar sürükleyerek bırakıp ortaya
// çıkarayım"). Artık butondan bas-sürükle-bırak ile canvas'ın İSTENEN
// noktasına doğrudan oluşturulabiliyor; düz tıklama (hareket eşiği
// aşılmazsa) eski varsayılan-konum davranışını korur, geriye dönük
// kırılma yok.
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
          onPointerDown={(e) => startDragCreate(type, e)}
        >
          + {BLOCK_TYPE_LABELS[type]}
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
