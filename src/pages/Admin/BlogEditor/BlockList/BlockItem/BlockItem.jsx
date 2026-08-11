import { useEffect, useRef, useState } from 'react';
import blogPostStyles from '../../../../Blog/BlogPost/BlogPost.module.css';
import { uploadImage } from '../../../../../shared/api/media';
import { ANIMATION_OPTIONS, FONT_OPTIONS } from '../../BlogEditor.data';
import { TextBlockField } from './TextBlockField';
import styles from './BlockItem.module.css';

// Gerçek blog sayfasının kendi CSS module'ünü (blogPostStyles) doğrudan
// içe aktarıp tipografi/renk için aynı class'ları kullanır — kopya stil
// değil, AYNI stylesheet (WYSIWYG). Geometri (width/grid-column) artık
// serbest canvas'ın kendi x/y/width/height'inden geldiği için figure/quote'un
// varsayılan boyutlandırması burada BİLEREK ezilir (BlockItem.module.css,
// tek belgelenmiş istisna).
const TEXT_CLASS = {
  HEADING: blogPostStyles.story__heading,
  PARAGRAPH: blogPostStyles.story__body,
};

const FONT_CLASS = {
  GOT: styles.fontGot,
  FRAUNCES: styles.fontFraunces,
  MONTSERRAT: styles.fontMontserrat,
};

const RESIZE_HANDLES = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

