import { Link } from 'react-router-dom';
import styles from './GlassButton.module.css';

// Glassmorfik pill — learned-rules: yeni eklenen butonların standart
// varsayılanı (EpisodeBrief `.brief__genrePill` deseni). `to` verilirse
// router linki, verilmezse <button> olur.
export default function GlassButton({ to, onClick, disabled, icon, children }) {
  const content = (
    <>
      {icon && <span className={styles['glassButton__icon']}>{icon}</span>}
      {children}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={styles['glassButton']}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className={styles['glassButton']} onClick={onClick} disabled={disabled}>
      {content}
    </button>
  );
}
