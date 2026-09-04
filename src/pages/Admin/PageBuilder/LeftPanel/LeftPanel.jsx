import { useState } from 'react';
import { TOOLS, PRESET_VARIANTS } from '../PageBuilder.data';
import { EntityPicker } from '../../../../shared/builder/EntityPicker/EntityPicker';
import { useBlockLibraryStore } from '../../../../shared/builder/blockLibrary';
import { useWritebackHistoryStore } from '../../../../shared/builder/writebackHistoryStore';
import { getBlockPxSize } from '../Canvas/Canvas.geometry';
import { CodegenPanel } from './CodegenPanel/CodegenPanel';
import { WritebackHistoryPanel } from './WritebackHistoryPanel/WritebackHistoryPanel';
import { BuildHistoryPanel } from './BuildHistoryPanel/BuildHistoryPanel';
import { GeneratedHistoryPanel } from './GeneratedHistoryPanel/GeneratedHistoryPanel';
import {
  IconGrid,
  IconLayers,
  IconDatabase,
  IconCode,
  IconHistory,
  IconBookmark,
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
  IconTrash,
  IconContainerTool,
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
  CONTAINER: IconContainerTool,
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
  blocksById,
  selectedId,
  onSelectBlock,
  onReparentBlock,
  onGroupIntoNewContainer,
  onRenameBlock,
  onToggleLock,
  onToggleHide,
  canvasWidths,
  canvasHeights,
  referenceImage,
  onReferenceImage,
  onRestoreBlockContent,
  builds,
  loadingBuilds,
  onRestoreBuild,
  blocksPath,
  blocksForGenerate,
  generated,
  loadingGenerated,
  onRestoreGenerated,
}) {
  const [panelTab, setPanelTab] = useState('layers');
  // Layers sürükle-bırak nested gruplama/taşıma (bkz.
  // docs/plans/2026-08-18-pagebuilder-nested-blocks-design.md) — id
  // bazlı (index DEĞİL, çünkü artık çok seviyeli/kesişen listeler var).
  // dropZone: sürüklenen imlecin hangi satırın hangi üçte-birinde durduğu
  // ('before'/'after' = sırala, 'into' = o bloğun İÇİNE taşı/grupla).
  const [dragId, setDragId] = useState(null);
  const [dropZone, setDropZone] = useState(null); // { id, zone }
  const [renamingId, setRenamingId] = useState(null);
  const libraryEntries = useBlockLibraryStore((s) => s.entries);
  // Rail'deki "Geçmiş" ikonuna rozet basmak için üç geçmiş kaynağının
  // TOPLAM dolu olup olmadığı — Writeback'in kendi entries'i SADECE
  // WritebackHistoryPanel'de okunuyordu, badge için burada da lazım.
  const writebackCount = useWritebackHistoryStore((s) => s.entries.length);
  const hasHistory = builds.length > 0 || generated.length > 0 || writebackCount > 0;
  const renameLibraryBlock = useBlockLibraryStore((s) => s.renameBlock);
  const removeLibraryBlock = useBlockLibraryStore((s) => s.removeBlock);
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

  // Bir satırın üçte-bir yüksekliğine göre bölge belirler — üst/alt kesimi
  // sırala (before/after), orta kesim İÇİNE taşı/grupla (VS Code dosya
  // ağacı/Figma layers'la aynı üç-bölge deseni).
  const zoneFromPointer = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientY - rect.top) / rect.height;
    if (ratio < 0.28) return 'before';
    if (ratio > 0.72) return 'after';
    return 'into';
  };

  // Kök seviyede liste TERS gösterilir (üstte en önde/frontmost duran
  // katman — bkz. aşağıdaki flattenLayers), bu yüzden ham blockOrder
  // dizisindeki index hesabı 'before'/'after' için TERS çevrilir. Çocuk
  // seviyesinde (bir container'ın childOrder'ı) liste DÜZ gösterilir
  // (flex akış sırası = görsel sıra), index hesabı standart.
  const computeInsertIndex = (targetId, zone, siblingIdsRaw, isRootLevel) => {
    const rawTargetIndex = siblingIdsRaw.indexOf(targetId);
    if (rawTargetIndex === -1) return null;
    let insertIndex = isRootLevel ? (zone === 'before' ? rawTargetIndex + 1 : rawTargetIndex) : zone === 'before' ? rawTargetIndex : rawTargetIndex + 1;
    const dragRawIndex = siblingIdsRaw.indexOf(dragId);
    // dragId AYNI dizideyse (aynı ebeveyn içi yeniden sıralama), reparentBlock
    // önce ONU diziden çıkarır — sonrasındaki index'ler bir kayar, burada
    // telafi edilir.
    if (dragRawIndex !== -1 && dragRawIndex < insertIndex) insertIndex -= 1;
    return insertIndex;
  };

  const handleLayerDrop = (targetId, zone) => {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      setDropZone(null);
      return;
    }
    const dragBlock = blocksById[dragId];
    const targetBlock = blocksById[targetId];
    if (!dragBlock || !targetBlock) {
      setDragId(null);
      setDropZone(null);
      return;
    }

    // Kullanıcı kararı (2026-08-19): VAR OLAN bir blok bir container'a
    // GİRERKEN görünümü/boyutu değişmemeli — o anki piksel boyutu
    // reparent'tan ÖNCE okunup dondurulur (bkz. schema.js
    // applyPreservedPxSize). Köke çıkarken ya da AYNI container içinde
    // sıra değiştirirken gerekmez, reparentBlock zaten pxSize yoksa
    // dokunmuyor.
    if (zone === 'into') {
      if (targetBlock.componentType === 'CONTAINER') {
        onReparentBlock(dragId, targetId, null, getBlockPxSize(dragId));
      } else {
        // Hedef CONTAINER değil — ikisini yeni bir container'a sarmak
        // (kullanıcı isteği: "sürükleyerek componentleri iç içe
        // gruplayabilmeliyim"). groupIntoNewContainer AYNI ebeveyni
        // şart koşuyor, farklıysa önce dragId hedefin yanına taşınır.
        // pxSize'lar reparent/gruplama ÖNCESİ (ikisi de hâlâ eski
        // konumlarındayken) okunur.
        const pxSizes = { [dragId]: getBlockPxSize(dragId), [targetId]: getBlockPxSize(targetId) };
        if ((dragBlock.parentId ?? null) !== (targetBlock.parentId ?? null)) {
          onReparentBlock(dragId, targetBlock.parentId ?? null, null);
        }
        onGroupIntoNewContainer([dragId, targetId], pxSizes);
      }
    } else {
      const parentId = targetBlock.parentId ?? null;
      const isRootLevel = !parentId;
      const siblingIdsRaw = parentId ? blocksById[parentId]?.childOrder ?? [] : blocks.map((b) => b.id);
      const insertIndex = computeInsertIndex(targetId, zone, siblingIdsRaw, isRootLevel);
      const enteringNewParent = parentId && parentId !== (dragBlock.parentId ?? null);
      onReparentBlock(dragId, parentId, insertIndex, enteringNewParent ? getBlockPxSize(dragId) : undefined);
    }

    setDragId(null);
    setDropZone(null);
  };

  // Kök blokları (blockOrder sırasıyla) TERS çevirip (en önde/frontmost
  // en üstte gösterilir, mevcut davranış korunur) her CONTAINER'ın
  // childOrder'ını (DÜZ sırayla, flex akışıyla AYNI) altına recursive
  // ekler — tek düz `<li>` listesi, girinti derinlikle ifade edilir
  // (ayrı `<ul>` iç içeliği YOK, drag/drop mantığı tüm satırlarda aynı).
  const flattenLayers = (ids, depth) =>
    ids.flatMap((id) => {
      const b = blocksById[id];
      if (!b) return [];
      const row = { block: b, depth };
      if (b.componentType === 'CONTAINER') return [row, ...flattenLayers(b.childOrder ?? [], depth + 1)];
      return [row];
    });

  const layerRows = flattenLayers(
    blocks.map((b) => b.id).slice().reverse(),
    0
  );

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
          {hasHistory && <span className={styles.leftPanel__railBadge} aria-hidden="true" />}
        </button>
        <button type="button" className={styles.leftPanel__railIcon} data-active={panelTab === 'library' || undefined} title="Kütüphane" aria-label="Kütüphane" onClick={() => toggleTab('library')}>
          <IconBookmark />
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
              <p className={styles.leftPanel__hint}>Bir satırı başka birinin ortasına bırak → gruplar (container'a sarar); üst/alt kenarına bırak → sıralar.</p>
              {blocks.length === 0 && <p className={styles.leftPanel__empty}>No blocks yet</p>}
              <ul className={styles.leftPanel__list}>
                {layerRows.map(({ block, depth }) => (
                  <li
                    key={block.id}
                    className={styles.leftPanel__item}
                    style={{ paddingLeft: `calc(var(--space-sm) + ${depth * 14}px)` }}
                    data-selected={selectedId === block.id || undefined}
                    data-drop-zone={dropZone?.id === block.id ? dropZone.zone : undefined}
                    draggable={renamingId !== block.id}
                    onDragStart={(e) => {
                      e.stopPropagation();
                      setDragId(block.id);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (dragId && dragId !== block.id) setDropZone({ id: block.id, zone: zoneFromPointer(e) });
                    }}
                    onDragLeave={() => setDropZone((z) => (z?.id === block.id ? null : z))}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleLayerDrop(block.id, zoneFromPointer(e));
                    }}
                    onDragEnd={() => {
                      setDragId(null);
                      setDropZone(null);
                    }}
                    onClick={() => onSelectBlock(block.id)}
                  >
                    {renamingId === block.id ? (
                      <input
                        type="text"
                        autoFocus
                        className={styles.leftPanel__itemNameInput}
                        defaultValue={block.name ?? ''}
                        placeholder={block.componentType}
                        onClick={(e) => e.stopPropagation()}
                        onBlur={(e) => {
                          onRenameBlock(block.id, e.target.value.trim() || null);
                          setRenamingId(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.currentTarget.blur();
                          if (e.key === 'Escape') setRenamingId(null);
                        }}
                      />
                    ) : (
                      <span className={styles.leftPanel__itemType} onDoubleClick={(e) => { e.stopPropagation(); setRenamingId(block.id); }}>
                        {block.name || block.componentType}
                      </span>
                    )}
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
                ))}
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
              <CodegenPanel
                orderedBlocks={blocks}
                blocksById={blocksById}
                canvasWidths={canvasWidths}
                canvasHeights={canvasHeights}
                referenceImage={referenceImage}
                onReferenceImage={onReferenceImage}
                blocksPath={blocksPath}
                blocksForGenerate={blocksForGenerate}
              />
            </>
          )}

          {panelTab === 'history' && (
            <>
              <span className={styles.leftPanel__wideHead}>Build Geçmişi</span>
              <BuildHistoryPanel builds={builds} loadingBuilds={loadingBuilds} onRestore={onRestoreBuild} />
              <span className={styles.leftPanel__wideHead}>Üretilen Component'ler</span>
              <GeneratedHistoryPanel generated={generated} loadingGenerated={loadingGenerated} onRestore={onRestoreGenerated} />
              <span className={styles.leftPanel__wideHead}>Backend'e Kaydet Geçmişi</span>
              <WritebackHistoryPanel blocks={blocks} onRestoreBlockContent={onRestoreBlockContent} />
            </>
          )}

          {panelTab === 'library' && (
            <>
              <span className={styles.leftPanel__wideHead}>Kütüphane</span>
              <p className={styles.leftPanel__hint}>
                ContextPanel'deki yer imi ikonuyla kaydettiğin bloklar (bir CONTAINER'sa TÜM alt-ağacıyla) burada listelenir. Bir
                satıra tıklamak onu araç olarak seçer — tuvale her zamanki gibi sürükleyerek yerleştir.
              </p>
              {libraryEntries.length === 0 && <p className={styles.leftPanel__empty}>Henüz kaydedilmiş blok yok</p>}
              <ul className={styles.leftPanel__list}>
                {libraryEntries.map((entry) => {
                  const Icon = TOOL_ICONS[entry.componentType];
                  const childCount = entry.children?.length ?? 0;
                  return (
                    <li
                      key={entry.id}
                      className={styles.leftPanel__item}
                      data-selected={activePreset?.key === entry.id || undefined}
                      onClick={() => onSelectPreset({ ...entry, key: entry.id, label: entry.name })}
                    >
                      {Icon && <Icon width={14} height={14} />}
                      <input
                        type="text"
                        className={styles.leftPanel__itemNameInput}
                        value={entry.name}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => renameLibraryBlock(entry.id, e.target.value)}
                      />
                      {childCount > 0 && <span className={styles.leftPanel__itemHint}>{childCount}</span>}
                      <button
                        type="button"
                        className={styles.leftPanel__itemAction}
                        title="Sil"
                        aria-label="Sil"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeLibraryBlock(entry.id);
                        }}
                      >
                        <IconTrash width={14} height={14} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      )}
    </aside>
  );
}
