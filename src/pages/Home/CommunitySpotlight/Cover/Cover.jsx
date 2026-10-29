import { useState } from 'react';
import styles from './Cover.module.css';

// Görsel yüklenene kadar koyu zemin, sonra fade-in (skeleton/blur-up yok).
// visible=false katmanlar yüklü olsa da görünmez (crossfade'in öbür yüzü).
// Konum/boyut çağırandan gelen className ile verilir; onLoad doğal ölçüyü
// (naturalWidth/Height) okumak isteyen çağıran içindir.
export function Cover({ src, className = '', visible = true, onLoad }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <img
      className={`${styles.cover} ${className}`}
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      data-loaded={loaded || undefined}
      data-visible={visible || undefined}
      onLoad={(e) => {
        setLoaded(true);
        onLoad?.(e);
      }}
    />
  );
}
