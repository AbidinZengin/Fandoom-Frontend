import { useRef, useState } from 'react';
import { uploadImage } from '../../../../../shared/api/media';
import { BLOCK_TYPE_LABELS, BLOCK_TYPES } from '../../BlogEditor.data';
import { TextBlockField } from './TextBlockField';
import styles from './BlockItem.module.css';
import blogPostStyles from '../../../../Blog/BlogPost/BlogPost.module.css';

export function BlockItem({
  block,
  onChange,
  onRemove,
  onCommit,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}) {
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

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

  const isImage = block.blockType === 'IMAGE';

  return (
    <div className={styles.blockItem} data-type={block.blockType}>
      <header className={styles.blockItem__header}>
        <div className={styles.blockItem__meta}>
          <label>
            <span>Type</span>
            <select
              value={block.blockType}
              onChange={(e) => {
                onChange({ ...block, blockType: e.target.value });
                onCommit();
              }}
            >
              {BLOCK_TYPES.map((t) => (
                <option key={t} value={t}>
                  {BLOCK_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Scene Key (required)</span>
            <input
              type="text"
              value={block.sceneKey}
              onChange={(e) => onChange({ ...block, sceneKey: e.target.value })}
              onBlur={onCommit}
              placeholder="e.g. scene-intro"
            />
          </label>
        </div>

        <div className={styles.blockItem__actions}>
          <button
            type="button"
            className={styles.blockItem__actionBtn}
            onClick={onMoveUp}
            disabled={isFirst}
            title="Move Up"
          >
            ↑
          </button>
          <button
            type="button"
            className={styles.blockItem__actionBtn}
            onClick={onMoveDown}
            disabled={isLast}
            title="Move Down"
          >
            ↓
          </button>
          {confirmingRemove ? (
            <span className={styles.blockItem__confirmRemove}>
              Are you sure?
              <button type="button" onClick={onRemove}>Delete</button>
              <button type="button" onClick={() => setConfirmingRemove(false)}>Cancel</button>
            </span>
          ) : (
            <button
              type="button"
              className={styles.blockItem__actionBtn}
              onClick={() => setConfirmingRemove(true)}
              title="Delete block"
            >
              ×
            </button>
          )}
        </div>
      </header>

      {isImage ? (
        <figure className={styles.blockItem__figure}>
          {block.imageUrl ? (
            <img className={blogPostStyles.story__figureImage} src={block.imageUrl} alt="" style={{width: '100%', maxHeight: '400px', objectFit: 'contain'}} />
          ) : (
            <div className={styles.blockItem__imagePlaceholder}>No image</div>
          )}
          {uploading && <div className={styles.blockItem__spinner} aria-hidden="true" />}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className={styles.blockItem__fileInput}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <button
            type="button"
            className={styles.blockItem__imageChange}
            onClick={() => fileInputRef.current?.click()}
          >
            {block.imageUrl ? 'Change Image' : 'Choose Image'}
          </button>

          <div className={styles.blockItem__contentTabs}>
            <div className={styles.blockItem__contentArea}>
              <label className={styles.blockItem__meta} style={{marginTop: '1rem'}}>
                <span>Alt Text (EN)</span>
                <input
                  type="text"
                  className={styles.blockItem__captionInput}
                  value={block.imageAlt ?? ''}
                  onChange={(e) => onChange({ ...block, imageAlt: e.target.value })}
                  onBlur={onCommit}
                  placeholder="Alt text"
                />
              </label>
            </div>
            <div className={styles.blockItem__contentArea}>
              <label className={styles.blockItem__meta} style={{marginTop: '1rem'}}>
                <span>Alt Text (TR)</span>
                <input
                  type="text"
                  className={styles.blockItem__captionInput}
                  value={block.imageAltTr ?? ''}
                  onChange={(e) => onChange({ ...block, imageAltTr: e.target.value })}
                  onBlur={onCommit}
                  placeholder="Alt text (TR)"
                />
              </label>
            </div>
          </div>
          {uploadError && <span className={styles.blockItem__error}>{uploadError}</span>}
        </figure>
      ) : (
        <div className={styles.blockItem__contentTabs}>
          <div className={styles.blockItem__contentArea}>
            <span style={{fontSize: 'var(--text-xs)', color: 'var(--fg-muted)'}}>Content (EN)</span>
            <TextBlockField
              className={blogPostStyles.story__body}
              placeholder="Content in English..."
              value={block.content}
              onChange={(content) => onChange({ ...block, content })}
              onBlur={onCommit}
            />
          </div>
          <div className={styles.blockItem__contentArea}>
            <span style={{fontSize: 'var(--text-xs)', color: 'var(--fg-muted)'}}>Content (TR)</span>
            <TextBlockField
              className={blogPostStyles.story__body}
              placeholder="Content in Turkish..."
              value={block.contentTr}
              onChange={(contentTr) => onChange({ ...block, contentTr })}
              onBlur={onCommit}
            />
          </div>
        </div>
      )}
    </div>
  );
}
