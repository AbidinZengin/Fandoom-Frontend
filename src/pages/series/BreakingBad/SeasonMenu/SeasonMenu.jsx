import { useEffect, useState } from 'react';
import { fetchSeasonDetail } from '../../../../shared/api/productions';
import styles from './SeasonMenu.module.css';

// PageBuilder "Kodu Üret" ile oluşturuldu — bu noktadan sonra normal
// proje kodu, elle düzenlenebilir (GSAP/motion elle eklenir).
export default function SeasonMenu() {
  const [season10, setSeason10] = useState(null);
  const [season11, setSeason11] = useState(null);
  const [season12, setSeason12] = useState(null);
  const [season13, setSeason13] = useState(null);
  const [season14, setSeason14] = useState(null);

  useEffect(() => {
    fetchSeasonDetail(10).then(setSeason10);
  }, []);

  useEffect(() => {
    fetchSeasonDetail(11).then(setSeason11);
  }, []);

  useEffect(() => {
    fetchSeasonDetail(12).then(setSeason12);
  }, []);

  useEffect(() => {
    fetchSeasonDetail(13).then(setSeason13);
  }, []);

  useEffect(() => {
    fetchSeasonDetail(14).then(setSeason14);
  }, []);

  // TODO: Replace null with a Skeleton UI if needed.
  if (season10 == null || season11 == null || season12 == null || season13 == null || season14 == null) return null;

  return (
    <div className={styles.page}>
      <img className={styles.imageBlock1} src={"https://res.cloudinary.com/b0bc5njd/image/upload/v1786894979/fandoom/general/wx0qd6dpcyuseimjy07e.webp"} alt="" />
      <p className={styles.textBlock1}>{"SEASONS"}</p>
      <p className={styles.textBlock2}>{"Every season, every episode of Breaking Bad — browse the full run."}</p>
      <p className={styles.textBlock3}>{"01"}</p>
      <img className={styles.imageBlock2} src={season10?.posterUrl} alt="" />
      <p className={styles.textBlock4}>{"02"}</p>
      <img className={styles.imageBlock3} src={season11?.posterUrl} alt="" />
      <img className={styles.imageBlock4} src={season12?.posterUrl} alt="" />
      <p className={styles.textBlock5}>{"03"}</p>
      <p className={styles.textBlock6}>{"04"}</p>
      <img className={styles.imageBlock5} src={season13?.posterUrl} alt="" />
      <p className={styles.textBlock7}>{"05"}</p>
      <img className={styles.imageBlock6} src={season14?.posterUrl} alt="" />
      <p className={styles.textBlock8}>{season10?.title}</p>
      <p className={styles.textBlock9}>{season11?.title}</p>
      <p className={styles.textBlock10}>{season12?.title}</p>
      <p className={styles.textBlock11}>{season13?.title}</p>
      <p className={styles.textBlock12}>{season14?.title}</p>
    </div>
  );
}
