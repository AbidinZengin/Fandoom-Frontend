import { NavLink } from 'react-router-dom';
import { ChevronIcon } from '../icons';
import AccountBlock from './AccountBlock/AccountBlock';
import { NAV_ITEMS } from './SideRail.data';
import styles from './SideRail.module.css';

// Sabit sol rail. Kapalıyken yalnız ikon, açılınca etiketler görünür; açılış
// içeriğin ÜSTÜNE biner (içerik kaymaz). ≤900px'te ekran dışına kayar,
// üst çubuktaki butonla açılır.
export default function SideRail({ expanded, onToggle, onClose }) {
  return (
    <aside
      id="admin-rail"
      className={styles['sideRail']}
      data-admin-rail=""
      data-expanded={expanded}
    >
      <button
        type="button"
        className={styles['sideRail__toggle']}
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls="admin-rail"
        aria-label={expanded ? 'Menüyü daralt' : 'Menüyü genişlet'}
      >
        <span className={styles['sideRail__toggleIcon']}>
          <ChevronIcon />
        </span>
      </button>

      <nav aria-label="Admin" className={styles['sideRail__nav']}>
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onClose}
            title={label}
            className={({ isActive }) =>
              isActive
                ? `${styles['sideRail__link']} ${styles['sideRail__link--active']}`
                : styles['sideRail__link']
            }
          >
            <span className={styles['sideRail__linkIcon']}>
              <Icon />
            </span>
            <span className={styles['sideRail__linkLabel']}>{label}</span>
          </NavLink>
        ))}
      </nav>

      <AccountBlock />
    </aside>
  );
}
