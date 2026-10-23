import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import gsap from 'gsap';
import graphIcon from '../../../../assets/icons/graph.png';
import playIcon from '../../../../assets/icons/play.png';
import chatIcon from '../../../../assets/icons/chat.png';
import { LocalizedLink } from '../../../../shared/i18n/LocalizedLink';
import { EditProfileModal } from './EditProfileModal/EditProfileModal';
import { FollowListModal } from './FollowListModal/FollowListModal';
import { getCustomLists } from '../../../Account/Account.data';
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

// Sekme ikonları kullanıcının kendi siyah PNG'leridir (2026-10-23). Siyah PNG
// koyu zeminde görünmez ve aktif/soluk duruma göre renk almaz; bu yüzden
// görselin ALFA KANALI maske, boya currentColor (ThreadIcons.jsx ile aynı yöntem).
function MaskIcon({ src }) {
  return <span className={styles.profile__tabIcon} style={{ '--icon-mask': `url(${src})` }} aria-hidden="true" />;
}

const StatsIcon = () => <MaskIcon src={graphIcon} />;
const PlaylistsIcon = () => <MaskIcon src={playIcon} />;
const CommentsIcon = () => <MaskIcon src={chatIcon} />;

// Sayaç değişince yeni rakam artışta aşağıdan, azalışta yukarıdan kayarak
// gelir (±1 değişimde 0→1 sayma tween'i görünmez, kayma okunur). İlk render
// animasyonsuz; reduced-motion'da rakam anında değişir.
function AnimatedCount({ value }) {
  const ref = useRef(null);
  const prev = useRef(value);

  useEffect(() => {
    const direction = value > prev.current ? 1 : -1;
    const changed = value !== prev.current;
    prev.current = value;
    if (!changed) return undefined;

    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo(ref.current, { yPercent: direction * 70, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.35, ease: 'power2.out' });
    });
    return () => mm.revert();
  }, [value]);

  return (
    <strong ref={ref} className={styles.profile__countValue}>
      {value}
    </strong>
  );
}

function memberSinceLabel(isoDate) {
  if (!isoDate) return '';
  return new Date(isoDate).toLocaleDateString();
}

// isSelf=false: başkasının herkese açık profili — düzenleme butonu ve özel
// veri (okumaya devam et) gösterilmez, playlist'ler kendi listelerimizden
// çekilmez (backend'de kullanıcı bazlı herkese açık liste ucu henüz yok).
// following/onToggleFollow: yalnız başkasının profilinde Takip Et butonu için.
export function ProfileSection({ user, continueReading, onProfileUpdate, isSelf = true, following = false, onToggleFollow }) {
  const { t } = useTranslation();
  const trackRef = useRef(null);
  const [editing, setEditing] = useState(false);
  const [followList, setFollowList] = useState(null);
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
    if (!isSelf || activeTab !== 'playlists' || publicLists !== null) return undefined;
    let cancelled = false;
    getCustomLists().then((lists) => {
      if (!cancelled) setPublicLists(lists.filter((l) => l.isPublic));
    });
    return () => {
      cancelled = true;
    };
  }, [isSelf, activeTab, publicLists]);

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
          {user.followerCount != null && (
            <div className={styles.profile__counts}>
              <button type="button" className={styles.profile__count} onClick={() => setFollowList('followers')}>
                <AnimatedCount value={user.followerCount} /> {t('account.profile.followersLabel')}
              </button>
              <button type="button" className={styles.profile__count} onClick={() => setFollowList('following')}>
                <AnimatedCount value={user.followingCount} /> {t('account.profile.followingLabel')}
              </button>
            </div>
          )}
        </div>
        {isSelf && (
          <button type="button" className={styles.profile__editButton} onClick={() => setEditing(true)}>
            {t('account.profile.editProfile')}
          </button>
        )}
        {!isSelf && onToggleFollow && (
          <button
            type="button"
            className={styles.profile__editButton}
            data-following={following || undefined}
            aria-pressed={following}
            onClick={onToggleFollow}
          >
            {t(following ? 'account.profile.following' : 'account.profile.follow')}
          </button>
        )}
      </div>

      {isSelf && editing && (
        <EditProfileModal user={user} onClose={() => setEditing(false)} onSaved={handleSaved} />
      )}

      {followList && (
        <FollowListModal username={user.username} kind={followList} isSelf={isSelf} onClose={() => setFollowList(null)} />
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
          {!isSelf && <p className={styles.profile__tabEmpty}>{t('account.profile.playlistsUnavailable')}</p>}
          {isSelf && publicLists === null && <p className={styles.profile__tabEmpty}>{t('blog.loading')}</p>}
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

      {isSelf && (
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
      )}
    </section>
  );
}
