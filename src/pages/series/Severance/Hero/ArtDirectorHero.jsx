import { useEffect, useState } from 'react';
import { fetchProductionById } from '../../../../shared/api/productions';
import { resolveGenreNames } from '../../../../shared/api/genres';
import styles from './ArtDirectorHero.module.css';

export default function ArtDirectorHero() {
  const [series, setSeries] = useState(null);
  const [genreNames, setGenreNames] = useState([]);

  useEffect(() => {
    fetchProductionById('series', 7).then(setSeries);
  }, []);

  useEffect(() => {
    if (!series?.genreIds?.length) return;
    let cancelled = false;
    resolveGenreNames(series.genreIds).then((names) => {
      if (!cancelled) setGenreNames(names);
    });
    return () => { cancelled = true; };
  }, [series]);

  if (!series) return null;

  const year = series?.firstAirDate ? new Date(series.firstAirDate).getFullYear() : '';
  const editorialHook = "Ateş ve kanın gölgesinde yazılan sonlar..."; 

  return (
    <section className={styles.heroContainer}>
      {/* 1. Saf Arka Plan (Örtücü ağır gradient yok) */}
      <img className={styles.backdropImage} src={series.coverImageUrl} alt={series.title} />
      
      {/* 2. Köşe Vignette'leri (Sadece metinlerin arkasını zarifçe karartır) */}
      <div className={styles.vignetteBottom}></div>
      <div className={styles.vignetteLeft}></div>

      {/* 3. Ana Arayüz Katmanı */}
      <div className={styles.uiLayer}>
        
        {/* SOL ORTA: Anıtsal Tipografi */}
        <div className={styles.titleArea}>
          <h1 className={styles.monumentalTitle}>{series.title}</h1>
          <p className={styles.hookText}>{editorialHook}</p>
        </div>

        {/* SOL ALT: Minimalist Buton */}
        <div className={styles.bottomLeft}>
          <button className={styles.playButton}>
            <div className={styles.playCircle}>
               <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            </div>
            <span>Fragmanı İzle</span>
          </button>
        </div>

        {/* SAĞ ORTA/ALT: Yüzen Cam Panel (Makale İndeksi) */}
        <div className={styles.floatingGlassPanel}>
          <div className={styles.panelHeader}>
            <span>Yazarın Masası</span>
            <div className={styles.line}></div>
          </div>
          
          <div className={styles.articleItem}>
            <span className={styles.articleNum}>01</span>
            <div className={styles.articleTexts}>
              <h4>Kusursuz Distopya</h4>
              <p>Ana İnceleme</p>
            </div>
          </div>
          <div className={styles.articleItem}>
            <span className={styles.articleNum}>02</span>
            <div className={styles.articleTexts}>
              <h4>Karakter Anatomisi</h4>
              <p>Derin Analiz</p>
            </div>
          </div>
        </div>

        {/* SAĞ ALT: Mikro Veri Şeridi (Edge Framing) */}
        <div className={styles.bottomRightEdge}>
          <div className={styles.microData}>
            <span className={styles.dataLabel}>YIL</span>
            <span className={styles.dataValue}>{year}</span>
          </div>
          <div className={styles.microData}>
            <span className={styles.dataLabel}>IMDb</span>
            <span className={styles.dataValue}>{series.externalRating}</span>
          </div>
          <div className={styles.microData}>
            <span className={styles.dataLabel}>TÜR</span>
            <span className={styles.dataValue}>{genreNames.slice(0,2).join(', ')}</span>
          </div>
        </div>

      </div>
    </section>
  );
}
