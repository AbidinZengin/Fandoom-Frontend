import { useEffect, useRef, useState } from 'react';
import styles from './PosterImage.module.css';

// maxresdefault her videoda yok: YouTube bazılarında 404, bazılarında 120px'lik
// gri placeholder (200) döner — ikisi de 16:9 olan mqdefault'a düşürülür.
// hqdefault/sddefault 4:3'tür ve içine siyah bantlar gömülüdür, cover ile
// kırpılamaz.
const posterUrl = (id) => `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
const posterFallbackUrl = (id) => `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;
const PLACEHOLDER_WIDTH = 120;

// Kapak görseli: yüklenene kadar koyu zemin durur, sonra fade-in (skeleton yok).
// Video değişince üst bileşen `key` ile yeniden mount eder.
export default function PosterImage({ youtubeId, className }) {
  const [src, setSrc] = useState(() => posterUrl(youtubeId));
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef(null);

  const handleLoad = (img) => {
    const fallback = posterFallbackUrl(youtubeId);
    if (img.naturalWidth <= PLACEHOLDER_WIDTH && src !== fallback) setSrc(fallback);
    else setLoaded(true);
  };

  // Önbellekten gelen görselde onLoad tetiklenmeyebilir.
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) handleLoad(imgRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <img
      ref={imgRef}
      className={`${styles.poster} ${className ?? ''}`}
      data-loaded={loaded || undefined}
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      draggable={false}
      onLoad={(e) => handleLoad(e.currentTarget)}
      onError={() => {
        const fallback = posterFallbackUrl(youtubeId);
        if (src !== fallback) setSrc(fallback);
      }}
    />
  );
}
