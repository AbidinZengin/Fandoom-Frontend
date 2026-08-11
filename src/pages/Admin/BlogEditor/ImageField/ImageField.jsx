import { useRef, useState } from 'react';
import { uploadImage } from '../../../../shared/api/media';
import styles from './ImageField.module.css';

// Genel amaçlı görsel yükleyici — hem blog kapak görseli (MetaPanel) hem
// IMAGE bloğu (ImageBlockField) tarafından paylaşılır. Dosya seçilir
// seçilmez (Kaydet'i beklemeden) yüklenir; Cloudinary yetim-kalma riski
// yok (backend PUT/DELETE sırasında eski görselleri otomatik temizliyor).
export function ImageField({ imageUrl, imageAlt, onChange }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleFile = async (file) => {
    if (!file) return;
    setError(null);
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const { url } = await uploadImage(file);
      onChange({ imageUrl: url, imageAlt: imageAlt ?? '' });
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const displayUrl = imageUrl ?? preview;

  return (
    <div className={styles.imageField}>
      <div className={styles.imageField__preview} data-empty={!displayUrl || undefined}>
        {displayUrl ? <img src={displayUrl} alt="" /> : <span>No image</span>}
        {uploading && <span className={styles.imageField__spinner} aria-hidden="true" />}
      </div>

      <div className={styles.imageField__controls}>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className={styles.imageField__fileInput}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <button type="button" className={styles.imageField__button} onClick={() => inputRef.current?.click()}>
          {displayUrl ? 'Change image' : 'Choose image'}
        </button>

        {error && (
          <span className={styles.imageField__error}>
            {error}
            <button type="button" onClick={() => inputRef.current?.click()}>
              Retry
            </button>
          </span>
        )}

        <input
          type="text"
          className={styles.imageField__altInput}
          placeholder="Alt text"
          value={imageAlt ?? ''}
          onChange={(e) => onChange({ imageUrl, imageAlt: e.target.value })}
        />
      </div>
    </div>
  );
}
