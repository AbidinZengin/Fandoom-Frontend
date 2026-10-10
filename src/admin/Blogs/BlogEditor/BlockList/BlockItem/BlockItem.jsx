import { useRef, useState } from 'react';
import { uploadImage } from '../../../../../shared/api/media';
import { TextBlockField } from '../../../../../pages/Admin/BlogEditor/BlockList/BlockItem/TextBlockField';
import blogPostStyles from '../../../../../pages/Blog/BlogPost/BlogPost.module.css';
import controls from '../../../../controls.module.css';
import Field from '../../../../Field/Field';
import IconButton from '../../../../IconButton/IconButton';
import { ArrowDownIcon, ArrowUpIcon, TrashIcon } from '../../../../icons';
import { BLOCK_TYPE_LABELS, BLOCK_TYPES } from '../../BlogEditor.data';
import styles from './BlockItem.module.css';

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
      setUploadError(err.message || 'Yükleme başarısız');
    } finally {
      setUploading(false);
    }
  };

  const isImage = block.blockType === 'IMAGE';

  return (
    <article className={styles['blockItem']} data-type={block.blockType}>
      <header className={styles['blockItem__header']}>
        <div className={styles['blockItem__meta']}>
          <Field label="Tür">
            <select
              className={controls.control}
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
          </Field>
          <Field label="Scene key (zorunlu)">
            <input
              className={controls.control}
              type="text"
              value={block.sceneKey}
              onChange={(e) => onChange({ ...block, sceneKey: e.target.value })}
              onBlur={onCommit}
              placeholder="ör. scene-intro"
            />
          </Field>
        </div>

        <div className={styles['blockItem__actions']}>
          <IconButton label="Yukarı taşı" onClick={onMoveUp} disabled={isFirst}>
            <ArrowUpIcon />
          </IconButton>
          <IconButton label="Aşağı taşı" onClick={onMoveDown} disabled={isLast}>
            <ArrowDownIcon />
          </IconButton>
          {confirmingRemove ? (
            <span className={styles['blockItem__confirm']}>
              Silinsin mi?
              <button type="button" className={styles['blockItem__confirmDelete']} onClick={onRemove}>
                Sil
              </button>
              <button type="button" className={styles['blockItem__confirmCancel']} onClick={() => setConfirmingRemove(false)}>
                Vazgeç
              </button>
            </span>
          ) : (
            <IconButton label="Bloğu sil" onClick={() => setConfirmingRemove(true)} danger>
              <TrashIcon />
            </IconButton>
          )}
        </div>
      </header>

      {isImage ? (
        <div className={styles['blockItem__image']}>
          <div className={styles['blockItem__imagePreview']} data-empty={!block.imageUrl || undefined}>
            {block.imageUrl ? (
              <img className={blogPostStyles.story__figureImage} src={block.imageUrl} alt="" />
            ) : (
              <span>Görsel yok</span>
            )}
            {uploading && <span className={styles['blockItem__spinner']} aria-hidden="true" />}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className={styles['blockItem__fileInput']}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <button
            type="button"
            className={styles['blockItem__imageChange']}
            onClick={() => fileInputRef.current?.click()}
          >
            {block.imageUrl ? 'Görseli değiştir' : 'Görsel seç'}
          </button>
          {uploadError && <span className={styles['blockItem__error']}>{uploadError}</span>}

          <div className={styles['blockItem__columns']}>
            <Field label="Alt metin (EN)">
              <input
                className={controls.control}
                type="text"
                value={block.imageAlt ?? ''}
                onChange={(e) => onChange({ ...block, imageAlt: e.target.value })}
                onBlur={onCommit}
              />
            </Field>
            <Field label="Alt metin (TR)">
              <input
                className={controls.control}
                type="text"
                value={block.imageAltTr ?? ''}
                onChange={(e) => onChange({ ...block, imageAltTr: e.target.value })}
                onBlur={onCommit}
              />
            </Field>
          </div>
        </div>
      ) : (
        <div className={styles['blockItem__columns']}>
          <div className={styles['blockItem__text']}>
            <span className={styles['blockItem__textLabel']}>İçerik (EN)</span>
            <TextBlockField
              className={blogPostStyles.story__body}
              placeholder="Metni İngilizce yaz…"
              value={block.content}
              onChange={(content) => onChange({ ...block, content })}
              onBlur={onCommit}
            />
          </div>
          <div className={styles['blockItem__text']}>
            <span className={styles['blockItem__textLabel']}>İçerik (TR)</span>
            <TextBlockField
              className={blogPostStyles.story__body}
              placeholder="Metni Türkçe yaz…"
              value={block.contentTr}
              onChange={(contentTr) => onChange({ ...block, contentTr })}
              onBlur={onCommit}
            />
          </div>
        </div>
      )}
    </article>
  );
}
