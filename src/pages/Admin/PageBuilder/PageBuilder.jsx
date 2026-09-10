import { useEffect, useState } from 'react';
import { createBuilderStore, undo, redo } from '../../../shared/builder/store';
import { createLocalJsonAdapter } from '../../../shared/builder/adapters/localJsonAdapter';
import { useClipboard } from '../../../shared/builder/useClipboard';
import { themeBySlug } from '../../ProductionDetail/ProductionDetail.theme';
import { registerPageBuilderComponents } from './PageBuilder.blockRenderers';
import { PageBuilderErrorBoundary } from './PageBuilder.ErrorBoundary';
import { TopBar } from './TopBar/TopBar';
import { LeftPanel } from './LeftPanel/LeftPanel';
import { FloatingToolbar } from './FloatingToolbar/FloatingToolbar';
import { ContextPanel } from './ContextPanel/ContextPanel';
import { Canvas } from './Canvas/Canvas';
import styles from './PageBuilder.module.css';

registerPageBuilderComponents();

const adapter = createLocalJsonAdapter('src/pages/Admin/PageBuilder/demo.blocks.json');
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
  const [activeTool, setActiveTool] = useState(null);
  const [justSaved, setJustSaved] = useState(false);

  const blocks = useBuilderStore((s) => s.blocks);
  const blockOrder = useBuilderStore((s) => s.blockOrder);
  const selectedId = useBuilderStore((s) => s.selectedId);
  const saving = useBuilderStore((s) => s.saving);
  const loading = useBuilderStore((s) => s.loading);
  const addBlock = useBuilderStore((s) => s.addBlock);
  const updateBlock = useBuilderStore((s) => s.updateBlock);
  const removeBlock = useBuilderStore((s) => s.removeBlock);
  const duplicateBlock = useBuilderStore((s) => s.duplicateBlock);
  const reorderBlocks = useBuilderStore((s) => s.reorderBlocks);
  const selectBlock = useBuilderStore((s) => s.selectBlock);
  const loadFromAdapter = useBuilderStore((s) => s.loadFromAdapter);
  const saveToAdapter = useBuilderStore((s) => s.saveToAdapter);

  const [, forceTick] = useState(0);
  useEffect(() => useBuilderStore.temporal.subscribe(() => forceTick((t) => t + 1)), []);
  const temporal = useBuilderStore.temporal.getState();

  useEffect(() => {
    loadFromAdapter().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const orderedBlocks = blockOrder.map((id) => blocks[id]);
  const selectedBlock = selectedId ? blocks[selectedId] : null;

  useClipboard({
    getSelectedBlock: () => selectedBlock,
    onPaste: (copy) => addBlock(copy),
    onCut: (id) => removeBlock(id),
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
      } else if (mod && (e.key === 'd' || e.key === 'D') && selectedId) {
        e.preventDefault();
        duplicateBlock(selectedId);
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault();
        removeBlock(selectedId);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const patchLayout = (patch) => selectedBlock && updateBlock(selectedBlock.id, { layout: { ...selectedBlock.layout, ...patch } });
  const patchContent = (patch) => selectedBlock && updateBlock(selectedBlock.id, { content: { ...selectedBlock.content, ...patch } });
  const patchBlock = (patch) => selectedBlock && updateBlock(selectedBlock.id, patch);
  const patchStyle = (patch) => {
    if (!selectedBlock) return;
    const bucket = selectedBlock.styles[breakpoint];
    updateBlock(selectedBlock.id, {
      styles: { ...selectedBlock.styles, [breakpoint]: { ...bucket, [styleMode]: { ...bucket[styleMode], ...patch } } },
    });
  };

  const handleAddBlock = (block) => {
    addBlock(block);
    setActiveTool(null);
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
        canUndo={temporal.pastStates.length > 0}
        canRedo={temporal.futureStates.length > 0}
        onUndo={() => undo(useBuilderStore)}
        onRedo={() => redo(useBuilderStore)}
        saving={saving}
        justSaved={justSaved}
        onSave={handleSave}
      />

      <div className={styles.pageBuilder__body}>
        <LeftPanel
          activeTool={activeTool}
          onSelectTool={setActiveTool}
          blocks={orderedBlocks}
          selectedId={selectedId}
          onSelectBlock={selectBlock}
          onReorderBlocks={reorderBlocks}
          onToggleLock={(id) => updateBlock(id, { locked: !blocks[id].locked })}
          onToggleHide={(id) => updateBlock(id, { hidden: !blocks[id].hidden })}
        />

        {loading ? (
          <div className={styles.pageBuilder__status}>Loading…</div>
        ) : (
          <Canvas
            blocks={orderedBlocks}
            selectedId={selectedId}
            onSelectBlock={selectBlock}
            breakpoint={breakpoint}
            styleMode={styleMode}
            activeTool={activeTool}
            onAddBlock={handleAddBlock}
            updateBlock={updateBlock}
          />
        )}
      </div>

      <FloatingToolbar activeTool={activeTool} onSelectTool={setActiveTool} />

      {selectedBlock && (
        <ContextPanel
          block={selectedBlock}
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
          onBringToFront={() => reorderBlocks([...blockOrder.filter((id) => id !== selectedBlock.id), selectedBlock.id])}
          onSendToBack={() => reorderBlocks([selectedBlock.id, ...blockOrder.filter((id) => id !== selectedBlock.id)])}
        />
      )}
    </div>
  );
}
