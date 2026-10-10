import { useRef, useState } from 'react';
import { uploadImage } from '../../../shared/api/media';
import controls from '../../controls.module.css';
import styles from './ImageUrlInput.module.css';

// Görsel URL alanı: önizleme + elle URL + dosya yükleme (Cloudinary).
// Dosya seçilir seçilmez yüklenir ve dönen URL alana yazılır.
export default function ImageUrlInput({ value, onChange, max }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = async (file) => {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const { url } = await uploadImage(file);
      onChange(url);
    } catch (err) {
      setError(err.message || 'Yükleme başarısız');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles['imageUrlInput']}>
      <div className={styles['imageUrlInput__preview']} data-empty={!value || undefined}>
        {value ? <img src={value} alt="" /> : <span>Görsel yok</span>}
        {uploading && <span className={styles['imageUrlInput__spinner']} aria-hidden="true" />}
      </div>

      <div className={styles['imageUrlInput__side']}>
        <input
          className={controls.control}
          type="url"
          placeholder="https://…"
          maxLength={max}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className={styles['imageUrlInput__file']}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <button type="button" className={styles['imageUrlInput__button']} onClick={() => inputRef.current?.click()}>
          Dosya yükle
        </button>
        {error && <span className={styles['imageUrlInput__error']}>{error}</span>}
      </div>
    </div>
  );
}
