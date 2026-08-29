import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LocalizedLink } from '../../../../shared/i18n/LocalizedLink';
import { EditProfileModal } from './EditProfileModal/EditProfileModal';
import styles from './ProfileSection.module.css';

// season route carousel'inin (SeasonRoute.jsx) ok ikonuyla aynısı — proje
// konvansiyonu: küçük ikon SVG'leri paylaşılmaz, kullanan component kendi
// kopyasını taşır (bkz. AuthView'daki Mail/Lock/Eye ikonları).
function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="4.5" y1="12" x2="19" y2="12" />
      <polyline points="13.5 6.5 19.5 12 13.5 17.5" />
    </svg>
  );
}

function memberSinceLabel(isoDate) {
  if (!isoDate) return '';
  return new Date(isoDate).toLocaleDateString();
}

export function ProfileSection({ user, continueReading, onProfileUpdate }) {
  const { t } = useTranslation();
  const trackRef = useRef(null);
  const [editing, setEditing] = useState(false);
  const blogs = continueReading ?? [];
  const stats = user.stats ?? {};

  const handleSaved = (updated) => {
    onProfileUpdate?.(updated);
    setEditing(false);
  };

  const scrollByCard = (dir) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector(`.${styles.continueReading__cardWrap}`);
    const step = (card?.offsetWidth ?? 240) + 24;
    track.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  return (
    <section className={styles.profile}>
      <div
        className={styles.profile__card}
        style={
          user.bannerUrl
            ? { backgroundImage: `url(${user.bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : undefined
        }
        data-has-banner={Boolean(user.bannerUrl) || undefined}
      >
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt="" className={styles.profile__avatarImage} />
        ) : (
          <div className={styles.profile__avatar} aria-hidden="true">
            {user.username?.charAt(0).toUpperCase()}
          </div>
        )}
        <div className={styles.profile__cardText}>
          <h1 className={styles.profile__name}>{user.username}</h1>
          {stats.memberSince && (
            <p className={styles.profile__memberSince}>
              {t('account.profile.memberSince', { date: memberSinceLabel(stats.memberSince) })}
            </p>
          )}
        </div>
        <button type="button" className={styles.profile__editButton} onClick={() => setEditing(true)}>
          {t('account.profile.editProfile')}
        </button>
      </div>

      {editing && (
        <EditProfileModal user={user} onClose={() => setEditing(false)} onSaved={handleSaved} />
      )}

      {user.bio && <p className={styles.profile__bio}>{user.bio}</p>}

      <div className={styles.profile__stats}>
        <div className={styles.profile__statCard}>
          <span className={styles.profile__statValue}>{stats.commentCount ?? 0}</span>
          <span className={styles.profile__statLabel}>{t('account.profile.commentsCount')}</span>
        </div>
        <div className={styles.profile__statCard}>
          <span className={styles.profile__statValue}>{stats.theoryCount ?? 0}</span>
          <span className={styles.profile__statLabel}>{t('account.profile.theoriesCount')}</span>
        </div>
        <div className={styles.profile__statCard}>
          <span className={styles.profile__statValue}>{stats.likeCount ?? 0}</span>
          <span className={styles.profile__statLabel}>{t('account.profile.likesCount')}</span>
        </div>
      </div>

      <div className={styles.profile__continue}>
        <div className={styles.continueReading__head}>
          <h2 className={styles.profile__continueHeading}>{t('account.profile.continueReadingHeading')}</h2>
          {blogs.length > 1 && (
            <div className={styles.continueReading__navRow}>
              <button
                type="button"
                className={styles.continueReading__navArrow}
                data-dir="left"
                onClick={() => scrollByCard(-1)}
                aria-label={t('common.previous')}
              >
                <ArrowIcon />
              </button>
              <button
                type="button"
                className={styles.continueReading__navArrow}
                onClick={() => scrollByCard(1)}
                aria-label={t('common.next')}
              >
                <ArrowIcon />
              </button>
            </div>
          )}
        </div>

        <div className={styles.continueReading__track} ref={trackRef}>
          {/* Her kart KENDİ progressPercentage'ını gösterir — hepsi bağımsız
              gerçek okuma ilerlemesi taşıyor (bkz. BlogPost.jsx scroll takibi),
              tek bir "birincil" karta indirgemek yanıltıcı olurdu. */}
          {blogs.map((blog) => (
            <div key={blog.id} className={styles.continueReading__cardWrap}>
              <LocalizedLink to={`/blog/${blog.slug}`} className={styles.continueReading__card}>
                <img
                  src={blog.imageUrl}
                  alt={blog.imageAlt ?? ''}
                  className={styles.continueReading__cardImage}
                  loading="lazy"
                />
              </LocalizedLink>
              <p className={styles.continueReading__cardTitle}>{blog.title}</p>

              <div className={styles.continueReading__progressTrack}>
                <div
                  className={styles.continueReading__progressFill}
                  style={{ width: `${blog.progressPercentage ?? 0}%` }}
                />
              </div>
              <LocalizedLink to={`/blog/${blog.slug}`} className={styles.continueReading__cta}>
                {t('account.profile.continueCta')} <ArrowIcon />
              </LocalizedLink>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
