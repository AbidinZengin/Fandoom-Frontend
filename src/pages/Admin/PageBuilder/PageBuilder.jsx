import { useEffect, useState } from 'react';
import { createBuilderStore, undo, redo, serializeBlocks } from '../../../shared/builder/store';
import { createLocalJsonAdapter } from '../../../shared/builder/adapters/localJsonAdapter';
import { makeBlockId } from '../../../shared/builder/schema';
import { useClipboard } from '../../../shared/builder/useClipboard';
import { themeBySlug } from '../../ProductionDetail/ProductionDetail.theme';
import { registerPageBuilderComponents } from './PageBuilder.blockRenderers';
import { resolveEffectiveLayout, patchLayoutMatrix } from './PageBuilder.data';
import { PageBuilderErrorBoundary } from './PageBuilder.ErrorBoundary';
import { TopBar } from './TopBar/TopBar';
import { LeftPanel } from './LeftPanel/LeftPanel';
import { FloatingToolbar } from './FloatingToolbar/FloatingToolbar';
import { ContextPanel } from './ContextPanel/ContextPanel';
import { Canvas } from './Canvas/Canvas';
import styles from './PageBuilder.module.css';

registerPageBuilderComponents();

// CodegenPanel'in generated-log kaydı için de kullanılıyor (blocksPath prop'u
// olarak LeftPanel'e iner) — tek taslak dosyası olduğu için sabit.
const DRAFT_BLOCKS_PATH = 'src/pages/Admin/PageBuilder/demo.blocks.json';
const adapter = createLocalJsonAdapter(DRAFT_BLOCKS_PATH);
const useBuilderStore = createBuilderStore(adapter);

function isTypingTarget(el) {
  return el instanceof HTMLElement && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT' || el.tagName === 'SELECT');
}

// Generic Page Builder — 4 bölgeli editör kabuğu (TopBar/LeftPanel/
// FloatingToolbar/ContextPanel + Canvas). Referans: kullanıcının Figma
// mockup'ı — BİLİNÇLİ olarak SeriesHeroEditor/BlogEditor'ün koyu, sabit
// sağ-panelli görsel dilinden FARKLI (açık zemin, yüzen paneller).
// src/shared/builder/'daki motoru kullanan İLK gerçek tüketici.
//
// PageBuilderErrorBoundary'nin DIŞARIDAN sarması bilinçli: hatanın kaynağı
// (useBuilderStore selector'ları) bu component'in KENDİ render'ının en
// başında atılıyor — boundary aynı component'in İÇİNE konsaydı hiçbir
// şeyi yakalayamazdı (React boundary'ler sadece ÇOCUK render hatalarını
// yakalar). Bu yüzden gerçek gövde PageBuilderInner'a taşındı.
export default function PageBuilder() {
  return (
    <PageBuilderErrorBoundary>
      <PageBuilderInner />
    </PageBuilderErrorBoundary>
  );
}

