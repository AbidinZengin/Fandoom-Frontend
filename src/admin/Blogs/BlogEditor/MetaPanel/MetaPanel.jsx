import controls from '../../../controls.module.css';
import Field from '../../../Field/Field';
import IconButton from '../../../IconButton/IconButton';
import { FORMAT_OPTIONS, STATUS_OPTIONS } from '../BlogEditor.data';
import { ImageField } from '../ImageField/ImageField';
import styles from './MetaPanel.module.css';

const toNumberOrNull = (value) => (value ? Number(value) : null);

function TagRow({ tag, onChange, onRemove }) {
  return (
    <div className={styles['metaPanel__tagRow']}>
      <select
        className={controls.control}
        aria-label="Etiket türü"
        value={tag.subjectType ?? ''}
        onChange={(e) => onChange({ ...tag, subjectType: e.target.value || null })}
      >
        <option value="">Tür</option>
        <option value="SERIES">Dizi</option>
        <option value="MOVIE">Film</option>
      </select>
      <input
        className={controls.control}
        type="number"
        placeholder="Yapım ID"
        aria-label="Yapım ID"
        value={tag.subjectId ?? ''}
        onChange={(e) => onChange({ ...tag, subjectId: toNumberOrNull(e.target.value) })}
      />
      <input
        className={controls.control}
        type="number"
        placeholder="Sezon"
        aria-label="Sezon"
        value={tag.seasonNumber ?? ''}
        onChange={(e) => onChange({ ...tag, seasonNumber: toNumberOrNull(e.target.value) })}
      />
      <input
        className={controls.control}
        type="number"
        placeholder="Bölüm"
        aria-label="Bölüm"
        value={tag.episodeNumber ?? ''}
        onChange={(e) => onChange({ ...tag, episodeNumber: toNumberOrNull(e.target.value) })}
      />
      <IconButton label="Etiketi kaldır" onClick={onRemove} danger>
        ×
      </IconButton>
    </div>
  );
}

// blocks dışındaki tüm BlogRequest alanları — düz controlled form.
// patch(field, value) BlogEditor'daki tek state objesine immutable güncelleme
// yapar.
export function MetaPanel({ draft, onPatch }) {
  const patchTags = (nextTags) => onPatch('tags', nextTags);
  const text = (field) => ({
    className: controls.control,
    type: 'text',
    value: draft[field] ?? '',
    onChange: (e) => onPatch(field, e.target.value),
  });

  return (
    <div className={styles['metaPanel']}>
      <section className={`${styles['metaPanel__card']} ${styles['metaPanel__card--wide']}`}>
        <h2 className={styles['metaPanel__heading']}>Başlık</h2>
        <div className={`${styles['metaPanel__grid']} ${styles['metaPanel__grid--three']}`}>
          <Field label="Başlık (EN)">
            <input {...text('title')} />
          </Field>
          <Field label="Başlık (TR)">
            <input {...text('titleTr')} />
          </Field>
          <Field label="Kicker (EN)">
            <input {...text('kicker')} />
          </Field>
          <Field label="Kicker (TR)">
            <input {...text('kickerTr')} />
          </Field>
          <Field label="Axis (EN)">
            <input {...text('axis')} />
          </Field>
          <Field label="Axis (TR)">
            <input {...text('axisTr')} />
          </Field>
        </div>
      </section>

      <section className={styles['metaPanel__card']}>
        <h2 className={styles['metaPanel__heading']}>Yayın</h2>
        <div className={styles['metaPanel__grid']}>
          <Field label="Durum">
            <select
              className={controls.control}
              value={draft.status}
              onChange={(e) => onPatch('status', e.target.value)}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Format">
            <select
              className={controls.control}
              value={draft.format ?? ''}
              onChange={(e) => onPatch('format', e.target.value || null)}
            >
              <option value="">Seçilmedi</option>
              {FORMAT_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Sıra (opsiyonel)">
            <input
              className={controls.control}
              type="number"
              value={draft.recommendedRank ?? ''}
              onChange={(e) => onPatch('recommendedRank', toNumberOrNull(e.target.value))}
            />
          </Field>
        </div>
      </section>

      {/* Spoiler-Free artık ayrı bir alan DEĞİL — sezon boşsa türetilir
          (kullanıcı kararı: iki ayrı kontrol çelişebiliyordu). Tek doğruluk
          kaynağı bu iki input. */}
      <section className={styles['metaPanel__card']}>
        <h2 className={styles['metaPanel__heading']}>Spoiler sınırı</h2>
        <div className={styles['metaPanel__grid']}>
          <Field label="Sezon">
            <input
              className={controls.control}
              type="number"
              value={draft.spoilerThroughSeasonNumber ?? ''}
              onChange={(e) => onPatch('spoilerThroughSeasonNumber', toNumberOrNull(e.target.value))}
            />
          </Field>
          <Field label="Bölüm">
            <input
              className={controls.control}
              type="number"
              value={draft.spoilerThroughEpisodeNumber ?? ''}
              onChange={(e) => onPatch('spoilerThroughEpisodeNumber', toNumberOrNull(e.target.value))}
            />
          </Field>
        </div>
        {draft.spoilerThroughSeasonNumber == null && (
          <p className={styles['metaPanel__note']}>Sezon boş: yazı spoiler-free sayılır.</p>
        )}
      </section>

      <section className={`${styles['metaPanel__card']} ${styles['metaPanel__card--wide']}`}>
        <h2 className={styles['metaPanel__heading']}>Kapak görseli</h2>
        <ImageField
          imageUrl={draft.imageUrl}
          imageAlt={draft.imageAlt}
          onChange={({ imageUrl, imageAlt }) => {
            onPatch('imageUrl', imageUrl);
            onPatch('imageAlt', imageAlt);
          }}
        />
        <Field label="Alt metin (TR)">
          <input
            className={controls.control}
            type="text"
            value={draft.imageAltTr ?? ''}
            onChange={(e) => onPatch('imageAltTr', e.target.value)}
          />
        </Field>
      </section>

      <section className={`${styles['metaPanel__card']} ${styles['metaPanel__card--wide']}`}>
        <h2 className={styles['metaPanel__heading']}>Etiketler</h2>
        <div className={styles['metaPanel__tags']}>
          {draft.tags.map((tag, index) => (
            <TagRow
              // eslint-disable-next-line react/no-array-index-key
              key={index}
              tag={tag}
              onChange={(next) => patchTags(draft.tags.map((t, i) => (i === index ? next : t)))}
              onRemove={() => patchTags(draft.tags.filter((_, i) => i !== index))}
            />
          ))}
          <button
            type="button"
            className={styles['metaPanel__tagAdd']}
            onClick={() =>
              patchTags([
                ...draft.tags,
                { subjectType: null, subjectId: null, seasonNumber: null, episodeNumber: null },
              ])
            }
          >
            + Etiket ekle
          </button>
        </div>
      </section>
    </div>
  );
}
