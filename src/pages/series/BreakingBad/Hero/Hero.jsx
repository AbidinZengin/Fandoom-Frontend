import { useEffect, useState } from 'react';
import { ENTITY_SCHEMAS } from '../../../../shared/builder/entitySchemas';
import { Link } from 'react-router-dom';
import styles from './Hero.module.css';

// PageBuilder "Kodu Üret" ile oluşturuldu — bu noktadan sonra normal
// proje kodu, elle düzenlenebilir (GSAP/motion elle eklenir).
// DÜZELTME (manuel): codegen ham fetchProductionById kullanmıştı — bu,
// genreNames'i türeten withGenreNames sarmalayıcısını (bkz.
// entitySchemas.js) atlıyordu, PageBuilder önizlemesinde görünen genre
// metni gerçek sayfada hep boş geliyordu. ENTITY_SCHEMAS.series.fetch
// AYNI sarmalamayı kullanır — PageBuilder'ın gördüğü veriyle birebir.
export default function Hero() {
  const [series5, setSeries5] = useState(null);

  useEffect(() => {
    ENTITY_SCHEMAS.series.fetch(5).then(setSeries5);
  }, []);

  // TODO: Replace null with a Skeleton UI if needed.
  if (series5 == null) return null;

  return (
    <div className={styles.page}>
      <img className={styles.imageBlock1} src={"https://res.cloudinary.com/b0bc5njd/image/upload/v1786892507/fandoom/general/cafgu8cfifaioz5kn6j7.webp"} alt="" />
      <img className={styles.imageBlock2} src={"https://res.cloudinary.com/b0bc5njd/image/upload/v1786892540/fandoom/general/udr8y4sfucrf9xw4yyx0.webp"} alt="" />
      <p className={styles.textBlock1}>{series5?.genreNames}</p>
      <Link to="/series/breaking-bad" className={styles.logoBlock1}><img src="/src/assets/logos/breaking-bad.svg" alt="Breaking Bad" /></Link>
      <Link to="https://www.youtube.com/watch?v=HhesaQXLuRY" className={styles.buttonBlock1}>{"▶  Watch Trailer"}</Link>
      <Link to="/series/breaking-bad/seasons" className={styles.buttonBlock2}>{"Seasons"}</Link>
      <p className={styles.textBlock2}>{series5?.synopsis}</p>
      <div className={styles.logoBlock2}><img src="/src/assets/logos/IMDB_Logo_2016.svg.webp" alt="IMDB Logo 2016.Svg" /></div>
      <p className={styles.textBlock3}>{series5?.externalRating}</p>
      <svg className={styles.iconBlock1} viewBox="0 0 24 24" fill="currentColor" stroke="none" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.9 6.9L22 9.2l-5.5 5 1.6 7.6L12 18l-6.1 3.8 1.6-7.6-5.5-5 7.1-0.3L12 2z" /></svg>
      <div className={styles.rectangleBlock1} />
    </div>
  );
}
