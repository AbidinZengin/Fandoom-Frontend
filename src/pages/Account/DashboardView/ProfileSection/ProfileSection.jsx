import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LocalizedLink } from '../../../../shared/i18n/LocalizedLink';
import { EditProfileModal } from './EditProfileModal/EditProfileModal';
import { getCustomLists } from '../../Account.data';
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

function StatsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="5" y1="20" x2="5" y2="12" />
      <line x1="12" y1="20" x2="12" y2="6" />
      <line x1="19" y1="20" x2="19" y2="15" />
    </svg>
  );
}

function PlaylistsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="4" y1="6" x2="15" y2="6" />
      <line x1="4" y1="12" x2="15" y2="12" />
      <line x1="4" y1="18" x2="10" y2="18" />
      <circle cx="19.5" cy="15" r="2.5" />
      <line x1="22" y1="15" x2="22" y2="7.5" />
      <line x1="22" y1="7.5" x2="18" y2="8.5" />
    </svg>
  );
}

function CommentsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 5.5h16v11H9.5L5 20v-3.5H4z" />
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
  const [activeTab, setActiveTab] = useState('stats');
  const [publicLists, setPublicLists] = useState(null);
  const blogs = continueReading ?? [];
  const stats = user.stats ?? {};

  const handleSaved = (updated) => {
    onProfileUpdate?.(updated);
    setEditing(false);
  };

  // Playlists sekmesi ilk açıldığında tek seferlik yüklenir (kullanıcı hiç
  // açmazsa gereksiz istek atılmaz) — getCustomLists() zaten CUSTOM tipe
  // filtreli döner, burada ayrıca isPublic'e göre daraltılır (profilde
  // sadece herkese açık listeler sergilenir, düzenleme/silme yok — o
  // CustomListsSection'ın işi).
  useEffect(() => {
    if (activeTab !== 'playlists' || publicLists !== null) return undefined;
    let cancelled = false;
    getCustomLists().then((lists) => {
      if (!cancelled) setPublicLists(lists.filter((l) => l.isPublic));
    });
    return () => {
      cancelled = true;
    };
  }, [activeTab, publicLists]);

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

      <div className={styles.profile__tabs} role="tablist">
        <button
          type="button"
          role="tab"
          className={styles.profile__tabButton}
          data-active={activeTab === 'stats'}
          aria-selected={activeTab === 'stats'}
          aria-label={t('account.profile.tabStats')}
          title={t('account.profile.tabStats')}
          onClick={() => setActiveTab('stats')}
        >
          <StatsIcon />
        </button>
        <button
          type="button"
          role="tab"
          className={styles.profile__tabButton}
          data-active={activeTab === 'playlists'}
          aria-selected={activeTab === 'playlists'}
          aria-label={t('account.profile.tabPlaylists')}
          title={t('account.profile.tabPlaylists')}
          onClick={() => setActiveTab('playlists')}
        >
          <PlaylistsIcon />
        </button>
        <button
          type="button"
          role="tab"
          className={styles.profile__tabButton}
          data-active={activeTab === 'comments'}
          aria-selected={activeTab === 'comments'}
          aria-label={t('account.profile.tabComments')}
          title={t('account.profile.tabComments')}
          onClick={() => setActiveTab('comments')}
        >
          <CommentsIcon />
        </button>
      </div>

      {activeTab === 'stats' && (
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
      )}

      {activeTab === 'playlists' && (
        <div className={styles.profile__tabPanel}>
          {publicLists === null && <p className={styles.profile__tabEmpty}>{t('blog.loading')}</p>}
          {publicLists?.length === 0 && (
            <p className={styles.profile__tabEmpty}>{t('account.profile.playlistsEmpty')}</p>
          )}
          {publicLists && publicLists.length > 0 && (
            <ul className={styles.profile__playlistGrid}>
              {publicLists.map((list) => (
                <li key={list.id}>
                  <LocalizedLink
                    to={`/account/lists/${list.id}`}
                    className={styles.profile__playlistCard}
                    style={
                      list.coverImageUrl
                        ? { backgroundImage: `url(${list.coverImageUrl})` }
                        : undefined
                    }
                    data-has-cover={Boolean(list.coverImageUrl) || undefined}
                  >
                    <div className={styles.profile__playlistCardBody}>
                      <p className={styles.profile__playlistCardTitle}>{list.title}</p>
                      {list.description && (
                        <p className={styles.profile__playlistCardDescription}>{list.description}</p>
                      )}
                      <span className={styles.profile__playlistCardMeta}>
                        {t('account.customLists.itemsCount', { count: list.itemCount })}
                      </span>
                    </div>
                  </LocalizedLink>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {activeTab === 'comments' && (
        <div className={styles.profile__commentsPlaceholder}>
          {/* Backend'de yorum geçmişi ucu YOK — sahte veri üretilmez,
              öğenin gerçek anatomisi (avatar + metin satırları) kesik
              çerçeve/düşük opaklıkla iskelet olarak durur (learned-rules
              "veri" kuralı). */}
          {[0, 1, 2].map((i) => (
            <div key={i} className={styles.profile__commentSkeletonRow}>
              <span className={styles.profile__commentSkeletonAvatar} />
              <span className={styles.profile__commentSkeletonLines}>
                <span className={styles.profile__commentSkeletonLine} data-width="wide" />
                <span className={styles.profile__commentSkeletonLine} data-width="narrow" />
              </span>
            </div>
          ))}
          <p className={styles.profile__tabEmpty}>{t('account.profile.commentsComingSoon')}</p>
        </div>
      )}

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
