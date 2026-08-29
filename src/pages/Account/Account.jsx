import { useEffect, useState } from 'react';
import { AuthView } from './AuthView/AuthView';
import { DashboardView } from './DashboardView/DashboardView';
import { getStoredAuth } from '../../shared/api/authStorage';
import { logout as clearSession } from '../../shared/api/auth';
import { getMyProfile } from '../../shared/api/account';
import styles from './Account.module.css';

// Oturum artık gerçek JWT'ye dayanır (localStorage, authStorage.js) — sayfa
// yenilendiğinde token duruyorsa profil tazelenir, oturum KORUNUR (prototip
// dönemindeki "yenilemede sıfırlanır" sınırlaması kalktı).
export default function Account() {
  const [profile, setProfile] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!getStoredAuth()?.token) {
      setCheckingSession(false);
      return;
    }
    getMyProfile()
      .then((data) => {
        if (!cancelled) setProfile(data);
      })
      .catch(() => {
        if (!cancelled) clearSession();
      })
      .finally(() => {
        if (!cancelled) setCheckingSession(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAuthenticated = () => {
    setCheckingSession(true);
    getMyProfile()
      .then(setProfile)
      .finally(() => setCheckingSession(false));
  };

  const handleLogout = () => {
    clearSession();
    setProfile(null);
  };

  if (checkingSession) return <div className={styles.account} />;

  return (
    <div className={styles.account}>
      {profile ? (
        <DashboardView user={profile} onLogout={handleLogout} onProfileUpdate={setProfile} />
      ) : (
        <AuthView onAuthenticated={handleAuthenticated} />
      )}
    </div>
  );
}
