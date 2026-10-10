import styles from './IconButton.module.css';

// Yalnız ikonlu buton — erişilebilir ad (`label`) zorunlu.
export default function IconButton({ label, onClick, disabled, danger, children }) {
  return (
    <button
      type="button"
      className={danger ? `${styles['iconButton']} ${styles['iconButton--danger']}` : styles['iconButton']}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      <span className={styles['iconButton__icon']}>{children}</span>
    </button>
  );
}
