import styles from './Field.module.css';

// Etiketli form alanı. Kontrolün kendisi (input/select) çağıran tarafta
// `controls.control` sınıfıyla gelir.
export default function Field({ label, hint, children }) {
  return (
    <label className={styles['field']}>
      <span className={styles['field__label']}>{label}</span>
      {children}
      {hint && <span className={styles['field__hint']}>{hint}</span>}
    </label>
  );
}
