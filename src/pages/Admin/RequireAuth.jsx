import { useEffect, useState } from 'react';
import { Link, Navigate, Outlet } from 'react-router-dom';
import { getCurrentUser } from '../../shared/api/auth';
import { getStoredAuth, setStoredAuth } from '../../shared/api/authStorage';
import styles from './RequireAuth.module.css';

// Admin'e girebilen roller — yazma yetkisi EDITOR+ (tasarım dokümanı FR-2).
const ADMIN_ROLES = ['EDITOR', 'MODERATOR', 'ADMIN'];

// Hem sarmalayıcı (<RequireAuth><X/></RequireAuth>) hem layout route
// (<Route element={<RequireAuth/>}>) olarak çalışır. Rol, localStorage'daki
// eski değere güvenmeden /api/auth/me ile taze okunur (DB'de değişmiş
// olabilir); layout route olarak admin boyunca mount kaldığı için kontrol
// admin oturumu başına bir kez yapılır.
export function RequireAuth({ children }) {
  const hasToken = Boolean(getStoredAuth()?.token);
  const [status, setStatus] = useState(hasToken ? 'checking' : 'anon');

  useEffect(() => {
    if (!hasToken) return undefined;
    let cancelled = false;
    getCurrentUser()
      .then((user) => {
        if (cancelled) return;
        if (!ADMIN_ROLES.includes(user.role)) {
          setStatus('forbidden');
          return;
        }
        setStoredAuth({ ...getStoredAuth(), role: user.role });
        setStatus('ok');
      })
      .catch((err) => {
        if (cancelled) return;
        // 401'de client token'ı zaten temizledi → login'e düşer.
        setStatus(err.status === 401 ? 'anon' : 'error');
      });
    return () => {
      cancelled = true;
    };
  }, [hasToken]);

  // Giriş Account'ta yapılır; başarılı girişte kullanıcı buraya (geldiği yere) döner.
  if (!hasToken || status === 'anon') return <Navigate to="/account" replace />;
  if (status === 'checking') return null;

  if (status === 'forbidden' || status === 'error') {
    return (
      <section className={styles.requireAuth}>
        <h1 className={styles.requireAuth__title}>
          {status === 'forbidden' ? 'Bu alana erişim yetkin yok' : 'Oturum doğrulanamadı'}
        </h1>
        <p className={styles.requireAuth__text}>
          {status === 'forbidden'
            ? 'Admin paneli EDITOR, MODERATOR ve ADMIN rolleri içindir.'
            : 'Sunucuya ulaşılamadı, sayfayı yenilemeyi dene.'}
        </p>
        <Link to="/" className={styles.requireAuth__link}>
          Ana sayfaya dön
        </Link>
      </section>
    );
  }

  return children ?? <Outlet />;
}
