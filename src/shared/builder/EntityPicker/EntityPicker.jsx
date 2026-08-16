import { useEffect, useState } from 'react';
import { ENTITY_SCHEMAS } from '../entitySchemas';
import { fetchEntityData } from '../entityDataCache';
import { resolveBinding } from '../schema';
import styles from './EntityPicker.module.css';

// Sürükle-bırak paletinin (LeftPanel Data sekmesi) ve tıkla-bağla akışının
// (PageBuilder ContextPanel Data sekmesi) PAYLAŞTIĞI çekirdek: tip+ID seç →
// Bağla → gerçek kaydı çek → metin/görsel değişkenleri listele. İki tüketici
// arasındaki TEK fark `interaction` — 'click' bir onSelect callback'i
// tetikler (ContextPanel bunu block'a bağlamak için kullanır), 'drag' her
// öğeyi FANDOOM_VAR_MIME payload'ıyla draggable yapar (Canvas onu okur).
export const FANDOOM_VAR_MIME = 'application/x-fandoom-variable';

// compatibleKind verilmezse (palet kullanımı — belirli bir hedef block yok)
// HİÇBİR grup disabled olmaz, ikisi de kullanılabilir kalır.
export function EntityPicker({ interaction = 'click', compatibleKind, initialType = '', initialId = '', onSelect }) {
  const [draftType, setDraftType] = useState(initialType);
  const [draftId, setDraftId] = useState(initialId);
  const [resolved, setResolved] = useState(null);
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // "Yeni Kayıt Oluştur" — 404 beklemeden, ayrı bir buton (kullanıcı kararı,
  // bkz. PUT/POST plan dosyası). Sadece schema.post + createFields
  // tanımlıysa görünür (Episode create-path'i doğrulanmadığı için yok).
  const [creating, setCreating] = useState(false);
  const [createValues, setCreateValues] = useState({});
  const [createStatus, setCreateStatus] = useState('idle');
  const [createError, setCreateError] = useState('');

  const resolve = async (type, id) => {
    if (!type || !id) return;
    setStatus('loading');
    setErrorMsg('');
    try {
      const data = await fetchEntityData(type, id);
      setResolved({ type, id, data });
      setStatus('idle');
    } catch (err) {
      setResolved(null);
      setStatus('error');
      setErrorMsg(err.message ?? 'Bağlanamadı');
    }
  };

  const draftSchema = draftType ? ENTITY_SCHEMAS[draftType] : null;
  const createFields = draftSchema?.createFields ?? [];
  const createReady = createFields.every((key) => (createValues[key] ?? '').trim());

  // subjectId/categoryId gibi FK alanları backend'de sayısal — düz metin
  // input'tan gelen değer tamamen rakamsa Number'a çevrilir, değilse
  // (subjectType: "MOVIE"/"SERIES" gibi) string kalır.
  const coerce = (value) => (/^\d+$/.test(value.trim()) ? Number(value.trim()) : value.trim());

  const handleCreate = async () => {
    if (!draftSchema?.post || !createReady) return;
    setCreateStatus('loading');
    setCreateError('');
    try {
      const body = Object.fromEntries(createFields.map((key) => [key, coerce(createValues[key])]));
      const created = await draftSchema.post(body);
      setCreating(false);
      setCreateValues({});
      setCreateStatus('idle');
      setDraftId(String(created.id));
      await resolve(draftType, String(created.id));
    } catch (err) {
      setCreateStatus('error');
      setCreateError(err.message ?? 'Oluşturulamadı');
    }
  };

  // Mount'ta bir initial değer verilmişse (ContextPanel zaten bağlı bir
  // block açtığında) otomatik çöz — çağıran her farklı block için bu
  // component'i `key={block.id}` ile YENİDEN mount eder, o yüzden burada
  // block değişimini izleyen ayrı bir effect gerekmez.
  useEffect(() => {
    if (initialType && initialId) resolve(initialType, initialId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const schema = resolved && ENTITY_SCHEMAS[resolved.type];
  const entries = schema ? Object.entries(schema.fields) : [];
  const textVars = entries.filter(([, kind]) => kind === 'text');
  const imageVars = entries.filter(([, kind]) => kind === 'image');

  return (
    <div className={styles.picker}>
      <div className={styles.picker__row}>
        <select value={draftType} onChange={(e) => setDraftType(e.target.value)}>
          <option value="">Tip seç…</option>
          {Object.entries(ENTITY_SCHEMAS).map(([key, s]) => (
            <option key={key} value={key}>
              {s.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder={draftType ? ENTITY_SCHEMAS[draftType].idLabel : 'ID'}
          value={draftId}
          onChange={(e) => setDraftId(e.target.value)}
        />
        <button type="button" onClick={() => resolve(draftType, draftId)} disabled={!draftType || !draftId || status === 'loading'}>
          {status === 'loading' ? 'Yükleniyor…' : resolved ? 'Değiştir' : 'Bağla'}
        </button>
      </div>

      {status === 'error' && <p className={styles.picker__error}>{errorMsg}</p>}

      {draftSchema?.post && (
        <div className={styles.picker__create}>
          {creating ? (
            <div className={styles.picker__row}>
              {createFields.map((key) =>
                key === 'subjectType' ? (
                  <select
                    key={key}
                    value={createValues[key] ?? ''}
                    onChange={(e) => setCreateValues((v) => ({ ...v, [key]: e.target.value }))}
                  >
                    <option value="">subjectType…</option>
                    <option value="MOVIE">MOVIE</option>
                    <option value="SERIES">SERIES</option>
                  </select>
                ) : (
                  <input
                    key={key}
                    type="text"
                    placeholder={key}
                    value={createValues[key] ?? ''}
                    onChange={(e) => setCreateValues((v) => ({ ...v, [key]: e.target.value }))}
                  />
                )
              )}
              <button type="button" onClick={handleCreate} disabled={!createReady || createStatus === 'loading'}>
                {createStatus === 'loading' ? 'Oluşturuluyor…' : 'Oluştur'}
              </button>
              <button type="button" onClick={() => setCreating(false)}>
                Vazgeç
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setCreating(true)}>
              + Yeni {draftSchema.label} Oluştur
            </button>
          )}
          {createStatus === 'error' && <p className={styles.picker__error}>{createError}</p>}
        </div>
      )}

      {resolved && (
        <div className={styles.picker__variables}>
          <VariableGroup
            label="Metin Değişkenler"
            vars={textVars}
            resolved={resolved}
            enabled={!compatibleKind || compatibleKind === 'text'}
            interaction={interaction}
            onSelect={onSelect}
          />
          <VariableGroup
            label="Görsel Değişkenler"
            vars={imageVars}
            resolved={resolved}
            enabled={!compatibleKind || compatibleKind === 'image'}
            interaction={interaction}
            onSelect={onSelect}
          />
          {schema?.blockList && (
            <BlockListSection blockList={schema.blockList} resolved={resolved} compatibleKind={compatibleKind} interaction={interaction} onSelect={onSelect} />
          )}
        </div>
      )}
    </div>
  );
}

function VariableGroup({ label, vars, resolved, enabled, interaction, onSelect }) {
  if (vars.length === 0) return null;
  return (
    <div className={styles.picker__group} data-disabled={!enabled || undefined}>
      <span className={styles.picker__groupLabel}>
        {label}
        {!enabled && ' — TİP UYUMSUZ'}
      </span>
      <div className={styles.picker__list}>
        {vars.map(([field, kind]) => (
          <VarButton key={field} field={field} kind={kind} resolved={resolved} enabled={enabled} interaction={interaction} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}

// blog.blocks[]/episode.episodeBlocks[] gibi DİNAMİK dizi alanları — sabit
// şemaya girmez (uzunluk/içerik entity'ye göre değişir), resolve edilince
// gerçek veriden kurulur. Sadece GERÇEKTEN dolu (null/boş olmayan) alt-alanı
// olan öğeler listelenir — GoT S1E1 gibi 30+ block'lu bir kayıtta çoğu
// alt-alan boş taslak olduğundan bu filtre listeyi kullanılabilir tutar.
function BlockListSection({ blockList, resolved, compatibleKind, interaction, onSelect }) {
  const items = resolved.data[blockList.arrayField];
  if (!Array.isArray(items) || items.length === 0) return null;

  const rows = items
    .map((item, index) => ({
      index,
      item,
      populated: Object.entries(blockList.fields).filter(([key]) => item[key] != null && item[key] !== ''),
    }))
    .filter((row) => row.populated.length > 0);

  if (rows.length === 0) return null;

  return (
    <div className={styles.picker__group}>
      <span className={styles.picker__groupLabel}>İçerik Blokları</span>
      <div className={styles.picker__blockList}>
        {rows.map(({ index, item, populated }) => {
          const previewEntry = populated.find(([, kind]) => kind === 'text');
          const previewRaw = previewEntry ? String(item[previewEntry[0]]) : '';
          const preview = previewRaw.length > 40 ? `${previewRaw.slice(0, 40)}…` : previewRaw;
          return (
            <div key={item.id ?? index} className={styles.picker__blockItem}>
              <span className={styles.picker__blockItemLabel}>
                {item[blockList.labelField] ?? `#${index}`}
                {preview && ` — "${preview}"`}
              </span>
              <div className={styles.picker__list}>
                {populated.map(([key, kind]) => (
                  <VarButton
                    key={key}
                    field={`${blockList.arrayField}.${index}.${key}`}
                    kind={kind}
                    label={`{${resolved.type}.${blockList.arrayField}[${index}].${key}}`}
                    resolved={resolved}
                    enabled={!compatibleKind || compatibleKind === kind}
                    interaction={interaction}
                    onSelect={onSelect}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VarButton({ field, kind, label, resolved, enabled, interaction, onSelect }) {
  return (
    <button
      type="button"
      className={styles.picker__item}
      disabled={interaction === 'click' && !enabled}
      draggable={interaction === 'drag' && enabled}
      onDragStart={
        interaction === 'drag'
          ? (e) => {
              if (!enabled) {
                e.preventDefault();
                return;
              }
              e.dataTransfer.effectAllowed = 'copy';
              e.dataTransfer.setData(
                FANDOOM_VAR_MIME,
                JSON.stringify({ entityType: resolved.type, entityId: resolved.id, field, kind, value: resolveBinding(resolved.data, field) })
              );
            }
          : undefined
      }
      onClick={interaction === 'click' ? () => onSelect(field, resolved) : undefined}
    >
      {label ?? `{${resolved.type}.${field}}`}
    </button>
  );
}
