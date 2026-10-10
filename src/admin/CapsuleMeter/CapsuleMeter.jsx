import styles from './CapsuleMeter.module.css';

// Kapsül segment çubukları — `filled` dolu, geri kalanı kesik çizgili boş.
// Renk currentColor'dan gelir, bulunduğu kartın metin rengini izler.
export default function CapsuleMeter({ total = 8, filled, label }) {
  return (
    <div className={styles['capsuleMeter']} role="img" aria-label={label}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={
            i < filled
              ? `${styles['capsuleMeter__cell']} ${styles['capsuleMeter__cell--filled']}`
              : styles['capsuleMeter__cell']
          }
        />
      ))}
    </div>
  );
}
