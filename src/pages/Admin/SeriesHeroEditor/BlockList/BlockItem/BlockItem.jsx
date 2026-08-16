import { useRef, useState } from 'react';
import { uploadImage } from '../../../../../shared/api/media';
import { EDITABLE_TEXT_TYPES } from '../../SeriesHeroEditor.data';
import { TextBlockField } from '../../../BlogEditor/BlockList/BlockItem/TextBlockField';
import styles from './BlockItem.module.css';

// Figma/Excalidraw tarzı sadeleştirme (2026-08, plan Task 8): dişli
// ikonu + floating "advanced" popup KALKTI — tüm stil/animasyon/Custom
// CSS kontrolleri artık seçili blokta sağda beliren PropertiesPanel'de
// (bkz. ../../PropertiesPanel/PropertiesPanel.jsx). Bu component sadece
// canvas ÜZERİNDEKİ doğrudan manipülasyonu taşır: sürükle/boyutlandır,
// hizala kısayolları, içerik (görsel yükleme / TR-EL metin) doğrudan
// yerinde düzenlenir (in-place editing, gerçek tasarım araçlarının
// deseni).
// Kullanıcı kararı: TR/EN ayrımı YOK — tek serbest metin alanı, dili
// admin kendi yönetir.
const TEXT_PLACEHOLDER = {
  TITLE: 'Başlık…',
  SYNOPSIS: 'Özet…',
  BUTTON: 'Buton metni…',
  BOX: 'Metin…',
};

const RESIZE_HANDLES = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

// heroBlockRenderers.jsx'teki parseCustomCss ile AYNI mantık (bilerek
// kopya — editör bir slot'un render dosyasına bağımlı olmamalı, bkz.
// SeriesHeroEditor.jsx'teki mutasyon helper'ları için de aynı gerekçe).
// Kullanıcı isteği: "hepsini seçilebilir... canlı görebileceğim şekilde" —
// PropertyMenu/PropertiesPanel'den eklenen HERHANGİ bir stil, gerçek
// sayfadaki mergedStyle() ile birebir aynı şekilde burada da canlı önizlenir.
function parseCustomCss(customCss) {
  if (!customCss) return {};
  const result = {};
  customCss.split(';').forEach((decl) => {
    const idx = decl.indexOf(':');
    if (idx === -1) return;
    const key = decl.slice(0, idx).trim();
    const value = decl.slice(idx + 1).trim();
    if (key && value) result[key] = value;
  });
  return result;
}

export function BlockItem({ block, isColliding, isSelected, onChange, onCommit, onStartDrag, onStartResize, onContextMenu }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  const alignBlock = (align) => {
    const x = align === 'left' ? 0 : align === 'right' ? 100 - block.width : (100 - block.width) / 2;
    onChange({ ...block, x });
    onCommit();
  };

  const isLeftAligned = Math.abs(block.x) < 0.5;
  const isCenterAligned = Math.abs(block.x - (100 - block.width) / 2) < 0.5;
  const isRightAligned = Math.abs(block.x - (100 - block.width)) < 0.5;

  const handleFile = async (file) => {
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const { url } = await uploadImage(file);
      onChange({ ...block, content: { ...block.content, imageUrl: url } });
      onCommit();
    } catch (err) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const patchContent = (patch) => onChange({ ...block, content: { ...block.content, ...patch } });

  const isEditableText = EDITABLE_TEXT_TYPES.has(block.type);
  // Sabit kontrollerin (radius/blur/font/background) YANI SIRA sağ-tık
  // menüsünden eklenen her özellik de buraya dahil — tek kaynak block.styles.
  const liveExtraStyle = { ...(block.styles ?? {}), ...parseCustomCss(block.customCss) };

  return (
    <div
      data-block-key={block._key}
      className={styles.blockItem}
      data-type={block.type}
      data-selected={isSelected || undefined}
      data-colliding={isColliding || undefined}
      style={{
        left: `${block.x}%`,
        top: `${block.y}%`,
        width: `${block.width}%`,
        height: block.height != null ? `${block.height}%` : 'auto',
      }}
      onPointerDown={onStartDrag}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu?.(e.clientX, e.clientY);
      }}
    >
      {isSelected && (
        <div className={styles.blockItem__alignGroup} onPointerDown={(e) => e.stopPropagation()}>
          <button type="button" className={styles.blockItem__align} data-active={isLeftAligned || undefined} aria-label="Align left" title="Align left" onClick={() => alignBlock('left')}>
            ⇤
          </button>
          <button type="button" className={styles.blockItem__align} data-active={isCenterAligned || undefined} aria-label="Center" title="Center horizontally" onClick={() => alignBlock('center')}>
            ↔
          </button>
          <button type="button" className={styles.blockItem__align} data-active={isRightAligned || undefined} aria-label="Align right" title="Align right" onClick={() => alignBlock('right')}>
            ⇥
          </button>
        </div>
      )}

      {(block.type === 'IMAGE' || block.type === 'LOGO') && (
        <div className={styles.blockItem__figure} style={liveExtraStyle}>
          {block.content?.imageUrl ? (
            <img className={styles.blockItem__image} src={block.content.imageUrl} alt="" />
          ) : (
            <div className={styles.blockItem__imagePlaceholder}>No image</div>
          )}
          {uploading && <div className={styles.blockItem__spinner} aria-hidden="true" />}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className={styles.blockItem__fileInput}
            onPointerDown={(e) => e.stopPropagation()}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <button
            type="button"
            className={styles.blockItem__imageChange}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => fileInputRef.current?.click()}
          >
            {block.content?.imageUrl ? 'Change' : 'Choose image'}
          </button>

          {uploadError && <span className={styles.blockItem__error}>{uploadError}</span>}
        </div>
      )}

      {/* META BİLEREK yazılabilir DEĞİL — Series verisinden otomatik. */}
      {block.type === 'META' && (
        <div className={styles.blockItem__placeholder} data-placeholder-type="META" style={liveExtraStyle}>
          2008 · 5 Seasons · Drama (auto)
        </div>
      )}

      {isEditableText && (
        <div
          className={styles.blockItem__text}
          data-text-type={block.type}
          style={{
            background: block.type === 'BOX' ? block.styles?.background ?? '#000000' : undefined,
            ...liveExtraStyle,
          }}
        >
          <TextBlockField
            className={styles.blockItem__textField}
            placeholder={TEXT_PLACEHOLDER[block.type]}
            value={block.content?.text ?? ''}
            onChange={(text) => patchContent({ text })}
            onBlur={onCommit}
          />
        </div>
      )}

      {isSelected &&
        RESIZE_HANDLES.map((dir) => (
          <div
            key={dir}
            className={`${styles.blockItem__resizeHandle} ${styles[`blockItem__resizeHandle--${dir}`]}`}
            onPointerDown={(e) => {
              e.stopPropagation();
              onStartResize(dir, e);
            }}
            aria-hidden="true"
          />
        ))}
    </div>
  );
}
