import {
  ANIMATION_PRESETS,
  BORDER_RADIUS_OPTIONS,
  EDITABLE_TEXT_TYPES,
  FIXED_STYLE_KEYS,
  FONT_OPTIONS,
  FONT_SIZE_OPTIONS,
  RADIUS_TYPES,
} from '../SeriesHeroEditor.data';
import styles from './PropertiesPanel.module.css';

// Figma/Excalidraw tarzı SAĞ-DOK özellik paneli — kullanıcı kararı
// (2026-08): önceki tasarımda her bloğun kendi dişli ikonunun altında
// açılan küçük bir popup vardı (BlogEditor'dan miras); bu, "seç → sağda
// otomatik panel belirir" desenine taşındı (basit/kullanıcı dostu hedefi,
// plan: lively-zooming-river.md Task 8). Hangi blok seçili olduğu
// SeriesHeroEditor'da tutulur (BlockList'e prop olarak geçer).
const round = (n) => Math.round(n * 10) / 10;

function parseBlurPx(filter) {
  const match = /blur\((\d+(?:\.\d+)?)px\)/.exec(filter ?? '');
  return match ? Number(match[1]) : 0;
}

export function PropertiesPanel({ block, onChange, onCommit, onRemove, onBringToFront, onSendToBack, onDuplicate }) {
  if (!block) {
    return (
      <aside className={styles.panel} data-empty>
        <p className={styles.panel__hint}>Select a block on the canvas to edit its properties.</p>
      </aside>
    );
  }

  const patchStyles = (patch) => onChange({ ...block, styles: { ...block.styles, ...patch } });
  const hasRadius = RADIUS_TYPES.has(block.type);
  const isEditableText = EDITABLE_TEXT_TYPES.has(block.type);
  const animationPreset = block.animation?.preset ? ANIMATION_PRESETS[block.animation.preset] : null;
  // Sağ-tık menüsünden (PropertyMenu) eklenen serbest özellikler — sabit
  // kontrolü olmayan her block.styles anahtarı burada otomatik listelenir.
  const extraKeys = Object.keys(block.styles ?? {}).filter((k) => !FIXED_STYLE_KEYS.has(k));

  const patchGeometry = (field, value) => {
    onChange({ ...block, [field]: Number.isFinite(value) ? value : null });
  };

  return (
    <aside className={styles.panel}>
      <header className={styles.panel__head}>
        <span className={styles.panel__type}>{block.type}</span>
        <div className={styles.panel__actions}>
          <button type="button" onClick={onDuplicate} title="Duplicate (Ctrl+D)" aria-label="Duplicate">
            ⧉
          </button>
          <button type="button" onClick={onBringToFront} title="Bring to front" aria-label="Bring to front">
            ⬆
          </button>
          <button type="button" onClick={onSendToBack} title="Send to back" aria-label="Send to back">
            ⬇
          </button>
          <button type="button" onClick={onRemove} title="Delete" aria-label="Delete" className={styles.panel__delete}>
            🗑
          </button>
        </div>
      </header>

      <div className={styles.panel__section}>
        <span className={styles.panel__sectionLabel}>Position &amp; size</span>
        <div className={styles.panel__grid4}>
          <label>
            <span>X%</span>
            <input type="number" step="0.5" value={round(block.x)} onChange={(e) => patchGeometry('x', Number(e.target.value))} onBlur={onCommit} />
          </label>
          <label>
            <span>Y%</span>
            <input type="number" step="0.5" value={round(block.y)} onChange={(e) => patchGeometry('y', Number(e.target.value))} onBlur={onCommit} />
          </label>
          <label>
            <span>W%</span>
            <input type="number" step="0.5" value={round(block.width)} onChange={(e) => patchGeometry('width', Number(e.target.value))} onBlur={onCommit} />
          </label>
          <label>
            <span>H%</span>
            <input
              type="number"
              step="0.5"
              placeholder="auto"
              value={block.height != null ? round(block.height) : ''}
              onChange={(e) => patchGeometry('height', e.target.value === '' ? null : Number(e.target.value))}
              onBlur={onCommit}
            />
          </label>
        </div>
      </div>

      {block.type === 'IMAGE' && (
        <div className={styles.panel__section}>
          <span className={styles.panel__sectionLabel}>Blur</span>
          <input
            type="number"
            min="0"
            step="1"
            value={parseBlurPx(block.styles?.filter)}
            onChange={(e) => patchStyles({ filter: `blur(${Math.max(0, Number(e.target.value))}px)` })}
            onBlur={onCommit}
          />
        </div>
      )}

      {hasRadius && (
        <div className={styles.panel__section}>
          <span className={styles.panel__sectionLabel}>Radius</span>
          <select
            value={block.styles?.borderRadius ?? '12px'}
            onChange={(e) => {
              patchStyles({ borderRadius: e.target.value });
              onCommit();
            }}
          >
            {BORDER_RADIUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {block.type === 'BOX' && (
        <div className={styles.panel__section}>
          <span className={styles.panel__sectionLabel}>Background color</span>
          <input
            type="color"
            value={block.styles?.background ?? '#000000'}
            onChange={(e) => {
              patchStyles({ background: e.target.value });
              onCommit();
            }}
          />
        </div>
      )}

      {isEditableText && (
        <div className={styles.panel__section}>
          <span className={styles.panel__sectionLabel}>Typography</span>
          <label>
            <span>Font</span>
            <select
              value={block.styles?.fontFamily ?? ''}
              onChange={(e) => {
                patchStyles({ fontFamily: e.target.value || undefined });
                onCommit();
              }}
            >
              {FONT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Size</span>
            <select
              value={block.styles?.fontSize ?? ''}
              onChange={(e) => {
                patchStyles({ fontSize: e.target.value || undefined });
                onCommit();
              }}
            >
              {FONT_SIZE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      <div className={styles.panel__section}>
        <span className={styles.panel__sectionLabel}>Animation</span>
        <select
          value={block.animation?.preset ?? 'none'}
          onChange={(e) => {
            const key = e.target.value;
            const preset = ANIMATION_PRESETS[key];
            const defaults = Object.fromEntries((preset?.params ?? []).map((p) => [p.key, p.default]));
            onChange({ ...block, animation: key === 'none' ? null : { preset: key, params: defaults } });
            onCommit();
          }}
        >
          {Object.entries(ANIMATION_PRESETS).map(([key, preset]) => (
            <option key={key} value={key}>
              {preset.label}
            </option>
          ))}
        </select>
        {animationPreset?.params.map((param) => (
          <label key={param.key}>
            <span>
              {param.label} ({block.animation.params?.[param.key] ?? param.default})
            </span>
            <input
              type="range"
              min={param.min}
              max={param.max}
              step={param.step}
              value={block.animation.params?.[param.key] ?? param.default}
              onChange={(e) =>
                onChange({
                  ...block,
                  animation: { ...block.animation, params: { ...block.animation.params, [param.key]: Number(e.target.value) } },
                })
              }
              onPointerUp={onCommit}
            />
          </label>
        ))}
      </div>

      {extraKeys.length > 0 && (
        <div className={styles.panel__section}>
          <span className={styles.panel__sectionLabel}>Extra properties</span>
          {extraKeys.map((key) => (
            <div key={key} className={styles.panel__extraRow}>
              <label className={styles.panel__extraLabel}>
                <span>{key}</span>
                <input
                  type="text"
                  value={block.styles?.[key] ?? ''}
                  onChange={(e) => patchStyles({ [key]: e.target.value })}
                  onBlur={onCommit}
                />
              </label>
              <button
                type="button"
                className={styles.panel__extraRemove}
                aria-label={`Remove ${key}`}
                title="Remove"
                onClick={() => {
                  const { [key]: _removed, ...rest } = block.styles ?? {};
                  onChange({ ...block, styles: rest });
                  onCommit();
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className={styles.panel__section}>
        <span className={styles.panel__sectionLabel}>Custom CSS</span>
        <textarea
          className={styles.panel__customCss}
          placeholder="letterSpacing: 0.05em; mixBlendMode: multiply;"
          value={block.customCss ?? ''}
          onChange={(e) => onChange({ ...block, customCss: e.target.value })}
          onBlur={onCommit}
        />
      </div>
    </aside>
  );
}
