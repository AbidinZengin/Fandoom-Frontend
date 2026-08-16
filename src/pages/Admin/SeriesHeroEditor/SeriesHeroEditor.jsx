import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { resolveProductionById } from '../../../shared/api/productions';
import { emptyDraft, loadSeriesHeroForEdit, makeBlockId, saveSeriesHeroDraft } from './SeriesHeroEditor.data';
import { useHistory } from '../BlogEditor/useHistory';
import { BlockList } from './BlockList/BlockList';
import { AddBlockBar } from './AddBlockBar/AddBlockBar';
import { PropertiesPanel } from './PropertiesPanel/PropertiesPanel';
import { PropertyMenu } from './PropertyMenu/PropertyMenu';
import styles from './SeriesHeroEditor.module.css';

const DUPLICATE_OFFSET = 3;

const DRAFT_SAVE_DEBOUNCE_MS = 800;
const draftStorageKey = (seriesId) => `fandoom_series_hero_draft_${seriesId}`;

// Series Hero editörü — BlogEditor'ün BİREBİR aynı iskeleti (serbest canvas,
// undo/redo, taslak kurtarma), SeriesHeroBlock şemasına uyarlanmış. Blog'un
// aksine :seriesId HER ZAMAN vardır — Series zaten var olan bir yapım,
// burada sadece onun Hero'su düzenlenir ("yeni Series" akışı YOK).
// useHistory BlogEditor'dan doğrudan import edilir — component-bazlı değil,
// tamamen jenerik (Blog'a özel hiçbir şey taşımıyor), kopyalamak gereksiz
// tekrar olurdu.
export default function SeriesHeroEditor() {
  const { seriesId } = useParams();

  const history = useHistory(emptyDraft());
  const draft = history.state;

  const [seriesTitle, setSeriesTitle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [justSaved, setJustSaved] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [recoverableDraft, setRecoverableDraft] = useState(null);
  // Figma/Excalidraw tarzı seçim — PropertiesPanel'in hangi bloğu
  // göstereceğini belirler, BlockList'e de prop olarak geçer (Task 8).
  const [selectedKey, setSelectedKey] = useState(null);
  // Sağ-tık menüsü — { blockKey, x, y } | null. BlockItem'daki sağ-tık
  // BlockList üzerinden buraya kadar bubble eder (ekran koordinatı, fixed
  // konumlandırma için).
  const [propertyMenu, setPropertyMenu] = useState(null);

  useEffect(() => {
    let cancelled = false;
    resolveProductionById(Number(seriesId), 'SERIES').then((p) => {
      if (!cancelled) setSeriesTitle(p?.title ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [seriesId]);

  useEffect(() => {
    let cancelled = false;

    const checkRecoverable = () => {
      try {
        const raw = localStorage.getItem(draftStorageKey(seriesId));
        if (raw && !cancelled) setRecoverableDraft(JSON.parse(raw));
      } catch {
        // bozuk kayıt — sessizce yoksay
      }
    };

    setLoading(true);
    setLoadError(null);
    loadSeriesHeroForEdit(seriesId)
      .then((state) => {
        if (cancelled) return;
        history.reset(state);
        setIsDirty(false);
        setLoading(false);
        checkRecoverable();
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seriesId, reloadToken]);

  // BlogEditor ile aynı gerekçe: sayfadan ayrılınca taslak localStorage'a
  // yedeklenir, kaybolmaz.
  useEffect(() => {
    if (!isDirty) return undefined;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(draftStorageKey(seriesId), JSON.stringify(draft));
      } catch {
        // localStorage dolu/kapalı olabilir — taslak sadece bellekte kalır
      }
    }, DRAFT_SAVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [draft, isDirty, seriesId]);

  const restoreDraft = () => {
    history.reset(recoverableDraft);
    setIsDirty(true);
    setRecoverableDraft(null);
  };

  const discardRecoverableDraft = () => {
    localStorage.removeItem(draftStorageKey(seriesId));
    setRecoverableDraft(null);
  };

  useEffect(() => {
    const onKeyDown = (e) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      if (e.key === 'z' || e.key === 'Z') {
        e.preventDefault();
        if (e.shiftKey) history.redo();
        else history.undo();
      } else if (e.key === 'y' || e.key === 'Y') {
        e.preventDefault();
        history.redo();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history.undo, history.redo]);

  useEffect(() => {
    if (!isDirty) return undefined;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const patchBlocks = (heroBlocks) => {
    history.update((d) => ({ ...d, heroBlocks }));
    setIsDirty(true);
  };

  // PropertiesPanel'in aksiyon butonları — BlockList'in kendi klavye
  // kısayolları (Delete/Ctrl+D) için TAŞIDIĞI aynı mantığın burada da
  // yaşayan hâli; ikisi de aynı draft.heroBlocks/patchBlocks/history.seal
  // üzerinden çalıştığı için tutarsızlık riski yok, sadece iki farklı
  // tetikleyici (klavye vs panel butonu).
  const selectedBlock = draft.heroBlocks.find((b) => b._key === selectedKey) ?? null;

  const patchSelectedBlock = (next) => {
    patchBlocks(draft.heroBlocks.map((b) => (b._key === selectedKey ? next : b)));
  };

  const removeSelectedBlock = () => {
    patchBlocks(draft.heroBlocks.filter((b) => b._key !== selectedKey));
    history.seal();
    setSelectedKey(null);
  };

  const duplicateSelectedBlock = () => {
    if (!selectedBlock) return;
    const newId = makeBlockId();
    const copy = {
      ...selectedBlock,
      id: newId,
      _key: newId,
      x: Math.min(100 - selectedBlock.width, selectedBlock.x + DUPLICATE_OFFSET),
      y: selectedBlock.y + DUPLICATE_OFFSET,
    };
    patchBlocks([...draft.heroBlocks, copy]);
    history.seal();
    setSelectedKey(copy._key);
  };

  const bringSelectedToFront = () => {
    if (!selectedBlock) return;
    patchBlocks([...draft.heroBlocks.filter((b) => b._key !== selectedKey), selectedBlock]);
    history.seal();
  };

  const sendSelectedToBack = () => {
    if (!selectedBlock) return;
    patchBlocks([selectedBlock, ...draft.heroBlocks.filter((b) => b._key !== selectedKey)]);
    history.seal();
  };

  const openPropertyMenu = (blockKey, x, y) => setPropertyMenu({ blockKey, x, y });
  const closePropertyMenu = () => setPropertyMenu(null);

  const addExtraProperty = (key) => {
    if (!propertyMenu) return;
    const target = draft.heroBlocks.find((b) => b._key === propertyMenu.blockKey);
    if (!target || key in (target.styles ?? {})) return;
    patchBlocks(draft.heroBlocks.map((b) => (b._key === propertyMenu.blockKey ? { ...b, styles: { ...b.styles, [key]: '' } } : b)));
    history.seal();
  };

  const addBlock = (block) => {
    history.update((d) => ({ ...d, heroBlocks: [...d.heroBlocks, block] }));
    history.seal();
    setIsDirty(true);
    setSelectedKey(block._key); // Figma/Excalidraw: yeni eklenen eleman otomatik seçilir
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await saveSeriesHeroDraft(seriesId, draft);
      setIsDirty(false);
      localStorage.removeItem(draftStorageKey(seriesId));
      // Kayıt sessizce başarılıydı ama görünür bir onay yoktu (kullanıcı
      // raporu: "kaydetmiyor" — aslında kaydediyordu, sadece geri bildirim
      // eksikti; network/DB ile doğrulandı). 2s'lik "Saved" rozeti yeterli.
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    } catch (err) {
      setSaveError(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className={styles.seriesHeroEditor__status}>Loading…</p>;
  }

  if (loadError) {
    return (
      <div className={styles.seriesHeroEditor__status}>
        <p>{loadError.message || 'Failed to load — design-server çalışıyor mu? (npm run design-server)'}</p>
        <button type="button" onClick={() => setReloadToken((t) => t + 1)}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <section className={styles.seriesHeroEditor}>
      <header className={styles.seriesHeroEditor__head}>
        <h1 className={styles.seriesHeroEditor__title}>Edit Hero{seriesTitle ? ` — ${seriesTitle}` : ''}</h1>
        <div className={styles.seriesHeroEditor__headActions}>
          <button
            type="button"
            className={styles.seriesHeroEditor__historyButton}
            onClick={history.undo}
            disabled={!history.canUndo}
            aria-label="Undo"
            title="Undo (Ctrl+Z)"
          >
            ↶
          </button>
          <button
            type="button"
            className={styles.seriesHeroEditor__historyButton}
            onClick={history.redo}
            disabled={!history.canRedo}
            aria-label="Redo"
            title="Redo (Ctrl+Shift+Z)"
          >
            ↷
          </button>
          <button
            type="button"
            className={styles.seriesHeroEditor__save}
            data-saved={justSaved || undefined}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving…' : justSaved ? 'Saved ✓' : 'Save'}
          </button>
        </div>
      </header>

      {recoverableDraft && (
        <div className={styles.seriesHeroEditor__recoverBanner}>
          <p>Found an unsaved draft — restore it?</p>
          <div className={styles.seriesHeroEditor__recoverActions}>
            <button type="button" onClick={restoreDraft}>
              Restore
            </button>
            <button type="button" onClick={discardRecoverableDraft}>
              Discard
            </button>
          </div>
        </div>
      )}

      {saveError && (
        <div className={styles.seriesHeroEditor__saveError}>
          <p>{saveError.message || 'Save failed, try again.'}</p>
        </div>
      )}

      <div className={styles.seriesHeroEditor__blocks}>
        <BlockList
          blocks={draft.heroBlocks}
          onChange={patchBlocks}
          onCommit={history.seal}
          selectedKey={selectedKey}
          onSelectKey={setSelectedKey}
          onContextMenu={openPropertyMenu}
        />
        <AddBlockBar onAdd={addBlock} />
        <PropertiesPanel
          block={selectedBlock}
          onChange={patchSelectedBlock}
          onCommit={history.seal}
          onRemove={removeSelectedBlock}
          onDuplicate={duplicateSelectedBlock}
          onBringToFront={bringSelectedToFront}
          onSendToBack={sendSelectedToBack}
        />
      </div>

      {propertyMenu && (
        <PropertyMenu
          x={propertyMenu.x}
          y={propertyMenu.y}
          existingKeys={Object.keys(draft.heroBlocks.find((b) => b._key === propertyMenu.blockKey)?.styles ?? {})}
          onAdd={addExtraProperty}
          onClose={closePropertyMenu}
        />
      )}
    </section>
  );
}
