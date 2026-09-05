import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchProductionById } from '../../../../shared/api/productions';
import { resolveGenreNames } from '../../../../shared/api/genres';
import styles from './Hero.module.css';

// PageBuilder "Kodu Üret" ile oluşturuldu — bu noktadan sonra normal
// proje kodu, elle düzenlenebilir (GSAP/motion elle eklenir).
// DÜZELTME (manuel): "Explore" ok ikonu — BreakingBad/HouseOfTheDragon
// Hero'sundaki ArrowIcon'un birebir kopyası (kullanıcı isteği: tüm
// dizilerin Hero'sunda Explore butonunda ok ikonu bulunmalı).
function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3.33" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="4.5" y1="12" x2="19" y2="12" />
      <polyline points="13.5 6.5 19.5 12 13.5 17.5" />
    </svg>
  );
}

export default function Hero() {
  const [series7, setSeries7] = useState(null);
  const [genreNames, setGenreNames] = useState([]);

  useEffect(() => {
    fetchProductionById('series', 9).then(setSeries7);
  }, []);

  // genreNames backend'den DÖNMÜYOR (yalnız genreIds) — ProductionDetail/
  // SeriesHero'daki AYNI çözümleme burada da gerekli, aksi halde tür hiç
  // görünmüyordu (kullanıcı raporu, 2026-09-05).
  useEffect(() => {
    if (!series7?.genreIds?.length) {
      setGenreNames([]);
      return undefined;
    }
    let cancelled = false;
    resolveGenreNames(series7.genreIds).then((names) => {
      if (!cancelled) setGenreNames(names);
    });
    return () => {
      cancelled = true;
    };
  }, [series7]);

  // TODO: Replace null with a Skeleton UI if needed.
  if (series7 == null) return null;

  const year = series7?.firstAirDate ? new Date(series7.firstAirDate).getFullYear() : '';

  return (
    <div className={styles.page}>
      <img className={styles.imageBlock1} src={series7?.posterUrl} alt="" />
      <div className={styles.cardWrap}>
        <img className={styles.imageBlock2} src={series7?.coverImageUrl} alt="" />
        <Link to="/series/from" className={styles.brandLogo}>
          <img src="/src/assets/logos/from.webp" alt="From" />
        </Link>
        <p className={styles.textBlock1}>{series7?.title}</p>
        <div className={styles.metaRow}>
          <p className={styles.textBlock2}>{year}</p>
          <p className={styles.textBlock3}>{genreNames.join(' · ')}</p>
        </div>
        <p className={styles.textBlock4}>{series7?.synopsis}</p>
        <div className={styles.logoBlock1}><img src="/src/assets/logos/IMDB_Logo_2016.svg.webp" alt="IMDB Logo 2016.Svg" /></div>
        <p className={styles.textBlock5}>{series7?.externalRating}</p>
        <div className={styles.ctaRow}>
          <button type="button" className={styles.buttonBlock1}>{"▶  Watch Trailer"}</button>
          <button type="button" className={styles.buttonBlock2}>
            {"Explore"} <ArrowIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
