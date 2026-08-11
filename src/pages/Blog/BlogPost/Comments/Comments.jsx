import styles from './Comments.module.css';

// Yorum modülü backend'de henüz yok — learned-rules [veri]: backend'de
// karşılığı olmayan bir öğe sahte veriyle doldurulmaz (sahte yorum/kullanıcı
// YAZILMADI). Dürüst bir "yakında" boş durumu; gerçek modül gelince bu
// component listeye/forma dönüşür.
export function Comments() {
  return (
    <section className={styles.comments} aria-labelledby="comments-heading">
      <h2 className={styles.comments__heading} id="comments-heading">
        Comments
      </h2>
      <p className={styles.comments__empty}>Comments are coming soon.</p>
    </section>
  );
}
