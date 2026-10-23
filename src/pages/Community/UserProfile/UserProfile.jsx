import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ProfileSection } from '../ProfileView/ProfileSection/ProfileSection';
import { getStoredAuth } from '../../../shared/api/authStorage';
import { useLocalizedNavigate } from '../../../shared/i18n/useLocalizedNavigate';
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
  const [following, setFollowingState] = useState(false);
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
        setFollowingState(follow.following);
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
    const next = !following;
    // Takipçi sayacı da optimistic oynar; sunucunun followerCount'u gelince
    // gerçek değere eşitlenir, hata olursa geri alınır.
    const bumpFollowers = (delta) =>
      setUser((u) => (u.followerCount == null ? u : { ...u, followerCount: Math.max(0, u.followerCount + delta) }));
    setFollowingState(next);
    bumpFollowers(next ? 1 : -1);
    try {
      const res = await setFollowing(user.username, next);
      setFollowingState(res.following);
      if (res.followerCount != null) setUser((u) => ({ ...u, followerCount: res.followerCount }));
    } catch {
      setFollowingState(!next);
      bumpFollowers(next ? -1 : 1);
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
      following={following}
      onToggleFollow={handleToggleFollow}
    />
  );
}
