import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { LAYOUT_LIMITS, RAIL_SNAP_WIDTH, RAIL_WIDTH, useCommunityLayoutStore } from '../useCommunityLayoutStore';
import styles from './Splitter.module.css';

// Orta akışın bırakılamayacağı en dar genişlik — yan çubuklar bunun üstüne
// taşamaz (sürükleme sınırı).
const MAIN_MIN_WIDTH = 480;
const KEY_STEP = 16;
const KEY_STEP_LARGE = 48;

const COLUMNS = {
  left: { widthKey: 'leftWidth', modeKey: 'leftMode', cssVar: '--col-left', otherWidthKey: 'rightWidth', otherModeKey: 'rightMode' },
  right: { widthKey: 'rightWidth', modeKey: 'rightMode', cssVar: '--col-right', otherWidthKey: 'leftWidth', otherModeKey: 'leftMode' },
};

// Karşı kolonun şu an kapladığı iz (kapalı 0, ray sabit genişlik).
function trackOf(state, widthKey, modeKey) {
  if (state[modeKey] === 'hidden') return 0;
  return state[modeKey] === 'rail' ? RAIL_WIDTH : state[widthKey];
}

function ChevronIcon({ pointsLeft }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points={pointsLeft ? '15 6 9 12 15 18' : '9 6 15 12 9 18'} />
    </svg>
  );
}

// Kolon ayırıcı: sürükle = boyutlandır, çift tık / Home = varsayılan, ok
// tuşları = ±16px (Shift ±48px), düğme = kolonu kapat/aç. Sol kolon dar
// sürüklenince (<150px) ray moduna oturur (yalnız logolar), geri genişletince
// kayıtlı genişliğine döner. Sürükleme sırasında React state'i DEĞİL, grid'in
// CSS değişkeni doğrudan yazılır (render yok, rAF ile kısılır); yalnız ray
// eşiği geçilince mod değişir, bırakınca store'a tek seferde işlenir.
export function Splitter({ side, gridRef }) {
  const { t } = useTranslation();
  const column = COLUMNS[side];
  const isLeft = side === 'left';
  const width = useCommunityLayoutStore((s) => s[column.widthKey]);
  const mode = useCommunityLayoutStore((s) => s[column.modeKey]);
  const update = useCommunityLayoutStore((s) => s.update);
  const collapsed = mode === 'hidden';
  const railed = mode === 'rail';
  const dragRef = useRef(null);
  const limits = LAYOUT_LIMITS[column.widthKey];

  // Bu kolonun alabileceği en geniş değer: sınır ve orta akış minimumu.
  const maxWidthFor = (splitterWidth) => {
    const state = useCommunityLayoutStore.getState();
    const otherTrack = trackOf(state, column.otherWidthKey, column.otherModeKey);
    const gridWidth = gridRef.current.getBoundingClientRect().width;
    const room = gridWidth - otherTrack - splitterWidth * 2 - MAIN_MIN_WIDTH;
    return Math.max(limits.min, Math.min(limits.max, room));
  };

  const clampToBounds = (value, splitterWidth) =>
    Math.min(maxWidthFor(splitterWidth), Math.max(limits.min, Math.round(value)));

  const resetToDefault = () =>
    update({ [column.widthKey]: limits.fallback, ...(isLeft ? { leftMode: 'full' } : {}) });

  const handlePointerDown = (event) => {
    if (event.button !== 0) return;
    event.preventDefault(); // metin seçimini başlatma
    const grid = gridRef.current;
    const splitterWidth = event.currentTarget.parentElement.parentElement.offsetWidth;
    event.currentTarget.setPointerCapture(event.pointerId);
    grid.dataset.dragging = 'true';
    dragRef.current = { rect: grid.getBoundingClientRect(), splitterWidth, next: width, rail: railed, frame: 0 };
  };

  const handlePointerMove = (event) => {
    const drag = dragRef.current;
    if (!drag) return;
    // İmleç ayırıcının ortasında kalsın diye yarım ayırıcı genişliği düşülür.
    const distance = side === 'left' ? event.clientX - drag.rect.left : drag.rect.right - event.clientX;

    // Ray eşiği: karar yalnız imlecin konumuna bağlı (iz genişliğine değil),
    // bu yüzden eşikte gidip gelme (titreme) olmaz.
    if (isLeft) {
      const wantRail = distance < RAIL_SNAP_WIDTH;
      if (wantRail !== drag.rail) {
        drag.rail = wantRail;
        update({ leftMode: wantRail ? 'rail' : 'full' });
      }
      if (wantRail) return;
    }

    drag.next = clampToBounds(distance - drag.splitterWidth / 2, drag.splitterWidth);
    if (drag.frame) return;
    drag.frame = requestAnimationFrame(() => {
      drag.frame = 0;
      gridRef.current?.style.setProperty(column.cssVar, `${drag.next}px`);
    });
  };

  const finishDrag = () => {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    cancelAnimationFrame(drag.frame);
    delete gridRef.current?.dataset.dragging;
    // Rayda kayıtlı genişlik ezilmez: kolon tekrar açılınca eski genişliğe döner.
    if (drag.rail) update({ leftMode: 'rail' });
    else update({ [column.widthKey]: drag.next, ...(isLeft ? { leftMode: 'full' } : {}) });
  };

  const handleKeyDown = (event) => {
    const step = event.shiftKey ? KEY_STEP_LARGE : KEY_STEP;
    // Sol kolonda → büyütür, sağ kolonda ← büyütür.
    const grow = isLeft ? 'ArrowRight' : 'ArrowLeft';
    const shrink = isLeft ? 'ArrowLeft' : 'ArrowRight';
    if (event.key === grow || event.key === shrink) {
      event.preventDefault();
      if (isLeft && railed) {
        if (event.key === grow) update({ leftMode: 'full' });
        return;
      }
      const splitterWidth = event.currentTarget.parentElement.parentElement.offsetWidth;
      const target = width + (event.key === grow ? step : -step);
      if (isLeft && target < limits.min) update({ leftMode: 'rail' });
      else update({ [column.widthKey]: clampToBounds(target, splitterWidth) });
    } else if (event.key === 'Home') {
      event.preventDefault();
      resetToDefault();
    }
  };

  const handleToggle = () => update({ [column.modeKey]: collapsed ? 'full' : 'hidden' });

  // Ok yönü: kolon açıkken kenarına doğru (kapat), kapalıyken içeri doğru (aç).
  const pointsLeft = isLeft ? !collapsed : collapsed;

  return (
    <div className={styles.splitter} data-collapsed={collapsed || undefined}>
      <div className={styles.splitter__rail}>
        {!collapsed && (
          <div
            className={styles.splitter__handle}
            role="separator"
            aria-orientation="vertical"
            aria-label={t(`community.layout.resize.${side}`)}
            aria-valuenow={railed ? RAIL_WIDTH : width}
            aria-valuemin={isLeft ? RAIL_WIDTH : limits.min}
            aria-valuemax={limits.max}
            tabIndex={0}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={finishDrag}
            onPointerCancel={finishDrag}
            onDoubleClick={resetToDefault}
            onKeyDown={handleKeyDown}
          />
        )}
        <button
          type="button"
          className={styles.splitter__toggle}
          aria-label={t(`community.layout.${collapsed ? 'expand' : 'collapse'}.${side}`)}
          aria-expanded={!collapsed}
          onClick={handleToggle}
        >
          <ChevronIcon pointsLeft={pointsLeft} />
        </button>
      </div>
    </div>
  );
}
