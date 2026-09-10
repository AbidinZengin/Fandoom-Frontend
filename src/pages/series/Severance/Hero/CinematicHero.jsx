import { useEffect, useState } from 'react';
import { fetchProductionById } from '../../../../shared/api/productions';
import { resolveGenreNames } from '../../../../shared/api/genres';
import styles from './CinematicHero.module.css';

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="4.5" y1="12" x2="19" y2="12" />
      <polyline points="13.5 6.5 19.5 12 13.5 17.5" />
    </svg>
  );
}

export default function CinematicHero() {
  const [series, setSeries] = useState(null);
  const [genreNames, setGenreNames] = useState([]);

  useEffect(() => {
    // API endpointiniz aynı kalıyor
    fetchProductionById('series', 7).then(setSeries);
  }, []);

  useEffect(() => {
    if (!series?.genreIds?.length) {
      setGenreNames([]);
      return;
    }
    let cancelled = false;
    resolveGenreNames(series.genreIds).then((names) => {
      if (!cancelled) setGenreNames(names);
    });
    return () => {
      cancelled = true;
    };
  }, [series]);

  if (!series) return null;

  const year = series?.firstAirDate ? new Date(series.firstAirDate).getFullYear() : '';
  
  // Editorial hook yazısı (bunu daha sonra statik veya dinamik verebilirsiniz)
  const editorialHook = "Ateş ve kanın gölgesinde, tahtın varisleri kendi sonlarını yazıyor..."; 

  return (
    <section className={styles.heroContainer}>
      <img className={styles.backdropImage} src={series.coverImageUrl} alt={series.title} />
      
      <div className={styles.gradientOverlay}></div>

      <div className={styles.contentWrapper}>
        
        <div className={styles.leftColumn}>
          <div className={styles.badgeRow}>
            <span className={styles.glassBadge}>{year}</span>
            <span className={styles.glassBadge}>★ {series.externalRating}</span>
            <span className={styles.genres}>{genreNames.join(' · ')}</span>
          </div>

          <h1 className={styles.title}>{series.title}</h1>
          <p className={styles.hookText}>{editorialHook}</p>
          <p className={styles.synopsisClamp}>{series.synopsis}</p>

          <div className={styles.ctaGroup}>
            <button className={styles.primaryBtn}>
              <span className={styles.playIcon}>▶</span> Fragmanı İzle
            </button>
            <button className={styles.secondaryBtn}>
              Keşfet <ArrowIcon />
            </button>
          </div>
        </div>

        <div className={styles.rightColumn}>
          <div className={styles.glassPanel}>
            <div className={styles.panelHeader}>
              <span className={styles.panelTitle}>Yazarın Notları</span>
              <div className={styles.line}></div>
            </div>
            
            <div className={styles.cardList}>
              <div className={styles.articleCard}>
                <div className={styles.articleNumber}>01</div>
                <div className={styles.articleInfo}>
                  <h4>Kusursuz Bir Distopya İnşası</h4>
                  <span>Ana İnceleme</span>
                </div>
              </div>
              
              <div className={styles.articleCard}>
                <div className={styles.articleNumber}>02</div>
                <div className={styles.articleInfo}>
                  <h4>Karakterlerin Derinliği</h4>
                  <span>Analiz</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
