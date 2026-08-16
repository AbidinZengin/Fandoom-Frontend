import { useEffect } from 'react';
import { TOOLS } from '../PageBuilder.data';
import { IconPointer, IconRectangle, IconDiamond, IconCircle, IconType, IconImage } from '../icons';
import styles from './FloatingToolbar.module.css';

const TOOL_ICONS = { null: IconPointer, RECTANGLE: IconRectangle, DIAMOND: IconDiamond, CIRCLE: IconCircle, TEXT: IconType, IMAGE: IconImage };

// BlockList.jsx/useClipboard.js'teki isTypingTarget()'ın bilinçli kopyası
// — her tüketici kendi kısayol dinleyicisinin başka bir modüle bağımlı
// olmasını istemiyor (proje deseni).
function isTypingTarget(el) {
  return el instanceof HTMLElement && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT' || el.tagName === 'SELECT');
}

// Alt-orta yüzen araç kapsülü — 1/2/3/4 (Pointer/Rectangle/Diamond/Circle),
// boşluk, 8/9 (Text/Image). Klavye numaraları doküman spesifikasyonuna
// birebir uyar (5/6/7 bilerek boş — henüz atanmamış araçlar için pay).
export function FloatingToolbar({ activeTool, onSelectTool }) {
  useEffect(() => {
    const onKeyDown = (e) => {
      if (isTypingTarget(document.activeElement)) return;
      const tool = TOOLS.find((t) => t.key === e.key);
      if (tool) onSelectTool(tool.componentType);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onSelectTool]);

  return (
    <div className={styles.toolbar}>
      {TOOLS.map((tool, i) => {
        const Icon = TOOL_ICONS[tool.componentType];
        return (
          <div key={tool.key} className={styles.toolbar__slot} data-gap-before={i === 4 || undefined}>
            <button
              type="button"
              className={styles.toolbar__button}
              data-active={activeTool === tool.componentType || undefined}
              title={`${tool.label} (${tool.key})`}
              aria-label={tool.label}
              onClick={() => onSelectTool(tool.componentType)}
            >
              <Icon />
            </button>
          </div>
        );
      })}
    </div>
  );
}
