import { FORMAT_OPTIONS, STATUS_OPTIONS } from '../BlogEditor.data';
import { ImageField } from '../ImageField/ImageField';
import styles from './MetaPanel.module.css';

function TagRow({ tag, onChange, onRemove }) {
  return (
    <div className={styles.metaPanel__tagRow}>
      <select
        className={styles.metaPanel__tagSelect}
        value={tag.subjectType ?? ''}
        onChange={(e) => onChange({ ...tag, subjectType: e.target.value || null })}
      >
        <option value="">Type</option>
        <option value="SERIES">Series</option>
        <option value="MOVIE">Movie</option>
      </select>
      <input
        className={styles.metaPanel__tagInput}
        type="number"
        placeholder="Production ID"
        value={tag.subjectId ?? ''}
        onChange={(e) => onChange({ ...tag, subjectId: e.target.value ? Number(e.target.value) : null })}
      />
      <input
        className={styles.metaPanel__tagInput}
        type="number"
        placeholder="Season"
        value={tag.seasonNumber ?? ''}
        onChange={(e) => onChange({ ...tag, seasonNumber: e.target.value ? Number(e.target.value) : null })}
      />
      <input
        className={styles.metaPanel__tagInput}
        type="number"
        placeholder="Episode"
        value={tag.episodeNumber ?? ''}
        onChange={(e) => onChange({ ...tag, episodeNumber: e.target.value ? Number(e.target.value) : null })}
      />
      <button type="button" className={styles.metaPanel__tagRemove} onClick={onRemove} aria-label="Remove tag">
        ×
      </button>
    </div>
  );
}

// blocks dışındaki tüm BlogRequest alanları — sürüklemeyle ilgisiz düz
// controlled form. patch(field, value) BlogEditor'daki tek state objesine
// immutable güncelleme yapar.
export function MetaPanel({ draft, onPatch }) {
  const patchTags = (nextTags) => onPatch('tags', nextTags);

  return (
    <section className={styles.metaPanel}>
      <div className={styles.metaPanel__row}>
        <label className={styles.metaPanel__field}>
          <span className={styles.metaPanel__label}>Title (EN)</span>
          <input
            className={styles.metaPanel__input}
            type="text"
            value={draft.title}
            onChange={(e) => onPatch('title', e.target.value)}
          />
        </label>
        <label className={styles.metaPanel__field}>
          <span className={styles.metaPanel__label}>Title (TR)</span>
          <input
            className={styles.metaPanel__input}
            type="text"
            value={draft.titleTr}
            onChange={(e) => onPatch('titleTr', e.target.value)}
          />
        </label>
      </div>

      <div className={styles.metaPanel__row}>
        <label className={styles.metaPanel__field}>
          <span className={styles.metaPanel__label}>Kicker (EN)</span>
          <input
            className={styles.metaPanel__input}
            type="text"
            value={draft.kicker}
            onChange={(e) => onPatch('kicker', e.target.value)}
          />
        </label>
        <label className={styles.metaPanel__field}>
          <span className={styles.metaPanel__label}>Kicker (TR)</span>
          <input
            className={styles.metaPanel__input}
            type="text"
            value={draft.kickerTr}
            onChange={(e) => onPatch('kickerTr', e.target.value)}
          />
        </label>
        <label className={styles.metaPanel__field}>
          <span className={styles.metaPanel__label}>Axis (EN)</span>
          <input
            className={styles.metaPanel__input}
            type="text"
            value={draft.axis}
            onChange={(e) => onPatch('axis', e.target.value)}
          />
        </label>
        <label className={styles.metaPanel__field}>
          <span className={styles.metaPanel__label}>Axis (TR)</span>
          <input
            className={styles.metaPanel__input}
            type="text"
            value={draft.axisTr}
            onChange={(e) => onPatch('axisTr', e.target.value)}
          />
        </label>
      </div>

      <div className={styles.metaPanel__row}>
        <label className={styles.metaPanel__field}>
          <span className={styles.metaPanel__label}>Status</span>
          <select
            className={styles.metaPanel__input}
            value={draft.status}
            onChange={(e) => onPatch('status', e.target.value)}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.metaPanel__field}>
          <span className={styles.metaPanel__label}>Format</span>
          <select
            className={styles.metaPanel__input}
            value={draft.format ?? ''}
            onChange={(e) => onPatch('format', e.target.value || null)}
          >
            <option value="">—</option>
            {FORMAT_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.metaPanel__field}>
          <span className={styles.metaPanel__label}>Rank (optional)</span>
          <input
            className={styles.metaPanel__input}
            type="number"
            value={draft.recommendedRank ?? ''}
            onChange={(e) => onPatch('recommendedRank', e.target.value ? Number(e.target.value) : null)}
          />
        </label>
      </div>

      <div className={styles.metaPanel__row}>
        <span className={styles.metaPanel__label}>Cover Image</span>
        <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', width: '100%'}}>
          <ImageField
            imageUrl={draft.imageUrl}
            imageAlt={draft.imageAlt}
            onChange={({ imageUrl, imageAlt }) => {
              onPatch('imageUrl', imageUrl);
              onPatch('imageAlt', imageAlt);
            }}
          />
          <input
            className={styles.metaPanel__input}
            type="text"
            placeholder="Cover Image Alt Text (TR)"
            value={draft.imageAltTr ?? ''}
            onChange={(e) => onPatch('imageAltTr', e.target.value)}
          />
        </div>
      </div>

      {/* Spoiler-Free artık ayrı bir alan/checkbox DEĞİL — sezon/bölüm boşsa
          türetilir (kullanıcı kararı: "iki ayrı kontrol çelişebiliyordu,
          minimize et"). Tek doğruluk kaynağı bu iki input; BlogPost.jsx zaten
          kapıyı yalnız bunlara göre açıp kapatıyordu. */}
      <div className={styles.metaPanel__row}>
        <label className={styles.metaPanel__field}>
          <span className={styles.metaPanel__label}>Spoiler — Season</span>
          <input
            className={styles.metaPanel__input}
            type="number"
            value={draft.spoilerThroughSeasonNumber ?? ''}
            onChange={(e) =>
              onPatch('spoilerThroughSeasonNumber', e.target.value ? Number(e.target.value) : null)
            }
          />
        </label>

        <label className={styles.metaPanel__field}>
          <span className={styles.metaPanel__label}>Spoiler — Episode</span>
          <input
            className={styles.metaPanel__input}
            type="number"
            value={draft.spoilerThroughEpisodeNumber ?? ''}
            onChange={(e) =>
              onPatch('spoilerThroughEpisodeNumber', e.target.value ? Number(e.target.value) : null)
            }
          />
        </label>

        {draft.spoilerThroughSeasonNumber == null && (
          <span className={styles.metaPanel__label}>Spoiler-Free</span>
        )}
      </div>

      <div className={styles.metaPanel__row}>
        <span className={styles.metaPanel__label}>Tags</span>
        <div className={styles.metaPanel__tags}>
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
            className={styles.metaPanel__tagAdd}
            onClick={() =>
              patchTags([
                ...draft.tags,
                { subjectType: null, subjectId: null, seasonNumber: null, episodeNumber: null },
              ])
            }
          >
            + Add tag
          </button>
        </div>
      </div>
    </section>
  );
}
