import { PlusIcon } from '../icons';
import GlassButton from '../GlassButton/GlassButton';
import styles from './PageHeader.module.css';

// İri sayfa başlığı. Sağ taraf: isteğe bağlı birincil CTA (`action`: link) ve
// serbest aksiyon alanı (`children`, ör. editörde undo/redo/kaydet).
export default function PageHeader({ title, subtitle, action, children }) {
  return (
    <header className={styles['pageHeader']}>
      <div className={styles['pageHeader__text']}>
        <h1 className={styles['pageHeader__title']}>{title}</h1>
        {subtitle && <p className={styles['pageHeader__subtitle']}>{subtitle}</p>}
      </div>

      {(action || children) && (
        <div className={styles['pageHeader__actions']}>
          {children}
          {action && (
            <GlassButton to={action.to} icon={<PlusIcon />}>
              {action.label}
            </GlassButton>
          )}
        </div>
      )}
    </header>
  );
}
