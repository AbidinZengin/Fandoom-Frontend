import styles from './Seal.module.css';

// Salt sunum — animasyon (opacity/scale) WorldMap'in kendi pin
// timeline'ından, aynı `imgRef` üzerinden GSAP ile sürülür (bkz.
// WorldMap.jsx build()). Harita kapanışının SON karesinde, kamera
// haritanın ÜSTÜNE biner: kenarlardan ortaya doğru kararan vinyetle
// AYNI anda, aynı merkezden küçükten büyüyerek fade-in olur.
export function Seal({ imgRef }) {
  return (
    <img
      ref={imgRef}
      className={styles.seal__image}
      src="/got/seal.webp"
      alt="Game of Thrones"
    />
  );
}
