import { useState } from 'react';
import Field from '../../Field/Field';
import IconButton from '../../IconButton/IconButton';
import { ArrowDownIcon, ArrowUpIcon, TrashIcon } from '../../icons';
import styles from './BlocksField.module.css';

const newKey = () => `n${Math.random().toString(36).slice(2, 9)}`;

// İç içe blok listesi (sezon/bölüm blokları). Her blok `field.itemFields` ile
// çizilir; `when(item)` alanın o blokta görünüp görünmeyeceğini belirler. Tanımda
// olmayan alanlar (id, col, row…) bloğun içinde AYNEN taşınır. `renderField`:
// EntityForm'un alan çizicisi (döngüsel import olmasın diye dışarıdan gelir).
export default function BlocksField({ field, value, onChange, renderField }) {
  const items = Array.isArray(value) ? value : [];
  const [confirming, setConfirming] = useState(null);

  const keyOf = (item) => item.id ?? item._key;
  const patch = (index, key, v) => onChange(items.map((item, i) => (i === index ? { ...item, [key]: v } : item)));
  const move = (from, to) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    [next[from], next[to]] = [next[to], next[from]];
    onChange(next);
  };
  const remove = (index) => {
    onChange(items.filter((_, i) => i !== index));
    setConfirming(null);
  };
  const add = (type) =>
    onChange([...items, { ...field.newItem(type), _key: newKey(), [field.typeKey]: type }]);

  const typeLabel = (type) => field.types.find((t) => t.value === type)?.label ?? type;

  return (
    <div className={styles['blocks']}>
      {items.length === 0 && <p className={styles['blocks__empty']}>Henüz blok yok, aşağıdan ekle.</p>}

      {items.map((item, index) => {
        const id = keyOf(item);
        return (
          <article key={id} className={styles['blocks__item']}>
            <header className={styles['blocks__head']}>
              <span className={styles['blocks__title']}>
                {index + 1}. {typeLabel(item[field.typeKey])}
              </span>
              <div className={styles['blocks__actions']}>
                <IconButton label="Yukarı taşı" onClick={() => move(index, index - 1)} disabled={index === 0}>
                  <ArrowUpIcon />
                </IconButton>
                <IconButton label="Aşağı taşı" onClick={() => move(index, index + 1)} disabled={index === items.length - 1}>
                  <ArrowDownIcon />
                </IconButton>
                {confirming === id ? (
                  <span className={styles['blocks__confirm']}>
                    Silinsin mi?
                    <button type="button" className={styles['blocks__confirmDelete']} onClick={() => remove(index)}>
                      Sil
                    </button>
                    <button type="button" onClick={() => setConfirming(null)}>
                      Vazgeç
                    </button>
                  </span>
                ) : (
                  <IconButton label="Bloğu sil" onClick={() => setConfirming(id)} danger>
                    <TrashIcon />
                  </IconButton>
                )}
              </div>
            </header>

            <div className={styles['blocks__fields']}>
              {field.itemFields
                .filter((f) => !f.when || f.when(item))
                .map((f) => (
                  <div key={f.key} className={f.wide || f.type === 'image' ? styles['blocks__wide'] : undefined}>
                    <Field label={f.required ? `${f.label} *` : f.label} hint={f.hint}>
                      {renderField(
                        { ...f, key: `${field.key}-${id}-${f.key}` },
                        item[f.key],
                        (v) => patch(index, f.key, v),
                      )}
                    </Field>
                  </div>
                ))}
            </div>
          </article>
        );
      })}

      <div className={styles['blocks__add']}>
        <span className={styles['blocks__addLabel']}>Blok ekle</span>
        {field.types.map((type) => (
          <button key={type.value} type="button" className={styles['blocks__addButton']} onClick={() => add(type.value)}>
            + {type.label}
          </button>
        ))}
      </div>
    </div>
  );
}
