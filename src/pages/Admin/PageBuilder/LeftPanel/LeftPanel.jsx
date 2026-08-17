import { useState } from 'react';
import { TOOLS, PRESET_VARIANTS } from '../PageBuilder.data';
import { EntityPicker } from '../../../../shared/builder/EntityPicker/EntityPicker';
import { CodegenPanel } from './CodegenPanel/CodegenPanel';
import { WritebackHistoryPanel } from './WritebackHistoryPanel/WritebackHistoryPanel';
import {
  IconGrid,
  IconLayers,
  IconDatabase,
  IconCode,
  IconHistory,
  IconRectangle,
  IconDiamond,
  IconCircle,
  IconType,
  IconImage,
  IconButtonTool,
  IconLogoTool,
  IconStarTool,
  IconLock,
  IconUnlock,
  IconEye,
  IconEyeOff,
} from '../icons';
import styles from './LeftPanel.module.css';

const TOOL_ICONS = {
  RECTANGLE: IconRectangle,
  DIAMOND: IconDiamond,
  CIRCLE: IconCircle,
  BUTTON: IconButtonTool,
  LOGO: IconLogoTool,
  ICON: IconStarTool,
  TEXT: IconType,
  IMAGE: IconImage,
};

// Sol panel — dar ikon şeridi (Bileşenler/Katmanlar sekmesi, referans:
// kullanıcının paylaştığı çalışan Figma Make prototipi) + tek bir geniş
// panel (aktif sekmeye göre bileşen paleti YA DA katman listesi — ikisi
// AYNI ANDA görünmez). Aynı ikona tekrar tıklamak paneli katlar.
export function LeftPanel({
  activeTool,
  onSelectTool,
  activePreset,
  onSelectPreset,
  blocks,
  selectedId,
  onSelectBlock,
  onReorderBlocks,
  onToggleLock,
  onToggleHide,
  canvasWidths,
  canvasHeights,
  referenceImage,
  onReferenceImage,
  onRestoreBlockContent,
}) {
  const [panelTab, setPanelTab] = useState('layers');
  const [dragIndex, setDragIndex] = useState(null);
  // Hangi aracın preset flyout'u açık — SADECE bu panelin lokal UI durumu
  // (PageBuilder.jsx'e taşınmaz, activeTool/activePreset'ten AYRI: flyout
  // açık/kapalı olması hangi preset'in SEÇİLİ olduğunu etkilemez).
  const [presetFlyoutFor, setPresetFlyoutFor] = useState(null);

  const toggleTab = (tab) => setPanelTab((current) => (current === tab ? null : tab));

  // Kullanıcı isteği: "butona bastığımda sağında yeni bir bar açılsın orada
  // butonlar/logolar gözüksün" — aracı SEÇMEK (düz varsayılanla yerleştirme
  // hâlâ mümkün) ile preset varyantlarını GÖSTERMEK aynı tıkla olur; preset'i
  // olmayan bir araca tıklamak flyout'u kapatır.
  const handleToolClick = (componentType) => {
    onSelectTool(componentType);
    const hasPresets = PRESET_VARIANTS.some((p) => p.componentType === componentType);
    setPresetFlyoutFor(hasPresets ? componentType : null);
  };

  const handlePresetClick = (preset) => {
    onSelectPreset(preset);
    setPresetFlyoutFor(null);
  };

  const handleDrop = (targetIndex) => {
    if (dragIndex === null || dragIndex === targetIndex) return;
    const next = blocks.map((b) => b.id);
    const [moved] = next.splice(dragIndex, 1);
    next.splice(targetIndex, 0, moved);
    onReorderBlocks(next);
    setDragIndex(null);
  };

  return (
    <aside className={styles.leftPanel}>
      <div className={styles.leftPanel__rail}>
        <button type="button" className={styles.leftPanel__railIcon} data-active={panelTab === 'components' || undefined} title="Components" aria-label="Components" onClick={() => toggleTab('components')}>
          <IconGrid />
        </button>
        <button type="button" className={styles.leftPanel__railIcon} data-active={panelTab === 'layers' || undefined} title="Layers" aria-label="Layers" onClick={() => toggleTab('layers')}>
          <IconLayers />
        </button>
        <button type="button" className={styles.leftPanel__railIcon} data-active={panelTab === 'data' || undefined} title="Data" aria-label="Data" onClick={() => toggleTab('data')}>
          <IconDatabase />
        </button>
        <button type="button" className={styles.leftPanel__railIcon} data-active={panelTab === 'codegen' || undefined} title="Kodu Üret" aria-label="Kodu Üret" onClick={() => toggleTab('codegen')}>
          <IconCode />
        </button>
        <button type="button" className={styles.leftPanel__railIcon} data-active={panelTab === 'history' || undefined} title="Geçmiş" aria-label="Geçmiş" onClick={() => toggleTab('history')}>
          <IconHistory />
        </button>
      </div>

      {panelTab && (
        <div className={styles.leftPanel__wide}>
          {panelTab === 'components' && (
            <>
              <span className={styles.leftPanel__wideHead}>Components</span>
              <div className={styles.leftPanel__componentList}>
                {TOOLS.filter((t) => t.componentType).map((tool) => {
                  const Icon = TOOL_ICONS[tool.componentType];
                  const hasPresets = PRESET_VARIANTS.some((p) => p.componentType === tool.componentType);
                  return (
                    <button
                      key={tool.componentType}
                      type="button"
                      className={styles.leftPanel__componentButton}
                      data-active={(activeTool === tool.componentType && !activePreset) || undefined}
                      onClick={() => handleToolClick(tool.componentType)}
                    >
                      <Icon />
                      <span>{tool.label}</span>
                      {hasPresets && <span className={styles.leftPanel__componentButtonChevron}>›</span>}
                    </button>
                  );
                })}
              </div>

              {presetFlyoutFor && (
                <div className={styles.leftPanel__presetFlyout}>
                  <span className={styles.leftPanel__wideHead}>{TOOLS.find((t) => t.componentType === presetFlyoutFor)?.label} presetleri</span>
                  {PRESET_VARIANTS.filter((p) => p.componentType === presetFlyoutFor).map((preset) => (
                    <button
                      key={preset.key}
                      type="button"
                      className={styles.leftPanel__presetTile}
                      data-active={activePreset?.key === preset.key || undefined}
                      title={preset.label}
                      onClick={() => handlePresetClick(preset)}
                      style={preset.previewImage ? undefined : preset.styles}
                    >
                      {preset.previewImage ? (
                        <img src={preset.previewImage} alt={preset.label} className={styles.leftPanel__presetImg} />
                      ) : (
                        preset.content?.text ?? preset.label
                      )}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {panelTab === 'layers' && (
            <>
              <span className={styles.leftPanel__wideHead}>Layers</span>
              {blocks.length === 0 && <p className={styles.leftPanel__empty}>No blocks yet</p>}
              <ul className={styles.leftPanel__list}>
                {blocks
                  .slice()
                  .reverse()
                  .map((block, reversedIndex) => {
                    const index = blocks.length - 1 - reversedIndex;
                    return (
                      <li
                        key={block.id}
                        className={styles.leftPanel__item}
                        data-selected={selectedId === block.id || undefined}
                        draggable
                        onDragStart={() => setDragIndex(index)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handleDrop(index)}
                        onClick={() => onSelectBlock(block.id)}
                      >
                        <span className={styles.leftPanel__itemType}>{block.componentType}</span>
                        <button
                          type="button"
                          className={styles.leftPanel__itemAction}
                          data-active={block.locked || undefined}
                          title={block.locked ? 'Unlock' : 'Lock'}
                          aria-label={block.locked ? 'Unlock' : 'Lock'}
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleLock(block.id);
                          }}
                        >
                          {block.locked ? <IconLock /> : <IconUnlock />}
                        </button>
                        <button
                          type="button"
                          className={styles.leftPanel__itemAction}
                          data-active={block.hidden || undefined}
                          title={block.hidden ? 'Show' : 'Hide'}
                          aria-label={block.hidden ? 'Show' : 'Hide'}
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleHide(block.id);
                          }}
                        >
                          {block.hidden ? <IconEyeOff /> : <IconEye />}
                        </button>
                      </li>
                    );
                  })}
              </ul>
            </>
          )}

          {panelTab === 'data' && (
            <>
              <span className={styles.leftPanel__wideHead}>Data</span>
              <p className={styles.leftPanel__hint}>
                Kaynağı bağla, sonra bir değişkeni tuvale sürükle — boş alana bırakırsan yeni (metin/görsel) block oluşur, uyumlu bir
                block'un üstüne bırakırsan onu bağlar.
              </p>
              <EntityPicker interaction="drag" />
            </>
          )}

          {panelTab === 'codegen' && (
            <>
              <span className={styles.leftPanel__wideHead}>Kodu Üret</span>
              <CodegenPanel orderedBlocks={blocks} canvasWidths={canvasWidths} canvasHeights={canvasHeights} referenceImage={referenceImage} onReferenceImage={onReferenceImage} />
            </>
          )}

          {panelTab === 'history' && (
            <>
              <span className={styles.leftPanel__wideHead}>Geçmiş</span>
              <WritebackHistoryPanel blocks={blocks} onRestoreBlockContent={onRestoreBlockContent} />
            </>
          )}
        </div>
      )}
    </aside>
  );
}
