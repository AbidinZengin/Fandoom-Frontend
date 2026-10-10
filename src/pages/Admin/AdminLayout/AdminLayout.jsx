import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { logout } from '../../../shared/api/auth';
import { getStoredAuth } from '../../../shared/api/authStorage';
import { NAV_ITEMS } from './AdminLayout.data';
import styles from './AdminLayout.module.css';

// Liste/ana sayfalar için sidebar kabuğu. Tam ekran editörler (PageBuilder,
// BlogEditor, SeriesHeroEditor) viewport'a bağlı fixed paneller kullandığı
// için bu kabuğun DIŞINDA kalır, sadece RequireAuth guard'ını paylaşır.
export default function AdminLayout() {
  const navigate = useNavigate();
  const auth = getStoredAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className={styles['adminLayout']}>
      <aside className={styles['adminLayout__sidebar']}>
        <nav aria-label="Admin" className={styles['adminLayout__nav']}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                isActive
                  ? `${styles['adminLayout__link']} ${styles['adminLayout__link--active']}`
                  : styles['adminLayout__link']
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className={styles['adminLayout__user']}>
          <span className={styles['adminLayout__username']}>{auth?.username}</span>
          <span className={styles['adminLayout__role']}>{auth?.role}</span>
          <button type="button" className={styles['adminLayout__logout']} onClick={handleLogout}>
            Çıkış
          </button>
        </div>
      </aside>

      <main className={styles['adminLayout__content']}>
        <Outlet />
      </main>
    </div>
  );
}
