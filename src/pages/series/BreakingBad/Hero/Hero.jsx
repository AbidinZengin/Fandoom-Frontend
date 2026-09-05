import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchProductionById } from '../../../../shared/api/productions';
import { resolveGenreNames } from '../../../../shared/api/genres';
import { Link } from 'react-router-dom';
import styles from './Hero.module.css';

// PageBuilder "Kodu Üret" ile oluşturuldu — bu noktadan sonra normal
// proje kodu, elle düzenlenebilir (GSAP/motion elle eklenir).
// DÜZELTME (manuel): "Explore" butonu SeasonRoute'un .focus__cta'sıyla
// (kullanıcı verdiği referans görüntü) BİREBİR aynı — "Sezonu Keşfet"/
// "Explore Season" metni + ok ikonu, SeasonRoute.jsx'teki ArrowIcon'un
// aynısı (bkz. BreakingBad/SeasonRoute/SeasonRoute.jsx).
// DÜZELTME (manuel): strokeWidth kullanıcı isteğiyle buttonBlock2'nin
// border-width'iyle (2.5px) eşitlendi — svg 24 birimlik viewBox'ta 18px'e
// küçültülüyor (ölçek 0.75), o yüzden ekrandaki gerçek kalınlık strokeWidth
// * 0.75'tir; 2.5px'e denk gelmesi için 2.5 / 0.75 = 3.33 kullanılıyor.
function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3.33" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="4.5" y1="12" x2="19" y2="12" />
      <polyline points="13.5 6.5 19.5 12 13.5 17.5" />
    </svg>
  );
}

export default function Hero() {
  const { t } = useTranslation();
  const [series5, setSeries5] = useState(null);
  const [genreNames, setGenreNames] = useState([]);

  useEffect(() => {
    fetchProductionById('series', 5).then(setSeries5);
  }, []);

  // genreNames backend'den DÖNMÜYOR (yalnız genreIds) — ProductionDetail/
  // SeriesHero'daki AYNI çözümleme burada da gerekli, aksi halde tür hiç
  // görünmüyordu (kullanıcı raporu, 2026-09-05).
  useEffect(() => {
    if (!series5?.genreIds?.length) {
      setGenreNames([]);
      return undefined;
    }
    let cancelled = false;
    resolveGenreNames(series5.genreIds).then((names) => {
      if (!cancelled) setGenreNames(names);
    });
    return () => {
      cancelled = true;
    };
  }, [series5]);

  // TODO: Replace null with a Skeleton UI if needed.
  if (series5 == null) return null;

  const year = series5?.firstAirDate ? new Date(series5.firstAirDate).getFullYear() : '';

  return (
    <div className={styles.page}>
      <img className={styles.imageBlock1} src={series5?.coverImageUrl} alt="" />
      <div className={styles.cardWrap}>
        <img className={styles.imageBlock2} src={series5?.coverImageUrl} alt="" />
        <p className={styles.textBlock1}>{series5?.title}</p>
        <div className={styles.metaRow}>
          <p className={styles.textBlock2}>{year}</p>
          <p className={styles.textBlock3}>{genreNames.join(' · ')}</p>
        </div>
        <p className={styles.textBlock4}>{series5?.synopsis}</p>
        <div className={styles.logoBlock1}><img src="/src/assets/logos/IMDB_Logo_2016.svg.webp" alt="IMDB Logo 2016.Svg" /></div>
        <p className={styles.textBlock5}>{series5?.externalRating}</p>
        <div className={styles.ctaRow}>
          <button type="button" className={styles.buttonBlock1}>{"▶  Watch Trailer"}</button>
          <Link to="/series/breaking-bad/seasons" className={styles.buttonBlock2}>
            {t('common.explore')} <ArrowIcon />
          </Link>
        </div>
        <Link to="/series/breaking-bad" className={styles.logoBlock2}><img src="/src/assets/logos/breaking-bad.svg" alt="Breaking Bad" /></Link>
      </div>
    </div>
  );
}