// Sürükleme/boyutlandırma HESABI artık BlockList'te (kardeş bloklara göre
// hizalama kılavuzları için canvas geneli gerekir) — bu component sadece
// pointerdown'ı yukarı iletir. Bloğun HERHANGİ bir yerine bas-sürükle taşır
// (ayrı bir tutamaç YOK — kullanıcı düzeltmesi); BlockList'teki hareket
// eşiği basit tıklamayla (metin imleci konumlama) sürüklemeyi ayırt eder.
export function BlockItem({
  block,
  isColliding,
  onChange,
  onRemove,
  onCommit,
  onStartDrag,
  onStartResize,
  onBringToFront,
  onSendToBack,
  onDuplicate,
}) {
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);
  const advancedRef = useRef(null);
  const gearRef = useRef(null);

  // Panel dışına tıklayınca kapanır — önceden sadece dişliye tekrar
  // basınca kapanıyordu, kullanıcı bunu "yok olmuyor" diye bildirdi.
  useEffect(() => {
    if (!advancedOpen) return undefined;
    const onDocPointerDown = (e) => {
      if (advancedRef.current?.contains(e.target) || gearRef.current?.contains(e.target)) return;
      setAdvancedOpen(false);
    };
    document.addEventListener('pointerdown', onDocPointerDown);
    return () => document.removeEventListener('pointerdown', onDocPointerDown);
  }, [advancedOpen]);

  // Hizalama kısayolları — serbest sürüklemenin insan gözüyle kaçırabileceği
  // hassas ortalama/kenar hizalamasını tek tıkla garanti eder (kullanıcı
  // isteği: "hakimiyet editörde olsa da oranları kaçırabilir bunu engelle").
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
      onChange({ ...block, imageUrl: url });
      onCommit();
    } catch (err) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const fontClass = block.fontFamily ? FONT_CLASS[block.fontFamily] : null;
  const fontScaleStyle = { '--block-font-scale': block.fontScale ?? 1 };
  const textClassName = [TEXT_CLASS[block.blockType], fontClass].filter(Boolean).join(' ');
  const quoteClassName = [styles.blockItem__quoteText, fontClass].filter(Boolean).join(' ');

  return (
    <div
      data-block-key={block._key}
      className={styles.blockItem}
      data-type={block.blockType}
      data-colliding={isColliding || undefined}
      style={{
        left: `${block.x}%`,
        top: `${block.y}%`,
        width: `${block.width}%`,
        height: block.height != null ? `${block.height}%` : 'auto',
      }}
      onPointerDown={onStartDrag}
    >
      <div className={styles.blockItem__overlay}>
        <div className={styles.blockItem__alignGroup}>
          <button
            type="button"
            className={styles.blockItem__align}
            data-active={isLeftAligned || undefined}
            aria-label="Align left"
            title="Align left"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => alignBlock('left')}
          >
            ⇤
          </button>
          <button
            type="button"
            className={styles.blockItem__align}
            data-active={isCenterAligned || undefined}
            aria-label="Center"
            title="Center horizontally"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => alignBlock('center')}
          >
            ↔
          </button>
          <button
            type="button"
            className={styles.blockItem__align}
            data-active={isRightAligned || undefined}
            aria-label="Align right"
            title="Align right"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => alignBlock('right')}
          >
            ⇥
          </button>
        </div>
        <button
          ref={gearRef}
          type="button"
          className={styles.blockItem__gear}
          aria-label="Settings"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => setAdvancedOpen((v) => !v)}
        >
          ⚙
        </button>
        {confirmingRemove ? (
          <span className={styles.blockItem__confirmRemove} onPointerDown={(e) => e.stopPropagation()}>
            Are you sure?
            <button type="button" onClick={onRemove}>
              Delete
            </button>
            <button type="button" onClick={() => setConfirmingRemove(false)}>
              Cancel
            </button>
          </span>
        ) : (
          <button
            type="button"
            className={styles.blockItem__remove}
            aria-label="Delete block"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setConfirmingRemove(true)}
          >
            ×
          </button>
        )}
      </div>

      {advancedOpen && (
        <div ref={advancedRef} className={styles.blockItem__advanced} onPointerDown={(e) => e.stopPropagation()}>
          <label>
            <span>Animation</span>
            <select
              value={block.animation ?? 'FADE_UP'}
              onChange={(e) => {
                onChange({ ...block, animation: e.target.value });
                onCommit();
              }}
            >
              {ANIMATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          {block.blockType !== 'IMAGE' && (
            <>
              <label>
                <span>Font</span>
                <select
                  value={block.fontFamily ?? ''}
                  onChange={(e) => {
                    onChange({ ...block, fontFamily: e.target.value || null });
                    onCommit();
                  }}
                >
                  <option value="">Default</option>
                  {FONT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Text size ({Math.round((block.fontScale ?? 1) * 100)}%)</span>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.05"
                  value={block.fontScale ?? 1}
                  onChange={(e) => onChange({ ...block, fontScale: Number(e.target.value) })}
                  onPointerUp={onCommit}
                />
              </label>
              {block.blockType !== 'HEADING' && (
                <label className={styles.blockItem__checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={block.dropCap ?? false}
                    onChange={(e) => {
                      onChange({ ...block, dropCap: e.target.checked });
                      onCommit();
                    }}
                  />
                  <span>Drop cap (large first letter)</span>
                </label>
              )}
            </>
          )}
          <div className={styles.blockItem__advancedRow}>
            <button type="button" onClick={onBringToFront}>
              Bring to front
            </button>
            <button type="button" onClick={onSendToBack}>
              Send to back
            </button>
          </div>
          <div className={styles.blockItem__advancedRow}>
            <button type="button" onClick={onDuplicate}>
              Duplicate (Ctrl+D)
            </button>
          </div>
        </div>
      )}

      {block.blockType === 'IMAGE' && (
        <figure className={`${blogPostStyles.story__figure} ${styles.blockItem__figure}`}>
          {block.imageUrl ? (
            <img className={blogPostStyles.story__figureImage} src={block.imageUrl} alt="" />
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
            {block.imageUrl ? 'Change' : 'Choose image'}
          </button>

          <input
            type="text"
            className={`${blogPostStyles.story__figcaption} ${styles.blockItem__captionInput}`}
            data-caption-pos="center"
            placeholder="Alt text / caption"
            value={block.imageAlt ?? ''}
            onPointerDown={(e) => e.stopPropagation()}
            onChange={(e) => onChange({ ...block, imageAlt: e.target.value })}
            onBlur={onCommit}
          />

          {uploadError && <span className={styles.blockItem__error}>{uploadError}</span>}
        </figure>
      )}

      {block.blockType === 'QUOTE' && (
        <blockquote className={`${blogPostStyles.story__quote} ${styles.blockItem__quote}`} style={fontScaleStyle}>
          <span className={blogPostStyles.story__quoteRule} aria-hidden="true" />
          <TextBlockField
            className={quoteClassName}
            placeholder="Quote text…"
            value={block.text}
            onChange={(text) => onChange({ ...block, text })}
            onBlur={onCommit}
          />
        </blockquote>
      )}

      {(block.blockType === 'HEADING' || block.blockType === 'PARAGRAPH') && (
        <TextBlockField
          className={textClassName}
          style={fontScaleStyle}
          placeholder={block.blockType === 'HEADING' ? 'Heading…' : 'Paragraph…'}
          value={block.text}
          onChange={(text) => onChange({ ...block, text })}
          onBlur={onCommit}
        />
      )}

      {RESIZE_HANDLES.map((dir) => (
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
