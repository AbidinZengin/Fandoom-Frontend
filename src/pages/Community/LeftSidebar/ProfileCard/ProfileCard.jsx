import { useTranslation } from 'react-i18next';
import { LocalizedLink as Link } from '../../../../shared/i18n/LocalizedLink';
import styles from './ProfileCard.module.css';

// Gerçek /api/me/profile verisiyle beslenir (LeftSidebar.data.js). Avatar
// görseli yoksa kullanıcı adının ilk harfi decorative fallback olur — bu
// [veri] kuralının kapsamı DIŞINDA: kullanıcı fotoğrafı değil, standart
// initials-avatar UI kalıbı.
export function ProfileCard({ profile }) {
  const { t } = useTranslation();
  const initial = profile.username?.charAt(0)?.toUpperCase() ?? '?';

  return (
    <Link to="/community/profile" className={styles.profileCard}>
      <div
        className={styles.profileCard__avatar}
        style={profile.avatarUrl ? { backgroundImage: `url(${profile.avatarUrl})` } : undefined}
      >
        {!profile.avatarUrl && initial}
      </div>
      <div className={styles.profileCard__info}>
        <span className={styles.profileCard__username}>{profile.username}</span>
        <div className={styles.profileCard__stats}>
          <span>{t('community.sidebar.theoryCount', { count: profile.stats?.theoryCount ?? 0 })}</span>
          <span>{t('community.sidebar.likeCount', { count: profile.stats?.likeCount ?? 0 })}</span>
        </div>
      </div>
    </Link>
  );
}
