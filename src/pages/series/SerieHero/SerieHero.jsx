import { useEffect, useState } from 'react';
import { fetchProductionById } from '../../../shared/api/productions';
import { Link } from 'react-router-dom';
import styles from './SerieHero.module.css';

// PageBuilder "Kodu Üret" ile oluşturuldu — bu noktadan sonra normal
// proje kodu, elle düzenlenebilir (GSAP/motion elle eklenir).
export default function SerieHero() {
  const [series6, setSeries6] = useState(null);
  const [series5, setSeries5] = useState(null);
  const [series7, setSeries7] = useState(null);
  const [series3, setSeries3] = useState(null);

  useEffect(() => {
    fetchProductionById('series', 6).then(setSeries6);
  }, []);

  useEffect(() => {
    fetchProductionById('series', 5).then(setSeries5);
  }, []);

  useEffect(() => {
    fetchProductionById('series', 7).then(setSeries7);
  }, []);

  useEffect(() => {
    fetchProductionById('series', 3).then(setSeries3);
  }, []);

  // TODO: Replace null with a Skeleton UI if needed.
  if (series6 == null || series5 == null || series7 == null || series3 == null) return null;

  return (
    <div className={styles.page}>
      <div className={styles.rectangleBlock1} />
      <img className={styles.imageBlock1} src={series6?.coverImageUrl} alt="" />
      <Link to="/series/house-of-the-dragon" className={styles.logoBlock1}><img src="/src/assets/logos/house-of-the-dragon.webp" alt="House of the Dragon" /></Link>
      <p className={styles.textBlock1}>{series6?.title}</p>
      <p className={styles.textBlock2}>{series6?.firstAirDate}</p>
      <p className={styles.textBlock3}>{series6?.genreNames}</p>
      <p className={styles.textBlock4}>{series6?.synopsis}</p>
      <div className={styles.logoBlock2}><img src="/src/assets/logos/IMDB_Logo_2016.svg.webp" alt="IMDB Logo 2016.Svg" /></div>
      <p className={styles.textBlock5}>{series6?.externalRating}</p>
      <button type="button" className={styles.buttonBlock1}>{"▶  Watch Trailer"}</button>
      <button type="button" className={styles.buttonBlock2}>{"Explore"}</button>
      <p className={styles.textBlock6}>{"FEATURED TITLES"}</p>
      <img className={styles.imageBlock2} src={series5?.posterUrl} alt="" />
      <img className={styles.imageBlock3} src={series6?.posterUrl} alt="" />
      <img className={styles.imageBlock4} src={series7?.posterUrl} alt="" />
      <p className={styles.textBlock7}>{"02"}</p>
      <p className={styles.textBlock8}>{"03"}</p>
      <p className={styles.textBlock9}>{"04"}</p>
      <p className={styles.textBlock10}>{series3?.title}</p>
      <p className={styles.textBlock11}>{series5?.title}</p>
      <p className={styles.textBlock12}>{series6?.title}</p>
      <p className={styles.textBlock13}>{series7?.title}</p>
      <img className={styles.imageBlock5} src={series3?.posterUrl} alt="" />
      <p className={styles.textBlock14}>{"01"}</p>
    </div>
  );
}
