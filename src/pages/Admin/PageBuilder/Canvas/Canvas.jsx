import { useRef } from 'react';
import { getComponentDefinition } from '../../../../shared/builder/registry';
import { resolveEffectiveStyle, resolveEffectiveLayout } from '../PageBuilder.data';
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
  selectedIds = EMPTY_SELECTION,
  onSelectBlock,
  onSelectMany,
  breakpoint,
  styleMode,
  activeTool,
  onAddBlock,
  updateBlock,
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

  const { guides, collidingId, panningBlockId, setPanningBlockId, handleBlockPointerDown, startResize, startImagePan, alignSelection, distributeSelection } = useBlockGestures({
    blocks,
    breakpoint,
    canvasRef,
    updateBlock,
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
    canvasRef,
    blocks,
    breakpoint,
    onAddBlock,
    onSelectMany,
    onSelectBlock,
    onSelectReference,
    updateBlock,
  });

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
        {visibleBlocks.map((block) => {
          const definition = getComponentDefinition(block.componentType);
          const isSelected = selectedIds.has(block.id);
          const s = resolveEffectiveStyle(block, breakpoint, isSelected ? styleMode : 'normal');
          const layout = resolveEffectiveLayout(block, breakpoint);
          // TEXT varsayılan olarak (layout.h == null) içeriğe göre otomatik
          // yükseklik alır (Figma'nın "auto height" metin kutusu gibi) —
          // kullanıcı N/S tutamacıyla DİKEY resize edip sabit bir yükseklik
          // verirse (layout.h dolar) o andan sonra kutu SABİT kalır, taşan
          // metin TextBlockField'ın autosize'ı kapanıp kendi scroll'una
          // düşer (bkz. TextBlockField.jsx `autosize` prop'u). Diğer block
          // tipleriyle AYNI genel mekanik — artık isText'e özel dal yok.
          const heightStyle = layout.h != null ? `${layout.h}%` : 'auto';
          const handles = RESIZE_HANDLES;
          return (
            <div
              key={block.id}
              data-block-id={block.id}
              className={styles.block}
              data-selected={isSelected || undefined}
              data-colliding={collidingId === block.id || undefined}
              data-locked={block.locked || undefined}
              data-panning-image={panningBlockId === block.id || undefined}
              style={{
                left: `${layout.x}%`,
                top: `${layout.y}%`,
                width: `${layout.w}%`,
                height: heightStyle,
                zIndex: s.zIndex,
                // rotate/scale BURADA (seçim çerçevesi + resize tutamaçlarını
                // da saran dış sarmalayıcıda) uygulanır, renderer'ların kendi
                // İÇ div'inde DEĞİL — kullanıcı düzeltmesi: "scale/rotate
                // ederken dış çeper aynı kalıyor, eş zamanlı dönmesi lazım".
                // blur/filter ise BİLİNÇLİ olarak burada değil (bkz. renderer'lar)
                // — dışta olsaydı resize tutamaçları da bulanıklaşırdı.
                rotate: s.rotate ? `${s.rotate}deg` : undefined,
                scale: s.scale,
              }}
              onPointerDown={(e) => (panningBlockId === block.id ? startImagePan(block, e) : handleBlockPointerDown(block, e))}
              onDoubleClick={
                block.componentType === 'IMAGE' && block.content?.imageUrl
                  ? (e) => {
                      e.stopPropagation();
                      setPanningBlockId(block.id);
                    }
                  : undefined
              }
            >
              {definition?.component ? (
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

              {isSelected && !block.locked &&
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
        })}
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
