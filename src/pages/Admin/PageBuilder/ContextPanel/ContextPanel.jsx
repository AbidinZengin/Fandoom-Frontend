import { useEffect, useState } from 'react';
import { PropertyFactory } from '../../../../shared/builder/PropertyFactory/PropertyFactory';
import { getComponentDefinition } from '../../../../shared/builder/registry';
import { ENTITY_SCHEMAS } from '../../../../shared/builder/entitySchemas';
import { EntityPicker } from '../../../../shared/builder/EntityPicker/EntityPicker';
import { resolveBinding } from '../../../../shared/builder/schema';
import { saveBoundField } from '../../../../shared/builder/entityWriteback';
import { useBlockLibraryStore } from '../../../../shared/builder/blockLibrary';
import { fetchPages } from '../../../../shared/api/designServer';
import { CONTENT_ICON_KEYS, CONTENT_ICONS } from '../../../../shared/builder/contentIcons';
import { EFFECT_CONTROLS, SIZING_CONTROLS, FIXED_CROSS_CONTROL, FIXED_PRIMARY_CONTROL, FLOW_CONTROLS, resolveEffectiveStyle, resolveEffectiveLayout } from '../PageBuilder.data';
import { IconTrash, IconDuplicate, IconBringFront, IconSendBack, IconBookmark, IconUngroup } from '../icons';
import styles from './ContextPanel.module.css';

const TABS = ['Style', 'Effects', 'Data'];
const EFFECT_KEYS = new Set(EFFECT_CONTROLS.map((c) => c.key));

