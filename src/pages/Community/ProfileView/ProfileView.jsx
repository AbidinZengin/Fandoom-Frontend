import { useEffect, useState } from 'react';
import { ProfileSection } from './ProfileSection/ProfileSection';
import { getStoredAuth } from '../../../shared/api/authStorage';
import { logout as clearSession } from '../../../shared/api/auth';
import { getMyProfile } from '../../../shared/api/account';
import { getContinueReading } from '../../Account/Account.data';
import { useLocalizedNavigate } from '../../../shared/i18n/useLocalizedNavigate';

// Account'un Profile sekmesinden Community'nin orta sütununa taşındı
// (kullanıcı kararı, 2026-09-23) — Account.jsx'teki oturum/token kontrolü
// aynen tekrarlanır, çünkü diğer Account sekmeleri (Watchlist, Saved,
// Custom Lists vb.) hâlâ /account'ta yaşıyor ve kendi oturum kontrollerini
// ayrı yürütüyor.
export default function ProfileView() {
  const navigate = useLocalizedNavigate();
  const [user, setUser] = useState(null);
  const [continueReading, setContinueReading] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!getStoredAuth()?.token) {
      setCheckingSession(false);
      return undefined;
    }
    getMyProfile()
      .then((data) => {
        if (!cancelled) setUser(data);
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

  useEffect(() => {
    if (!user) return undefined;
    let cancelled = false;
    getContinueReading().then((data) => {
      if (!cancelled) setContinueReading(data);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Oturumsuz kullanıcı /account'a gider — girişin kendisi hâlâ orada
  // (AuthView), CommunityLayout'un sol menüsündeki "Giriş yap" CTA'sıyla
  // aynı hedef.
  useEffect(() => {
    if (!checkingSession && !user) navigate('/account');
  }, [checkingSession, user, navigate]);

  if (checkingSession || !user) return null;

  return <ProfileSection user={user} continueReading={continueReading} onProfileUpdate={setUser} />;
}