function PageBuilderInner() {
  const [title, setTitle] = useState('Untitled template');
  const [productionSlug, setProductionSlug] = useState('fandoom');
  const [breakpoint, setBreakpoint] = useState('base');
  const [styleMode, setStyleMode] = useState('normal');
  // Tuval genişliği artık breakpoint-bazlı (Faz 1.5) — kullanıcı kararı:
  // oturum içi kalır, taslağa (*.blocks.json) YAZILMAZ.
  const [canvasWidths, setCanvasWidths] = useState({ base: 1360, md: 768, lg: 390 });
  // Tuval YÜKSEKLİĞİ de aynı sebeple (Faz 1.5'in genişlik kararıyla aynı
  // desen) breakpoint-bazlı ve oturum-içi — kullanıcı raporu: "component'in
  // yüksekliğini değiştirebileyim". Eskiden .canvas CSS'te sabit
  // min-height:800px + height:fit-content'ti, artık bu değer Canvas.jsx'e
  // inline width gibi explicit height olarak basılıyor.
  const [canvasHeights, setCanvasHeights] = useState({ base: 800, md: 800, lg: 800 });
  // Faz 2 "Kodu Üret" referans ekran görüntüsü — CodegenPanel çeker,
  // Canvas arka planda gösterir; iki AYRI component olduğu için burada
  // (ortak ebeveyn) tutulur.
  const [referenceImage, setReferenceImage] = useState(null);
  // Kullanıcı raporu: "referans görsele de görsel gibi muamele edebilelim"
  // — artık gerçek block'lar gibi seçilebilir (mavi outline, Delete ile
  // kaldırma); seçim durumu burada (Canvas'ta değil) tutulur çünkü Delete
  // tuşu bu dosyadaki global keydown'da ele alınıyor (aşağıda).
  const [referenceSelected, setReferenceSelected] = useState(false);
  const [activeTool, setActiveTool] = useState(null);
  // PRESET_VARIANTS'tan seçilen varyant (bkz. PageBuilder.data.js) — sadece
  // LeftPanel'in preset tile'larından set edilir, düz araç seçiminde
  // (LeftPanel components grid, FloatingToolbar, klavye kısayolları) her
  // zaman temizlenir ki bir sonraki düz TEXT/BUTTON vb. eski preset'in
  // içerik/stilini MİRAS ALMASIN.
  const [activePreset, setActivePreset] = useState(null);
  const handleSelectTool = (componentType) => {
    setActiveTool(componentType);
    setActivePreset(null);
  };
  const handleSelectPreset = (preset) => {
    setActiveTool(preset.componentType);
    setActivePreset(preset);
  };
  const [justSaved, setJustSaved] = useState(false);
  const [justPublished, setJustPublished] = useState(false);
  // Çoklu seçim (marquee/shift+tık) — store'un tekil selectedId'sinden AYRI
  // tutulur: ContextPanel'in tek-blok özellik paneli çoklu seçimde anlamsız
  // olduğu için selectedId sadece boyut 0/1'ken senkronize edilir (aşağıda
  // handleSelectBlock/handleSelectMany).
  const [selectedIds, setSelectedIds] = useState(new Set());

  const blocks = useBuilderStore((s) => s.blocks);
  const blockOrder = useBuilderStore((s) => s.blockOrder);
  const selectedId = useBuilderStore((s) => s.selectedId);
  const saving = useBuilderStore((s) => s.saving);
  const loading = useBuilderStore((s) => s.loading);
  const addBlock = useBuilderStore((s) => s.addBlock);
  const addBlockTree = useBuilderStore((s) => s.addBlockTree);
  const updateBlock = useBuilderStore((s) => s.updateBlock);
  const removeBlock = useBuilderStore((s) => s.removeBlock);
  const duplicateBlock = useBuilderStore((s) => s.duplicateBlock);
  const reorderBlocks = useBuilderStore((s) => s.reorderBlocks);
  const reparentBlock = useBuilderStore((s) => s.reparentBlock);
  const groupIntoNewContainer = useBuilderStore((s) => s.groupIntoNewContainer);
  const ungroupContainer = useBuilderStore((s) => s.ungroupContainer);
  const selectBlock = useBuilderStore((s) => s.selectBlock);
  const loadFromAdapter = useBuilderStore((s) => s.loadFromAdapter);
  const saveToAdapter = useBuilderStore((s) => s.saveToAdapter);
  const builds = useBuilderStore((s) => s.builds);
  const loadingBuilds = useBuilderStore((s) => s.loadingBuilds);
  const loadBuilds = useBuilderStore((s) => s.loadBuilds);
  const publishBuild = useBuilderStore((s) => s.publishBuild);
  const restoreBuild = useBuilderStore((s) => s.restoreBuild);
  const generated = useBuilderStore((s) => s.generated);
  const loadingGenerated = useBuilderStore((s) => s.loadingGenerated);
  const loadGenerated = useBuilderStore((s) => s.loadGenerated);
  const restoreGenerated = useBuilderStore((s) => s.restoreGenerated);

  const [, forceTick] = useState(0);
  useEffect(() => useBuilderStore.temporal.subscribe(() => forceTick((t) => t + 1)), []);
  const temporal = useBuilderStore.temporal.getState();

  useEffect(() => {
    loadFromAdapter().catch(() => {});
    loadBuilds();
    loadGenerated();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const orderedBlocks = blockOrder.map((id) => blocks[id]);
  // CodegenPanel'in "Kodu Üret" isteğine eklediği KAYNAK blok ağacı —
  // saveToAdapter/publishBuild'in kullandığı AYNI serileştirme (container
  // çocukları da dahil, sadece kök blockOrder değil).
  const blocksForGenerate = serializeBlocks(blocks, blockOrder);
  const selectedBlock = selectedId ? blocks[selectedId] : null;

  // Tekil seçim yolu (LeftPanel tıklaması, blok sürüklemesi vb.) HER ZAMAN
  // store'un selectedId'sini VE yerel selectedIds'i birlikte günceller —
  // ikisi farklı state ağacında ama birbirine kilitli kalmalı.
  const handleSelectBlock = (id) => {
    selectBlock(id);
    setSelectedIds(id ? new Set([id]) : new Set());
    if (id) setReferenceSelected(false);
  };

  const handleSelectMany = (ids) => {
    setSelectedIds(new Set(ids));
    selectBlock(ids.length === 1 ? ids[0] : null);
    if (ids.length > 0) setReferenceSelected(false);
  };

  useClipboard({
    getSelectedBlocks: () => (selectedIds.size > 0 ? [...selectedIds].map((id) => blocks[id]).filter(Boolean) : selectedBlock ? [selectedBlock] : []),
    onPaste: (copies) => {
      copies.forEach(addBlock);
      setSelectedIds(new Set(copies.map((c) => c.id)));
      selectBlock(copies.length === 1 ? copies[0].id : null);
    },
    onCut: (ids) => {
      ids.forEach(removeBlock);
      setSelectedIds(new Set());
    },
  });

  useEffect(() => {
    const onKeyDown = (e) => {
      if (isTypingTarget(document.activeElement)) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        if (e.shiftKey) redo(useBuilderStore);
        else undo(useBuilderStore);
      } else if (mod && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        redo(useBuilderStore);
      } else if (mod && (e.key === 'd' || e.key === 'D') && (selectedIds.size > 0 || selectedId)) {
        e.preventDefault();
        (selectedIds.size > 0 ? [...selectedIds] : [selectedId]).forEach((id) => duplicateBlock(id));
      } else if (((e.key === 'Delete' || e.key === 'Backspace') || (mod && (e.key === 'x' || e.key === 'X'))) && referenceSelected) {
        // Referans görsel normal block'ların pano/undo sistemine (useClipboard,
        // zundo) hiç DAHİL DEĞİL — kalıcı pano/geri-al beklentisi yok, tek
        // slot olduğu için Ctrl+X burada da pratikte "kaldır" anlamına gelir
        // (kullanıcı raporu: "referans görseline ctrlx ... yaramıyor").
        e.preventDefault();
        setReferenceImage(null);
        setReferenceSelected(false);
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && (selectedIds.size > 0 || selectedId)) {
        e.preventDefault();
        (selectedIds.size > 0 ? [...selectedIds] : [selectedId]).forEach((id) => removeBlock(id));
        setSelectedIds(new Set());
      } else if (mod && (e.key === 'g' || e.key === 'G') && selectedIds.size > 1) {
        e.preventDefault();
        if (e.shiftKey) selectedIds.forEach((id) => updateBlock(id, { groupId: null }));
        else {
          const groupId = makeBlockId();
          selectedIds.forEach((id) => updateBlock(id, { groupId }));
        }
      } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && (selectedIds.size > 0 || selectedId)) {
        e.preventDefault();
        const step = e.shiftKey ? 2 : 0.3;
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
        (selectedIds.size > 0 ? [...selectedIds] : [selectedId]).forEach((id) => {
          const b = blocks[id];
          if (!b || b.locked) return;
          const l = resolveEffectiveLayout(b, breakpoint);
          updateBlock(id, {
            layout: patchLayoutMatrix(b.layout, breakpoint, { x: Math.min(Math.max(l.x + dx, 0), 100 - l.w), y: Math.max(l.y + dy, 0) }),
          });
        });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, selectedIds, blocks, breakpoint, referenceSelected]);

  const patchLayout = (patch) =>
    selectedBlock && updateBlock(selectedBlock.id, { layout: patchLayoutMatrix(selectedBlock.layout, breakpoint, patch) });
  const patchContent = (patch) => selectedBlock && updateBlock(selectedBlock.id, { content: { ...selectedBlock.content, ...patch } });
  const patchBlock = (patch) => selectedBlock && updateBlock(selectedBlock.id, patch);
  const patchStyle = (patch) => {
    if (!selectedBlock) return;
    const bucket = selectedBlock.styles[breakpoint];
    updateBlock(selectedBlock.id, {
      styles: { ...selectedBlock.styles, [breakpoint]: { ...bucket, [styleMode]: { ...bucket[styleMode], ...patch } } },
    });
  };

  const bringToFront = (id) => reorderBlocks([...blockOrder.filter((bid) => bid !== id), id]);

  const handleAddBlock = (block) => {
    addBlock(block);
    setActiveTool(null);
    setActivePreset(null);
  };

  // Kütüphaneden (blockLibrary.js) bir CONTAINER + tüm alt-ağacını
  // yerleştirme — handleAddBlock'un çoklu-blok karşılığı, aynı
  // araç/preset temizleme davranışını paylaşır.
  const handleAddBlockTree = (blocksArray) => {
    addBlockTree(blocksArray);
    setActiveTool(null);
    setActivePreset(null);
  };

  const handleSave = async () => {
    try {
      await saveToAdapter();
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    } catch {
      // saveToAdapter zaten store.error'a yazıyor
    }
  };

  const handlePublish = async () => {
    try {
      await publishBuild();
      setJustPublished(true);
      setTimeout(() => setJustPublished(false), 2000);
    } catch {
      // publishBuild zaten store.error'a yazıyor
    }
  };


  const isDark = productionSlug !== 'fandoom';
  const accent = isDark ? (themeBySlug[productionSlug]?.accent ?? 'var(--brand-red)') : 'var(--brand-red)';

  return (
    <div className={styles.pageBuilder} data-theme={isDark ? 'dark' : 'light'} style={{ '--pb-accent': accent }}>
      <TopBar
        title={title}
        onTitleChange={setTitle}
        productionSlug={productionSlug}
        onProductionChange={setProductionSlug}
        breakpoint={breakpoint}
        onBreakpointChange={setBreakpoint}
        canvasWidths={canvasWidths}
        onCanvasWidthChange={(bp, value) => setCanvasWidths((w) => ({ ...w, [bp]: value }))}
        canvasHeights={canvasHeights}
        onCanvasHeightChange={(bp, value) => setCanvasHeights((h) => ({ ...h, [bp]: value }))}
        canUndo={temporal.pastStates.length > 0}
        canRedo={temporal.futureStates.length > 0}
        onUndo={() => undo(useBuilderStore)}
        onRedo={() => redo(useBuilderStore)}
        saving={saving}
        justSaved={justSaved}
        onSave={handleSave}
        justPublished={justPublished}
        onPublish={handlePublish}
      />

      <div className={styles.pageBuilder__body}>
        <LeftPanel
          activeTool={activeTool}
          onSelectTool={handleSelectTool}
          activePreset={activePreset}
          onSelectPreset={handleSelectPreset}
          blocks={orderedBlocks}
          blocksById={blocks}
          selectedId={selectedId}
          onSelectBlock={handleSelectBlock}
          onReparentBlock={reparentBlock}
          onGroupIntoNewContainer={groupIntoNewContainer}
          onRenameBlock={(id, name) => updateBlock(id, { name })}
          onToggleLock={(id) => updateBlock(id, { locked: !blocks[id].locked })}
          onToggleHide={(id) => updateBlock(id, { hidden: !blocks[id].hidden })}
          canvasWidths={canvasWidths}
          canvasHeights={canvasHeights}
          referenceImage={referenceImage}
          onReferenceImage={setReferenceImage}
          onRestoreBlockContent={(id, content) => updateBlock(id, { content })}
          builds={builds}
          loadingBuilds={loadingBuilds}
          onRestoreBuild={restoreBuild}
          blocksPath={DRAFT_BLOCKS_PATH}
          blocksForGenerate={blocksForGenerate}
          generated={generated}
          loadingGenerated={loadingGenerated}
          onRestoreGenerated={restoreGenerated}
        />

        {loading ? (
          <div className={styles.pageBuilder__status}>Loading…</div>
        ) : (
          <Canvas
            blocks={orderedBlocks}
            blocksById={blocks}
            selectedIds={selectedIds}
            onSelectBlock={handleSelectBlock}
            onSelectMany={handleSelectMany}
            breakpoint={breakpoint}
            styleMode={styleMode}
            activeTool={activeTool}
            activePreset={activePreset}
            onAddBlock={handleAddBlock}
            onAddBlockTree={handleAddBlockTree}
            updateBlock={updateBlock}
            onReparentBlock={reparentBlock}
            onGroupIntoNewContainer={groupIntoNewContainer}
            onPatchStyle={patchStyle}
            canvasWidths={canvasWidths}
            canvasHeights={canvasHeights}
            onCanvasHeightChange={(bp, value) => setCanvasHeights((h) => ({ ...h, [bp]: value }))}
            referenceImage={referenceImage}
            referenceSelected={referenceSelected}
            onSelectReference={setReferenceSelected}
          />
        )}
      </div>

      <FloatingToolbar activeTool={activeTool} onSelectTool={handleSelectTool} />

      {selectedBlock && (
        <ContextPanel
          block={selectedBlock}
          blocksById={blocks}
          breakpoint={breakpoint}
          styleMode={styleMode}
          onStyleModeChange={setStyleMode}
          onPatchLayout={patchLayout}
          onPatchContent={patchContent}
          onPatchStyle={patchStyle}
          onPatchBlock={patchBlock}
          onCommit={() => {}}
          onRemove={() => removeBlock(selectedBlock.id)}
          onDuplicate={() => duplicateBlock(selectedBlock.id)}
          onBringToFront={() => bringToFront(selectedBlock.id)}
          onSendToBack={() => reorderBlocks([selectedBlock.id, ...blockOrder.filter((id) => id !== selectedBlock.id)])}
          onUngroupContainer={() => ungroupContainer(selectedBlock.id)}
        />
      )}
    </div>
  );
}
