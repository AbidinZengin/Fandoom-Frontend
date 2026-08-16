import styles from './PropertyFactory.module.css';

// Schema-driven özellik paneli — registry.js'teki bir componentType
// tanımının `controls` listesini okuyup otomatik form üretir
// (SeriesHeroEditor/PropertiesPanel.jsx'in elle yazılmış per-tip
// kontrollerinin genellemesi). Store'a DOĞRUDAN bağlanmaz — `onChange`/
// `onCommit` prop'ları alır, commit sınırı (blur/pointerup) çağıran
// component'in beginGesture/commitGesture'a bağlaması içindir.
//
// İki katmanlı desen PropertiesPanel'den korunur: `controls`'ta deklare
// EDİLMEYEN her `values` anahtarı "Extra properties" altında otomatik
// serbest metin satırı olarak listelenir (kaçış kapısı — registry'nin
// tanımadığı bir CSS özelliği elle eklenebilir).
export function PropertyFactory({ controls = [], values = {}, onChange, onCommit, onRemoveExtra }) {
  const declaredKeys = new Set(controls.map((c) => c.key));
  const extraKeys = Object.keys(values).filter((k) => !declaredKeys.has(k));

  const patch = (key, value) => onChange({ [key]: value });

  return (
    <div className={styles.factory}>
      {controls.map((control) => {
        const value = values[control.key] ?? control.default ?? '';

        if (control.type === 'select') {
          return (
            <label key={control.key} className={styles.factory__row}>
              <span>{control.label}</span>
              <select
                value={value}
                onChange={(e) => {
                  patch(control.key, e.target.value);
                  onCommit?.();
                }}
              >
                {control.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          );
        }

        if (control.type === 'color') {
          return (
            <label key={control.key} className={styles.factory__row}>
              <span>{control.label}</span>
              <input
                type="color"
                value={value || '#000000'}
                onChange={(e) => {
                  patch(control.key, e.target.value);
                  onCommit?.();
                }}
              />
            </label>
          );
        }

        if (control.type === 'slider') {
          return (
            <label key={control.key} className={styles.factory__row}>
              <span>
                {control.label} ({value})
              </span>
              <input
                type="range"
                min={control.min}
                max={control.max}
                step={control.step}
                value={value}
                onChange={(e) => patch(control.key, Number(e.target.value))}
                onPointerUp={onCommit}
              />
            </label>
          );
        }

        if (control.type === 'size') {
          return (
            <label key={control.key} className={styles.factory__row}>
              <span>{control.label}</span>
              <input type="text" value={value} onChange={(e) => patch(control.key, e.target.value)} onBlur={onCommit} />
            </label>
          );
        }

        // type === 'text' (varsayılan) — `presets` verilmişse datalist ile
        // hem seçilebilir hem serbest yazılabilir olur (kullanıcı isteği:
        // "cursor/filter gibi alanlar top-down menü + elle yazma").
        if (control.presets?.length) {
          const listId = `pf-${control.key}-presets`;
          return (
            <label key={control.key} className={styles.factory__row}>
              <span>{control.label}</span>
              <input list={listId} type="text" value={value} onChange={(e) => patch(control.key, e.target.value)} onBlur={onCommit} />
              <datalist id={listId}>
                {control.presets.map((preset) => (
                  <option key={preset.value} value={preset.value}>
                    {preset.label ?? preset.value}
                  </option>
                ))}
              </datalist>
            </label>
          );
        }

        return (
          <label key={control.key} className={styles.factory__row}>
            <span>{control.label}</span>
            <input type="text" value={value} onChange={(e) => patch(control.key, e.target.value)} onBlur={onCommit} />
          </label>
        );
      })}

      {extraKeys.length > 0 && (
        <div className={styles.factory__extra}>
          <span className={styles.factory__extraLabel}>Extra properties</span>
          {extraKeys.map((key) => (
            <div key={key} className={styles.factory__extraRow}>
              <label className={styles.factory__row}>
                <span>{key}</span>
                <input type="text" value={values[key] ?? ''} onChange={(e) => patch(key, e.target.value)} onBlur={onCommit} />
              </label>
              <button
                type="button"
                className={styles.factory__extraRemove}
                aria-label={`Remove ${key}`}
                title="Remove"
                onClick={() => onRemoveExtra?.(key)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
