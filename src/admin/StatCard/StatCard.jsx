import styles from './StatCard.module.css';

// variant: 'default' (koyu kart) | 'emphasis' (açık yüzey, öne çıkan kart).
// children: kartın altına oturan görsel (ör. CapsuleMeter).
export default function StatCard({ icon, label, value, hint, variant = 'default', children }) {
  const cls =
    variant === 'emphasis'
      ? `${styles['statCard']} ${styles['statCard--emphasis']}`
      : styles['statCard'];

  return (
    <article className={cls}>
      <header className={styles['statCard__head']}>
        <span className={styles['statCard__icon']}>{icon}</span>
        <h2 className={styles['statCard__label']}>{label}</h2>
      </header>

      <p className={styles['statCard__value']}>{value}</p>
      {hint && <p className={styles['statCard__hint']}>{hint}</p>}

      {children}
    </article>
  );
}
