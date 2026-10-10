import { useRef, useState } from 'react';
import { uploadImage } from '../../../../shared/api/media';
import controls from '../../../controls.module.css';
import styles from './ImageField.module.css';

// Blog kapak görseli yükleyici. Dosya seçilir seçilmez (Kaydet'i beklemeden)
// yüklenir; Cloudinary yetim-kalma riski yok (backend PUT/DELETE sırasında
// eski görselleri otomatik temizliyor).
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
      setError(err.message || 'Yükleme başarısız');
    } finally {
      setUploading(false);
    }
  };

  const displayUrl = imageUrl ?? preview;

  return (
    <div className={styles['imageField']}>
      <div className={styles['imageField__preview']} data-empty={!displayUrl || undefined}>
        {displayUrl ? <img src={displayUrl} alt="" /> : <span>Görsel yok</span>}
        {uploading && <span className={styles['imageField__spinner']} aria-hidden="true" />}
      </div>

      <div className={styles['imageField__controls']}>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className={styles['imageField__fileInput']}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <button type="button" className={styles['imageField__button']} onClick={() => inputRef.current?.click()}>
          {displayUrl ? 'Görseli değiştir' : 'Görsel seç'}
        </button>

        {error && <span className={styles['imageField__error']}>{error}</span>}

        <input
          type="text"
          className={controls.control}
          placeholder="Alt metin (EN)"
          aria-label="Kapak görseli alt metni (EN)"
          value={imageAlt ?? ''}
          onChange={(e) => onChange({ imageUrl, imageAlt: e.target.value })}
        />
      </div>
    </div>
  );
}
