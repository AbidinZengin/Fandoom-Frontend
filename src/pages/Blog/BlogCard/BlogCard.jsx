import styles from './BlogCard.module.css';

// Kompakt rail kartı — FEATURED/LATEST rayları (learned-rules "Blog kartı"
// anatomisinin küçültülmüş hâli: kapak → başlık → meta). Gerçek veri
// bağlanana kadar (learned-rules [veri]: sahte içerikle doldurulmaz) kapak
// kesik çerçeve + gradient bloom ile "buraya görsel gelecek" der, başlık/meta
// ise satır uzunluğunu taklit eden nötr BAR'lar — lorem ipsum değil.
export function BlogCard() {
  return (
    <div className={styles.card}>
      <div className={styles.card__cover} />
      <div className={styles.card__body}>
        <span className={`${styles.bar} ${styles['bar--title']}`} />
        <span className={`${styles.bar} ${styles['bar--titleShort']}`} />
        <span className={`${styles.bar} ${styles['bar--meta']}`} />
      </div>
    </div>
  );
}
