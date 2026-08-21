import { useRef } from 'react';
import { getComponentDefinition } from '../../../../shared/builder/registry';
import { resolveEffectiveStyle, resolveEffectiveLayout } from '../PageBuilder.data';
import { getBlockPxSize } from './Canvas.geometry';
import { DEFAULT_CANVAS_WIDTHS, DEFAULT_CANVAS_HEIGHTS, RESIZE_HANDLES, EMPTY_SELECTION } from './Canvas.constants';
import { useCanvasViewport } from './useCanvasViewport';
import { useReferenceImage } from './useReferenceImage';
import { useBlockGestures } from './useBlockGestures';
import { usePlacement } from './usePlacement';
import styles from './Canvas.module.css';

// Bu component artık SADECE kompozisyon + JSX render'dır — tüm etkileşim
// mantığı (1000+ satırlık tek dosya hâlindeyken bakımı zorlaşmıştı,
// kullanıcı isteğiyle bölündü) dört odaklı hook'a taşındı:
//   - useCanvasViewport: sonsuz-tuval pan/zoom/sığdırma + tuval yükseklik
//     sürükle-uzat (ikisi de "tuvalin kendi çerçevesi/dönüşümü")
//   - useReferenceImage: Faz 2 referans ekran görüntüsünün taşıma/
//     boyutlandırma/seçimi
//   - useBlockGestures: VAR OLAN block'ları taşıma/boyutlandırma/seçme/
//     hizalama
//   - usePlacement: tuvale YENİ içerik ekleme (araçla çiz, marquee, Data
//     paletinden sürükle-bırak)
// Saf (React'e bağımlı olmayan) geometri/yardımcı fonksiyonlar
// Canvas.geometry.js'te, paylaşılan sabitler Canvas.constants.js'te.
export function Canvas({
  blocks,
  blocksById = {},
  selectedIds = EMPTY_SELECTION,
  onSelectBlock,
  onSelectMany,
  breakpoint,
  styleMode,
  activeTool,
  activePreset,
  onAddBlock,
  onAddBlockTree,
  updateBlock,
  onReparentBlock,
  onGroupIntoNewContainer,
  onPatchStyle,
  canvasWidths = DEFAULT_CANVAS_WIDTHS,
  canvasHeights = DEFAULT_CANVAS_HEIGHTS,
  onCanvasHeightChange,
  referenceImage,
  referenceSelected = false,
  onSelectReference = () => {},
}) {
  const canvasWidth = canvasWidths[breakpoint] ?? DEFAULT_CANVAS_WIDTHS.base;
  const canvasHeight = canvasHeights[breakpoint] ?? DEFAULT_CANVAS_HEIGHTS.base;
  const canvasRef = useRef(null);
  const viewportRef = useRef(null);

  const { view, isPanning, fitToView, zoomBy, handleViewportPointerDownCapture, startCanvasHeightResize } = useCanvasViewport({
    canvasWidth,
    canvasHeight,
    breakpoint,
    blocks,
    updateBlock,
    onCanvasHeightChange,
    viewportRef,
  });

  const { referenceOffset, referenceSize, referenceWrapRef, startReferenceDrag, startReferenceResize } = useReferenceImage({
    activeTool,
    referenceImage,
    referenceSelected,
    onSelectReference,
    onSelectMany,
    zoom: view.zoom,
  });

  const {
    guides,
    collidingId,
    panningBlockId,
    setPanningBlockId,
    handleBlockPointerDown,
    startResize,
    startImagePan,
    alignSelection,
    distributeSelection,
    dropTargetContainerId,
    dragGhost,
  } = useBlockGestures({
    blocks,
    blocksById,
    breakpoint,
    canvasRef,
    updateBlock,
    onReparentBlock,
    onSelectBlock,
    onSelectMany,
    selectedIds,
    activeTool,
    onAddBlock,
    onPatchStyle,
    onSelectReference,
  });

  const { drawRect, marquee, visibleBlocks, handleCanvasPointerDown, handleWrapPointerDown, handleCanvasDragOver, handleCanvasDrop } = usePlacement({
    activeTool,
    activePreset,
    canvasRef,
    blocks,
    breakpoint,
    onAddBlock,
    onAddBlockTree,
    onSelectMany,
    onSelectBlock,
    onSelectReference,
    updateBlock,
  });

  // Nested/auto-layout bloklar (bkz.
  // docs/plans/2026-08-18-pagebuilder-nested-blocks-design.md): CONTAINER'a
  // rastlarsa `childOrder`'ını AYNI fonksiyonla recursive render eder —
  // codegen'deki emitBlock ile KAVRAMSAL OLARAK aynı gezinme (flat map +
  // pointer, `blocksById` üzerinden). `parentFlow`: kök blok için undefined,
  // bir container'ın çocuğuysa o container'ın `flow`'u — çapraz eksen
  // hesabı (width mi height mi) buna bakar.
  function renderBlockNode(block, parentFlow, depth) {
    const definition = getComponentDefinition(block.componentType);
    const isSelected = selectedIds.has(block.id);
    const s = resolveEffectiveStyle(block, breakpoint, isSelected ? styleMode : 'normal');
    const isChild = Boolean(block.parentId);
    const isContainer = block.componentType === 'CONTAINER';
    // Çocuk bloklarda X/Y/W/H flex akışından geldiği için resolveEffectiveLayout
    // hiç OKUNMAZ (kök bloklarla AYNI çağrıyı yapmak yanıltıcı olur — burada
    // sadece kök bloklar için anlamlı).
    const layout = isChild ? null : resolveEffectiveLayout(block, breakpoint);

    const positionStyle = isChild ? {} : { left: `${layout.x}%`, top: `${layout.y}%`, width: `${layout.w}%` };
    const heightStyle = isChild || isContainer ? 'auto' : layout.h != null ? `${layout.h}%` : 'auto';

    const flowStyle = isContainer
      ? {
          display: 'flex',
          flexDirection: block.flow?.direction === 'row' ? 'row' : 'column',
          gap: `${block.flow?.gap ?? 0}px`,
          padding: `${block.flow?.padding ?? 0}px`,
          alignItems: block.flow?.align || 'stretch',
          justifyContent: block.flow?.justify || 'flex-start',
        }
      : {};

    const sizingStyle = isChild
      ? {
          flex: block.sizing?.primary === 'fill' ? '1 1 0' : block.sizing?.primary === 'fixed' ? '0 0 auto' : undefined,
          alignSelf: block.sizing?.cross === 'fill' ? 'stretch' : 'flex-start',
          ...(block.sizing?.primary === 'fixed' && block.fixedPrimary != null
            ? { [parentFlow?.direction === 'row' ? 'width' : 'height']: `${block.fixedPrimary}px` }
            : {}),
          ...(block.sizing?.cross === 'fixed' && block.fixedCross != null
            ? { [parentFlow?.direction === 'row' ? 'height' : 'width']: `${block.fixedCross}px` }
            : {}),
        }
      : {};

    const handles = RESIZE_HANDLES;
    // Container'ların (kök ya da çocuk) serbest 8-yönlü resize'ı YOK —
    // resize matematiği (useBlockGestures) henüz flow-farkında değil,
    // yanlışlıkla `h` set edip "her zaman auto" invaryantını bozardı.
    // Boyut kök container'da W alanından (ContextPanel), çocukta sizing
    // kontrollerinden ayarlanır (Faz 3'te sürükle-bırak gelecek).
    const showResizeHandles = isSelected && !block.locked && !isChild && !isContainer;

    // Faz 3 — child'lar da artık gerçekten sürüklenebiliyor:
    // handleBlockPointerDown, block.parentId set'se (useBlockGestures.js)
    // kendi ghost-tabanlı startChildDrag'ine yönlendiriyor, root'sa mevcut
    // x/y-tabanlı startDrag'e — dallanma artık BURADA değil, hook'un içinde.
    const handlePointerDown = (e) => (panningBlockId === block.id ? startImagePan(block, e) : handleBlockPointerDown(block, e));

    return (
      <div
        key={block.id}
        data-block-id={block.id}
        data-in-flow={isChild || undefined}
        className={styles.block}
        data-selected={isSelected || undefined}
        data-colliding={collidingId === block.id || undefined}
        data-drop-target={isContainer && dropTargetContainerId === block.id || undefined}
        data-dragging={dragGhost?.block.id === block.id || undefined}
        data-locked={block.locked || undefined}
        data-panning-image={panningBlockId === block.id || undefined}
        style={{
          ...positionStyle,
          height: heightStyle,
          ...flowStyle,
          ...sizingStyle,
          zIndex: s.zIndex,
          rotate: s.rotate ? `${s.rotate}deg` : undefined,
          scale: s.scale,
          animation: s.animation || undefined,
          transformOrigin: s.transformOrigin,
          transition: s.transition || undefined,
        }}
        onPointerDown={handlePointerDown}
        onDoubleClick={
          !isContainer && block.componentType === 'IMAGE' && block.content?.imageUrl
            ? (e) => {
                e.stopPropagation();
                setPanningBlockId(block.id);
              }
            : undefined
        }
      >
        {isContainer ? (
          (block.childOrder ?? []).length === 0 ? (
            <div className={styles.block__containerEmpty}>Boş container — buraya blok sürükle</div>
          ) : (
            (block.childOrder ?? [])
              .map((id) => blocksById[id])
              .filter((child) => child && !child.hidden)
              .map((child) => renderBlockNode(child, block.flow, depth + 1))
          )
        ) : definition?.component ? (
          <definition.component
            block={block}
            breakpoint={breakpoint}
            mode={isSelected ? styleMode : 'normal'}
            onPatchContent={(patch) => updateBlock(block.id, { content: { ...block.content, ...patch } })}
            onCommit={() => {}}
          />
        ) : (
          <div className={styles.block__unknown}>{block.componentType}</div>
        )}

        {showResizeHandles &&
          handles.map((dir) => (
            <div
              key={dir}
              className={`${styles.resizeHandle} ${styles[`resizeHandle--${dir}`]}`}
              onPointerDown={(e) => {
                e.stopPropagation();
                startResize(block, dir, e);
              }}
            />
          ))}
      </div>
    );
  }

  return (
    <div
      ref={viewportRef}
      className={styles.canvasWrap}
      data-panning={isPanning || undefined}
      data-placing={Boolean(activeTool) || undefined}
      onPointerDownCapture={handleViewportPointerDownCapture}
      onPointerDown={handleWrapPointerDown}
    >
      <div className={styles.canvasWorld} style={{ transform: `translate(${view.pan.x}px, ${view.pan.y}px) scale(${view.zoom})` }}>
      <div
        ref={canvasRef}
        data-canvas-root
        className={styles.canvas}
        data-placing={Boolean(activeTool) || undefined}
        style={{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }}
        onPointerDown={handleCanvasPointerDown}
        onDragOver={handleCanvasDragOver}
        onDrop={handleCanvasDrop}
      >
        {/* Faz 2 "Kodu Üret" referansı — CodegenPanel'in çektiği gerçek
            sayfa ekran görüntüsü. Tam görsel (opaklık düşürülmez), gerçek
            bir IMAGE block gibi TAŞINABİLİR + BOYUTLANDIRILABİLİR +
            SEÇİLEBİLİR (bkz. useReferenceImage) — .block'un aynı
            dış-sarmalayıcı+tutamaç deseni burada da kullanılır. */}
        {referenceImage && (
          <div
            ref={referenceWrapRef}
            className={styles.canvas__referenceWrap}
            data-selected={referenceSelected || undefined}
            data-placing={Boolean(activeTool) || undefined}
            style={{
              width: referenceSize.w != null ? `${referenceSize.w}px` : `${canvasWidth}px`,
              height: referenceSize.h != null ? `${referenceSize.h}px` : 'auto',
              transform: `translate(${referenceOffset.x}px, ${referenceOffset.y}px)`,
            }}
            onPointerDown={startReferenceDrag}
          >
            <img className={styles.canvas__reference} src={referenceImage} alt="" draggable={false} />
            {referenceSelected && !activeTool &&
              RESIZE_HANDLES.map((dir) => (
                <div
                  key={dir}
                  className={`${styles.resizeHandle} ${styles[`resizeHandle--${dir}`]}`}
                  onPointerDown={(e) => startReferenceResize(dir, e)}
                />
              ))}
          </div>
        )}
        {visibleBlocks.length === 0 && <p className={styles.canvas__empty}>Tuvale bir bileşen eklemek için alt araç çubuğundan seç, sonra tıkla.</p>}
        {visibleBlocks.map((block) => renderBlockNode(block, undefined, 0))}
        {guides.v != null && <div className={styles.guideV} style={{ left: `${guides.v}px` }} />}
        {guides.h != null && <div className={styles.guideH} style={{ top: `${guides.h}px` }} />}
        {drawRect && (
          <div
            className={styles.drawPreview}
            style={{
              left: `${Math.min(drawRect.x1, drawRect.x2)}%`,
              top: `${Math.min(drawRect.y1, drawRect.y2)}%`,
              width: `${Math.abs(drawRect.x2 - drawRect.x1)}%`,
              height: `${Math.abs(drawRect.y2 - drawRect.y1)}%`,
            }}
          />
        )}
        {marquee && (
          <div
            className={styles.marquee}
            style={{
              left: `${Math.min(marquee.x1, marquee.x2)}px`,
              top: `${Math.min(marquee.y1, marquee.y2)}px`,
              width: `${Math.abs(marquee.x2 - marquee.x1)}px`,
              height: `${Math.abs(marquee.y2 - marquee.y1)}px`,
            }}
          />
        )}
        <div className={styles.canvas__heightHandle} onPointerDown={startCanvasHeightResize} title="Tuval yüksekliğini sürükleyerek ayarla" />
      </div>
      </div>

      {selectedIds.size > 1 && (
        <div className={styles.alignBar}>
          {/* align/distribute x/y-tabanlı (pixelEdgesOf → resolveEffectiveLayout)
              — bir CONTAINER çocuğunda anlamsız (konum flex akışından gelir,
              sessizce hiçbir görsel etkisi olmazdı). Sadece TÜM seçim kök
              seviyedeyse gösterilir. */}
          {[...selectedIds].every((id) => !blocksById[id]?.parentId) && (
            <>
              <button type="button" className={styles.alignBar__btn} title="Sola hizala" onClick={() => alignSelection('left')}>⊢</button>
              <button type="button" className={styles.alignBar__btn} title="Yatayda ortala" onClick={() => alignSelection('center-h')}>⊟</button>
              <button type="button" className={styles.alignBar__btn} title="Sağa hizala" onClick={() => alignSelection('right')}>⊣</button>
              <span className={styles.alignBar__sep} />
              <button type="button" className={styles.alignBar__btn} title="Üste hizala" onClick={() => alignSelection('top')}>⊤</button>
              <button type="button" className={styles.alignBar__btn} title="Dikeyde ortala" onClick={() => alignSelection('center-v')}>⊞</button>
              <button type="button" className={styles.alignBar__btn} title="Alta hizala" onClick={() => alignSelection('bottom')}>⊥</button>
              {selectedIds.size > 2 && (
                <>
                  <span className={styles.alignBar__sep} />
                  <button type="button" className={styles.alignBar__btn} title="Yatayda eşit aralıklandır" onClick={() => distributeSelection('h')}>↔</button>
                  <button type="button" className={styles.alignBar__btn} title="Dikeyde eşit aralıklandır" onClick={() => distributeSelection('v')}>↕</button>
                </>
              )}
            </>
          )}
          {/* Grupla — TÜM seçim AYNI ebeveyne sahipse (groupIntoNewContainer'ın
              şartı, bkz. store.js). */}
          {new Set([...selectedIds].map((id) => blocksById[id]?.parentId ?? null)).size === 1 && (
            <>
              <span className={styles.alignBar__sep} />
              <button
                type="button"
                className={styles.alignBar__btn}
                title="Grupla"
                onClick={() => {
                  const ids = [...selectedIds];
                  const pxSizes = Object.fromEntries(ids.map((id) => [id, getBlockPxSize(id)]));
                  onGroupIntoNewContainer(ids, pxSizes);
                }}
              >
                ⊡
              </button>
            </>
          )}
        </div>
      )}

      {/* Faz 3 nested drag ghost'u — CONTAINER çocuğu bir blok
          sürüklenirken (position:static olduğu için kendi DOM'unu
          taşıyamıyor) imleci takip eden küçük önizleme. `position:fixed` +
          ham client koordinatları — canvasWorld'ün zoom/pan transform'unun
          DIŞINDA (viewport-uzayında), dönüşüm hesabına gerek yok. */}
      {dragGhost && (
        <div className={styles.dragGhost} style={{ left: `${dragGhost.x}px`, top: `${dragGhost.y}px` }}>
          {dragGhost.block.name || dragGhost.block.componentType}
        </div>
      )}

      <div className={styles.zoomControl}>
        <button type="button" className={styles.zoomControl__btn} onClick={() => zoomBy(1 / 1.2)} aria-label="Uzaklaştır">−</button>
        <span className={styles.zoomControl__value} onClick={fitToView} title="Sığdır">{Math.round(view.zoom * 100)}%</span>
        <button type="button" className={styles.zoomControl__btn} onClick={() => zoomBy(1.2)} aria-label="Yakınlaştır">+</button>
      </div>
    </div>
  );
}
