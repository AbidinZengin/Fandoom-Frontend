import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ProfileSection } from '../ProfileView/ProfileSection/ProfileSection';
import { getStoredAuth } from '../../../shared/api/authStorage';
import { useLocalizedNavigate } from '../../../shared/i18n/useLocalizedNavigate';
import { toFollowStatus } from '../../../shared/follow/followState';
import { getUserProfile, getMyProfile, getFollowStatus, setFollowing } from './UserProfile.data';
import styles from './UserProfile.module.css';

// Başkasının herkese açık profili (/community/u/:username). Görünüm kendi
// profilimizle aynı ProfileSection'dır; fark isSelf'tedir. Backend profil
// yanıtına isSelf eklenene kadar (bkz. sözleşme) oturum açıksa kendi
// username'imizle karşılaştırılır — kendi adımıza tıklayınca düzenleme
// butonu kaybolmasın.
export default function UserProfile() {
  const { username } = useParams();
  const { t } = useTranslation();
  const navigate = useLocalizedNavigate();
  const [user, setUser] = useState(null);
  const [isSelf, setIsSelf] = useState(false);
  const [followStatus, setFollowStatus] = useState('NONE');
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    const mine = getStoredAuth()?.token ? getMyProfile().catch(() => null) : Promise.resolve(null);
    Promise.all([getUserProfile(username), mine, getFollowStatus(username)])
      .then(([profile, me, follow]) => {
        if (cancelled) return;
        setUser(profile);
        setIsSelf(Boolean(me) && me.username === profile.username);
        setFollowStatus(toFollowStatus(follow));
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [username]);

  // Oturumsuz kullanıcı /account'a gider (useThreadActions ile aynı kural).
  // Optimistic: önce arayüz döner, mock/gerçek uç hata verirse geri alınır.
  const handleToggleFollow = async () => {
    if (!getStoredAuth()?.token) {
      navigate('/account');
      return;
    }
    const prev = followStatus;
    // NONE → takip et (gizli profilde istek), FOLLOWING/REQUESTED → bırak/geri çek.
    // İyimser tahmin profilin isPrivate'ından gelir, sunucu yanıtı kesinleştirir.
    const next = prev === 'NONE' ? (user.isPrivate ? 'REQUESTED' : 'FOLLOWING') : 'NONE';
    // Takipçi sayacı yalnız onaylı takipte oynar (istek sayıya girmez); sunucunun
    // followerCount'u gelince gerçek değere eşitlenir, hata olursa geri alınır.
    const bumpFollowers = (delta) =>
      setUser((u) => (u.followerCount == null ? u : { ...u, followerCount: Math.max(0, u.followerCount + delta) }));
    const bumpFor = (from, to) => {
      if (to === 'FOLLOWING') bumpFollowers(1);
      else if (from === 'FOLLOWING') bumpFollowers(-1);
    };
    setFollowStatus(next);
    bumpFor(prev, next);
    try {
      const res = await setFollowing(user.username, prev === 'NONE');
      setFollowStatus(prev === 'NONE' ? toFollowStatus(res) : 'NONE');
      if (res.followerCount != null) setUser((u) => ({ ...u, followerCount: res.followerCount }));
    } catch {
      setFollowStatus(prev);
      bumpFor(next, prev);
    }
  };

  if (status === 'loading') return null;
  if (status === 'error') {
    return <p className={styles.userProfile__notFound}>{t('account.profile.userNotFound')}</p>;
  }

  return (
    <ProfileSection
      user={user}
      isSelf={isSelf}
      onProfileUpdate={setUser}
      followStatus={followStatus}
      onToggleFollow={handleToggleFollow}
    />
  );
}
