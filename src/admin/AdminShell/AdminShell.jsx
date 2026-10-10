import { Suspense, useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { MenuIcon } from '../icons';
import SideRail from '../SideRail/SideRail';
import styles from './AdminShell.module.css';

// Yeni admin panelinin kabuğu — sabit rail + içerik alanı. Guard (RequireAuth)
// App.jsx'te bu rotanın dışında, ortak admin grubunda durur.
export default function AdminShell() {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!expanded) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setExpanded(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [expanded]);

  const close = () => setExpanded(false);

  return (
    <div className={styles['adminShell']}>
      <SideRail expanded={expanded} onToggle={() => setExpanded((v) => !v)} onClose={close} />

      {expanded && (
        <button
          type="button"
          className={styles['adminShell__scrim']}
          aria-label="Menüyü kapat"
          onClick={close}
        />
      )}

      <div className={styles['adminShell__main']}>
        <div className={styles['adminShell__mobileBar']}>
          <button
            type="button"
            className={styles['adminShell__menuButton']}
            onClick={() => setExpanded(true)}
            aria-label="Menüyü aç"
            aria-expanded={expanded}
            aria-controls="admin-rail"
          >
            <MenuIcon />
          </button>
        </div>

        <main className={styles['adminShell__content']}>
          <Suspense fallback={null}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
