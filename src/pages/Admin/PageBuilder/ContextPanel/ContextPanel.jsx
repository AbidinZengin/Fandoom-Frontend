import { useState } from 'react';
import { PropertyFactory } from '../../../../shared/builder/PropertyFactory/PropertyFactory';
import { getComponentDefinition } from '../../../../shared/builder/registry';
import { ENTITY_SCHEMAS } from '../../../../shared/builder/entitySchemas';
import { EntityPicker } from '../../../../shared/builder/EntityPicker/EntityPicker';
import { resolveBinding } from '../../../../shared/builder/schema';
import { saveBoundField } from '../../../../shared/builder/entityWriteback';
import { EFFECT_CONTROLS, resolveEffectiveStyle, resolveEffectiveLayout } from '../PageBuilder.data';
import { IconTrash, IconDuplicate, IconBringFront, IconSendBack } from '../icons';
import styles from './ContextPanel.module.css';

const TABS = ['Style', 'Effects', 'Data'];
const EFFECT_KEYS = new Set(EFFECT_CONTROLS.map((c) => c.key));

// Bağlamsal özellikler paneli — tuvalde seçili nesnenin yanında beliren
// yüzen panel, 3 sekme (referans: kullanıcının Figma mockup'ı). Sağ-panel
// yerine YÜZEN — SeriesHeroEditor'ün sabit sağ-dok PropertiesPanel'inden
// bilinçli farklı.
export function ContextPanel({
  block,
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
}) {
  const [tab, setTab] = useState('Style');

  if (!block) return null;

  const definition = getComponentDefinition(block.componentType);
  const effective = resolveEffectiveStyle(block, breakpoint, styleMode);
  const effectiveLayout = resolveEffectiveLayout(block, breakpoint);
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
            </div>
          </section>

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