// Bağlamsal özellikler paneli — tuvalde seçili nesnenin yanında beliren
// yüzen panel, 3 sekme (referans: kullanıcının Figma mockup'ı). Sağ-panel
// yerine YÜZEN — SeriesHeroEditor'ün sabit sağ-dok PropertiesPanel'inden
// bilinçli farklı.
export function ContextPanel({
  block,
  blocksById,
  breakpoint,
  styleMode,
  onStyleModeChange,
  onPatchLayout,
  onPatchContent,
  onPatchStyle,
  onCommit,
  onRemove,
  onDuplicate,
  onBringToFront,
  onSendToBack,
  onPatchBlock,
  onUngroupContainer,
}) {
  const [tab, setTab] = useState('Style');
  // "Kütüphaneye ekle" butonunun kısa süreli ikon geri bildirimi — TopBar'ın
  // justSaved'iyle AYNI desen (bkz. PageBuilder.jsx handleSave).
  const [savedToLibrary, setSavedToLibrary] = useState(false);
  const saveBlockToLibrary = useBlockLibraryStore((s) => s.saveBlock);

  if (!block) return null;

  // CONTAINER'da da çalışır — blocksById'den TÜM alt-ağacı (recursive)
  // okuyup kaydeder (bkz. blockLibrary.js snapshotBody, kullanıcı kararı
  // 2026-08-19: "container kütüphanesi daha mantıklı").
  const handleSaveToLibrary = () => {
    saveBlockToLibrary(block, blocksById);
    setSavedToLibrary(true);
    setTimeout(() => setSavedToLibrary(false), 1500);
  };

  const definition = getComponentDefinition(block.componentType);
  const effective = resolveEffectiveStyle(block, breakpoint, styleMode);
  const effectiveLayout = resolveEffectiveLayout(block, breakpoint);
  const isChild = Boolean(block.parentId);
  const styleValues = Object.fromEntries(Object.entries(effective).filter(([k]) => !EFFECT_KEYS.has(k)));
  const effectValues = Object.fromEntries(Object.entries(effective).filter(([k]) => EFFECT_KEYS.has(k)));

  return (
    <aside className={styles.panel}>
      <header className={styles.panel__head}>
        <div className={styles.panel__tabs}>
          {TABS.map((t) => (
            <button key={t} type="button" className={styles.panel__tab} data-active={tab === t || undefined} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </div>
        <button type="button" className={styles.panel__delete} onClick={onRemove} title="Delete" aria-label="Delete">
          <IconTrash width={16} height={16} />
        </button>
      </header>

      <div className={styles.panel__actions}>
        <button type="button" onClick={onDuplicate} title="Duplicate (Ctrl+D)" aria-label="Duplicate">
          <IconDuplicate width={16} height={16} />
        </button>
        <button type="button" onClick={onBringToFront} title="Bring to front" aria-label="Bring to front">
          <IconBringFront width={16} height={16} />
        </button>
        <button type="button" onClick={onSendToBack} title="Send to back" aria-label="Send to back">
          <IconSendBack width={16} height={16} />
        </button>
        <button type="button" data-success={savedToLibrary || undefined} onClick={handleSaveToLibrary} title="Kütüphaneye ekle" aria-label="Kütüphaneye ekle">
          <IconBookmark width={16} height={16} />
        </button>
        {block.componentType === 'CONTAINER' && (
          <button type="button" onClick={onUngroupContainer} title="Gruptan çıkar" aria-label="Gruptan çıkar">
            <IconUngroup width={16} height={16} />
          </button>
        )}
        {(tab === 'Style' || tab === 'Effects') && (
          <div className={styles.panel__modeToggle}>
            <button type="button" data-active={styleMode === 'normal' || undefined} onClick={() => onStyleModeChange('normal')}>
              Normal
            </button>
            <button type="button" data-active={styleMode === 'hover' || undefined} onClick={() => onStyleModeChange('hover')}>
              Hover
            </button>
          </div>
        )}
      </div>

      {tab === 'Style' && (
        <div className={styles.panel__body}>
          {isChild ? (
            // Nested/auto-layout bloklar (bkz.
            // docs/plans/2026-08-18-pagebuilder-nested-blocks-design.md):
            // bir container'ın çocuğunda X/Y/W/H anlamsız — konum flex
            // akışından gelir, boyut niyeti hug/fill/fixed ile ifade edilir.
            <section className={styles.panel__section}>
              <span className={styles.panel__sectionLabel}>Sizing (container içi)</span>
              <PropertyFactory
                controls={[
                  ...SIZING_CONTROLS,
                  ...(block.sizing?.primary === 'fixed' ? [FIXED_PRIMARY_CONTROL] : []),
                  ...(block.sizing?.cross === 'fixed' ? [FIXED_CROSS_CONTROL] : []),
                ]}
                values={{
                  ...block.sizing,
                  ...(block.sizing?.primary === 'fixed' ? { fixedPrimary: block.fixedPrimary ?? '' } : {}),
                  ...(block.sizing?.cross === 'fixed' ? { fixedCross: block.fixedCross ?? '' } : {}),
                }}
                onChange={(patch) =>
                  onPatchBlock(
                    'fixedPrimary' in patch
                      ? { fixedPrimary: patch.fixedPrimary === '' ? null : Number(patch.fixedPrimary) }
                      : 'fixedCross' in patch
                        ? { fixedCross: patch.fixedCross === '' ? null : Number(patch.fixedCross) }
                        : { sizing: { ...block.sizing, ...patch } }
                  )
                }
                onCommit={onCommit}
              />
            </section>
          ) : (
            <section className={styles.panel__section}>
              <span className={styles.panel__sectionLabel}>Position &amp; size</span>
              <div className={styles.panel__grid4}>
                <label>
                  <span>X%</span>
                  <input type="number" step="0.5" value={round(effectiveLayout.x)} onChange={(e) => onPatchLayout({ x: Number(e.target.value) })} onBlur={onCommit} />
                </label>
                <label>
                  <span>Y%</span>
                  <input type="number" step="0.5" value={round(effectiveLayout.y)} onChange={(e) => onPatchLayout({ y: Number(e.target.value) })} onBlur={onCommit} />
                </label>
                <label>
                  <span>W%</span>
                  <input type="number" step="0.5" value={round(effectiveLayout.w)} onChange={(e) => onPatchLayout({ w: Number(e.target.value) })} onBlur={onCommit} />
                </label>
                {block.componentType !== 'CONTAINER' && (
                  <label>
                    <span>H%</span>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="auto"
                      value={effectiveLayout.h != null ? round(effectiveLayout.h) : ''}
                      onChange={(e) => onPatchLayout({ h: e.target.value === '' ? null : Number(e.target.value) })}
                      onBlur={onCommit}
                    />
                  </label>
                )}
              </div>
            </section>
          )}

          {block.componentType === 'CONTAINER' && (
            <section className={styles.panel__section}>
              <span className={styles.panel__sectionLabel}>Flow (dizilim)</span>
              <PropertyFactory controls={FLOW_CONTROLS} values={block.flow ?? {}} onChange={(patch) => onPatchBlock({ flow: { ...block.flow, ...patch } })} onCommit={onCommit} />
            </section>
          )}

          {'text' in (block.content ?? {}) && (
            <section className={styles.panel__section}>
              <span className={styles.panel__sectionLabel}>Content</span>
              <input
                type="text"
                value={block.content?.text ?? ''}
                onChange={(e) => onPatchContent({ text: e.target.value })}
                onBlur={onCommit}
              />
            </section>
          )}

          {'icon' in (block.content ?? {}) && (
            <section className={styles.panel__section}>
              <span className={styles.panel__sectionLabel}>Icon</span>
              <div className={styles.panel__iconGrid}>
                {CONTENT_ICON_KEYS.map((key) => {
                  const icon = CONTENT_ICONS[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      className={styles.panel__iconButton}
                      data-active={block.content?.icon === key || undefined}
                      title={key}
                      onClick={() => {
                        onPatchContent({ icon: key });
                        onCommit();
                      }}
                    >
                      <svg width={16} height={16} viewBox={icon.viewBox} fill={icon.filled ? 'currentColor' : 'none'} stroke={icon.filled ? 'none' : 'currentColor'} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                        <path d={icon.path} />
                      </svg>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {'to' in (block.content ?? {}) && (
            <section className={styles.panel__section}>
              <span className={styles.panel__sectionLabel}>Link (route)</span>
              <LinkField value={block.content?.to ?? ''} onChange={(to) => onPatchContent({ to })} onCommit={onCommit} />
            </section>
          )}

          <section className={styles.panel__section}>
            <span className={styles.panel__sectionLabel}>Appearance ({styleMode})</span>
            <PropertyFactory controls={definition?.controls ?? []} values={styleValues} onChange={onPatchStyle} onCommit={onCommit} />
          </section>

          <section className={styles.panel__section}>
            <span className={styles.panel__sectionLabel}>Custom CSS</span>
            <textarea
              className={styles.panel__customCss}
              placeholder="letterSpacing: 0.05em; mixBlendMode: multiply;"
              value={block.customCss ?? ''}
              onChange={(e) => onPatchBlock({ customCss: e.target.value })}
              onBlur={onCommit}
            />
          </section>
        </div>
      )}

      {tab === 'Effects' && (
        <div className={styles.panel__body}>
          <section className={styles.panel__section}>
            <span className={styles.panel__sectionLabel}>
              Effects &amp; layout ({styleMode}, {breakpoint})
            </span>
            <PropertyFactory controls={EFFECT_CONTROLS} values={effectValues} onChange={onPatchStyle} onCommit={onCommit} />
          </section>
        </div>
      )}

      {tab === 'Data' && (
        <DataTab key={block.id} block={block} bindableField={definition?.bindableField} onPatchBlock={onPatchBlock} onCommit={onCommit} />
      )}
    </aside>
  );
}

const round = (n) => Math.round(n * 10) / 10;

// BUTTON/LOGO/ICON preset'lerinin link hedefi seçicisi — kullanıcı kararı:
// "route seçici + serbest metin". fetchPages() CodegenPanel'in zaten
// kullandığı design-server /pages ucu (App.jsx'i tarayıp SADECE statik
// route'ları döner); dinamik `/:slug` route'lar ve dış URL'ler için
// dropdown'ın altındaki serbest-metin input aynı değere yazar. Sadece
// local dev'de (design-server açıkken) çalışır — sayfa listesi gelmezse
// dropdown boş kalır, serbest metin input yine çalışır.
function LinkField({ value, onChange, onCommit }) {
  const [pages, setPages] = useState([]);

  useEffect(() => {
    fetchPages()
      .then(setPages)
      .catch(() => {});
  }, []);

  return (
    <>
      <select
        value=""
        onChange={(e) => {
          if (!e.target.value) return;
          onChange(e.target.value);
          onCommit();
        }}
      >
        <option value="">Bilinen route seç…</option>
        {pages.map((p) => (
          <option key={p.folder} value={p.route}>
            {p.route}
          </option>
        ))}
      </select>
      <input
        type="text"
        placeholder="/route veya https://…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onCommit}
      />
    </>
  );
}

// Seçili block'u backend'deki gerçek bir kayda (blog/series/episode/...)
// bağlar — ekran görüntüsündeki "Değişken Bağlama" paneli. Block bazlı:
// her block kendi entity type+ID'sini seçer (kullanıcı kararı — bkz. plan).
// Tip+ID seçimi ve değişken listesi EntityPicker'da (aynı motor
// LeftPanel'in sürükle-bırak paletiyle de paylaşılıyor) — burası sadece
// "zaten bağlıysa özet + kaldır" sarmalayıcısını taşır. `key={block.id}`
// (yukarıda) her block seçiminde EntityPicker'ı TEMİZ mount eder, önceki
// block'un taslağı sızmaz.
function DataTab({ block, bindableField, onPatchBlock, onCommit }) {
  const bound = block.bindings;
  // idle | saving | success | error — sadece bu block'un "Backend'e Kaydet"
  // butonuna özel, `key={block.id}` sayesinde her block seçiminde temiz sıfırlanır.
  const [saveStatus, setSaveStatus] = useState('idle');
  const [saveError, setSaveError] = useState('');

  if (!bindableField) {
    return (
      <div className={styles.panel__body}>
        <section className={styles.panel__section}>
          <p className={styles.panel__hint}>Bu blok tipi veri bağlamayı desteklemiyor.</p>
        </section>
      </div>
    );
  }

  const handleSelect = (field, resolved) => {
    onPatchBlock({
      bindings: { entityType: resolved.type, entityId: resolved.id, field },
      content: { ...block.content, [bindableField.key]: resolveBinding(resolved.data, field) },
    });
    onCommit();
  };

  const handleUnbind = () => {
    onPatchBlock({ bindings: null });
    onCommit();
  };

  const canWrite = bound && Boolean(ENTITY_SCHEMAS[bound.entityType]?.put);

  const handleSave = async () => {
    setSaveStatus('saving');
    setSaveError('');
    try {
      await saveBoundField(block, bindableField);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      setSaveStatus('error');
      // İçerik OLDUĞU GİBİ kalır (kullanıcı kararı — reddedilirse geri
      // sarılmaz), kullanıcı düzeltip tekrar dener.
      setSaveError(err.message ?? 'Kaydedilemedi');
    }
  };

  return (
    <div className={styles.panel__body}>
      <section className={styles.panel__section}>
        <span className={styles.panel__sectionLabel}>Kaynak</span>

        {bound && (
          <div className={styles.panel__boundSummary}>
            <span>
              {ENTITY_SCHEMAS[bound.entityType]?.label ?? bound.entityType} · {bound.entityId} → {bound.field}
            </span>
            <button type="button" onClick={handleUnbind}>
              Bağlantıyı kaldır
            </button>
          </div>
        )}

        <EntityPicker
          interaction="click"
          compatibleKind={bindableField.kind}
          initialType={bound?.entityType ?? ''}
          initialId={bound?.entityId ?? ''}
          onSelect={handleSelect}
        />
      </section>

      {bound && (
        <section className={styles.panel__section}>
          <span className={styles.panel__sectionLabel}>Geri Yaz</span>
          {canWrite ? (
            <>
              <p className={styles.panel__hint}>
                Block içeriğini canvas'ta düzenle, sonra bu alanı backend'deki gerçek kayda yaz.
              </p>
              <button type="button" onClick={handleSave} disabled={saveStatus === 'saving'}>
                {saveStatus === 'saving' ? 'Kaydediliyor…' : saveStatus === 'success' ? 'Kaydedildi ✓' : 'Backend’e Kaydet'}
              </button>
              {saveStatus === 'error' && <p className={styles.panel__error}>{saveError}</p>}
            </>
          ) : (
            <p className={styles.panel__hint}>Bu entity tipi için backend yazma desteği henüz yok.</p>
          )}
        </section>
      )}
    </div>
  );
}
