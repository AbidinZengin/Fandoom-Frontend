import { useEffect, useState } from 'react';
import { fetchProductionById } from '../../../../shared/api/productions';
import styles from './Hero.module.css';

// PageBuilder "Kodu Üret" ile oluşturuldu — bu noktadan sonra normal
// proje kodu, elle düzenlenebilir (GSAP/motion elle eklenir).
export default function Hero() {
  const [series7, setSeries7] = useState(null);

  useEffect(() => {
    fetchProductionById('series', 8).then(setSeries7);
  }, []);

  // TODO: Replace null with a Skeleton UI if needed.
  if (series7 == null) return null;

  return (
    <div className={styles.page}>
      <img className={styles.imageBlock1} src={series7?.posterUrl} alt="" />
      <img className={styles.imageBlock2} src={series7?.coverImageUrl} alt="" />
      <p className={styles.textBlock1}>{series7?.title}</p>
      <p className={styles.textBlock2}>{"2025 "}</p>
      <p className={styles.textBlock3}>{series7?.genreNames}</p>
      <p className={styles.textBlock4}>{series7?.synopsis}</p>
      <div className={styles.logoBlock1}><img src="/src/assets/logos/IMDB_Logo_2016.svg.webp" alt="IMDB Logo 2016.Svg" /></div>
      <p className={styles.textBlock5}>{series7?.externalRating}</p>
      <button type="button" className={styles.buttonBlock1}>{"▶  Watch Trailer"}</button>
      <button type="button" className={styles.buttonBlock2}>{"Explore"}</button>
    </div>
  );
}
