import { useEffect, useState } from 'react';
import styles from './MultiSelectField.module.css';

// Kapalı bir seçenek kümesinden çoklu seçim (ör. trivia etiketleri). Seçenekler
// `field.loadOptions()` ile yüklenir: [{ value, label }]. `field.maxItems`
// doluysa seçili olmayanlar kilitlenir.
export default function MultiSelectField({ field, value, onChange }) {
  const [options, setOptions] = useState(null);
  const [error, setError] = useState(false);
  const selected = Array.isArray(value) ? value : [];

  useEffect(() => {
    let cancelled = false;
    field
      .loadOptions()
      .then((res) => {
        if (!cancelled) setOptions(res);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [field]);

  if (error) return <p className={styles['multiSelect__status']}>Seçenekler yüklenemedi.</p>;
  if (!options) return <p className={styles['multiSelect__status']}>Yükleniyor…</p>;

  const full = field.maxItems != null && selected.length >= field.maxItems;
  const toggle = (optionValue) =>
    onChange(
      selected.includes(optionValue) ? selected.filter((v) => v !== optionValue) : [...selected, optionValue],
    );

  return (
    <div className={styles['multiSelect']} role="group" aria-label={field.label}>
      {options.map((option) => {
        const isOn = selected.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isOn}
            disabled={!isOn && full}
            className={isOn ? `${styles['multiSelect__pill']} ${styles['multiSelect__pill--on']}` : styles['multiSelect__pill']}
            onClick={() => toggle(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
