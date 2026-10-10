import { useEffect, useState } from 'react';
import controls from '../../controls.module.css';

// Ebeveynin kayıtlarından seçim (ör. lore grubu → kategori, olay → mekan).
// Seçenekler `field.loadOptions(parent)` ile yüklenir: [{ value, label }].
export default function RelationSelect({ field, parent, value, onChange }) {
  const [options, setOptions] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    field
      .loadOptions(parent)
      .then((res) => {
        if (!cancelled) setOptions(res);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [field, parent]);

  if (error) return <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--brand-red)' }}>Seçenekler yüklenemedi.</p>;

  return (
    <select
      id={field.key}
      className={controls.control}
      value={value ?? ''}
      disabled={!options}
      onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
    >
      <option value="">{!options ? 'Yükleniyor…' : field.required ? 'Seçin' : 'Seçilmedi'}</option>
      {(options ?? []).map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
