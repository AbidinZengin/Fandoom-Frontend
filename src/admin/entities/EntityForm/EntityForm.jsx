import controls from '../../controls.module.css';
import Field from '../../Field/Field';
import BlocksField from './BlocksField';
import ImageUrlInput from './ImageUrlInput';
import MultiSelectField from './MultiSelectField';
import RelationSelect from './RelationSelect';
import styles from './EntityForm.module.css';

// Alan tipine göre doğru kontrolü çizer. Sayı/boş değer dönüşümü burada:
// boş giriş '' olarak tutulur, kaydederken backend için null'a çevrilir.
function renderControl(field, value, onChange, parent) {
  const common = { className: controls.control, id: field.key };

  switch (field.type) {
    case 'textarea':
      return (
        <textarea
          {...common}
          rows={5}
          maxLength={field.max}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case 'json':
      return (
        <textarea
          {...common}
          className={`${controls.control} ${styles['entityForm__code']}`}
          rows={5}
          spellCheck={false}
          maxLength={field.max}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case 'blocks':
      return <BlocksField field={field} value={value} onChange={onChange} renderField={(f, v, change) => renderControl(f, v, change, parent)} />;
    case 'relation':
      return <RelationSelect field={field} parent={parent} value={value} onChange={onChange} />;
    case 'number':
      return (
        <input
          {...common}
          type="number"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        />
      );
    case 'date':
      return <input {...common} type="date" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
    case 'select':
      return (
        <select {...common} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
          {!field.required && <option value="">Seçilmedi</option>}
          {field.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    case 'image':
      return <ImageUrlInput value={value} max={field.max} onChange={onChange} />;
    case 'boolean':
      return (
        <input
          {...common}
          type="checkbox"
          className={styles['entityForm__checkbox']}
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
        />
      );
    case 'multiselect':
      return <MultiSelectField field={field} value={value} onChange={onChange} />;
    default:
      return (
        <input
          {...common}
          type="text"
          maxLength={field.max}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}

// `errors`: ApiError.fieldErrors ({ alan: mesaj }) — ilgili alanın altına basılır.
export default function EntityForm({ entity, draft, errors, onChange, parent }) {
  return (
    <div className={styles['entityForm']}>
      {entity.groups.map((group) => (
        <section
          key={group.title}
          className={
            group.wide
              ? `${styles['entityForm__card']} ${styles['entityForm__card--wide']}`
              : styles['entityForm__card']
          }
        >
          <h2 className={styles['entityForm__heading']}>{group.title}</h2>
          <div className={styles['entityForm__grid']}>
            {group.fields.map((field) => (
              <div
                key={field.key}
                className={
                  field.wide || field.type === 'image' || field.type === 'multiselect' || field.type === 'json' || field.type === 'blocks'
                    ? styles['entityForm__wide']
                    : undefined
                }
              >
                <Field label={field.required ? `${field.label} *` : field.label} hint={field.hint}>
                  {renderControl(field, draft[field.key], (value) => onChange(field.key, value), parent)}
                </Field>
                {errors?.[field.key] && (
                  <p className={styles['entityForm__error']}>{errors[field.key]}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
