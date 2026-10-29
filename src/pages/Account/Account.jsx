import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { takeReturnTo } from '../../shared/navigation/returnTo';
import { useLocalizedNavigate } from '../../shared/i18n/useLocalizedNavigate';
import { AuthView } from './AuthView/AuthView';
import { getStoredAuth } from '../../shared/api/authStorage';
import { logout as clearSession } from '../../shared/api/auth';
import { getMyProfile } from '../../shared/api/account';
import styles from './Account.module.css';

// Ayrı bir hesap sayfası yok: /account yalnız giriş kapısıdır. Giriş yapılınca
// (ya da oturum zaten geçerliyse) geldiğin sayfaya, yoksa Community'ye gidilir —
// profil, kütüphane, listeler ve ayarlar Community'de yaşar.
export default function Account() {
  const navigate = useNavigate();
  const localizedNavigate = useLocalizedNavigate();
  const [checkingSession, setCheckingSession] = useState(true);

  const leave = () => {
    const back = takeReturnTo();
    if (back) navigate(back, { replace: true });
    else localizedNavigate('/community', { replace: true });
  };
  // Doğrulama efekti yalnız mount'ta koşar; güncel leave ref'ten okunur.
  const leaveRef = useRef(leave);
  useEffect(() => {
    leaveRef.current = leave;
  });

  // Token duruyorsa geçerliliği doğrulanır: geçerliyse giriş formu hiç
  // gösterilmez, süresi dolmuşsa oturum temizlenip form açılır.
  useEffect(() => {
    let cancelled = false;
    if (!getStoredAuth()?.token) {
      setCheckingSession(false);
      return undefined;
    }
    getMyProfile()
      .then(() => {
        if (!cancelled) leaveRef.current();
      })
      .catch(() => {
        if (cancelled) return;
        clearSession();
        setCheckingSession(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (checkingSession) return <div className={styles.account} />;

  return (
    <div className={styles.account}>
      <AuthView onAuthenticated={leave} />
    </div>
  );
}
