import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocalizedNavigate } from '../../shared/i18n/useLocalizedNavigate';
import { getStoredAuth } from '../../shared/api/authStorage';
import {
  getMyLikeStatus,
  likeItem,
  unlikeItem,
  getMyFollowStatus,
  followItem,
  unfollowItem,
  getMyBookmarkStatus,
  bookmarkItem,
  unbookmarkItem,
  getMySavedItemStatus,
  addToList,
  removeFromList,
} from '../../shared/api/account';
import { AddToListPopover } from './AddToListPopover/AddToListPopover';
import styles from './ContentActions.module.css';

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <circle cx="18" cy="5" r="2.6" />
      <circle cx="6" cy="12" r="2.6" />
      <circle cx="18" cy="19" r="2.6" />
      <line x1="8.3" y1="10.6" x2="15.6" y2="6.6" />
      <line x1="8.3" y1="13.4" x2="15.6" y2="17.4" />
    </svg>
  );
}

function HeartIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path
        d="M12 20.5s-7.5-4.6-10-9.3C.4 7.9 2 4.5 5.4 4c2-.3 3.7.6 6.6 3.3C14.9 4.6 16.6 3.7 18.6 4c3.4.5 5 3.9 3.4 7.2-2.5 4.7-10 9.3-10 9.3z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BookmarkIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M6.5 3.5h11a1 1 0 0 1 1 1V21l-6.5-3.9L5.5 21V4.5a1 1 0 0 1 1-1z" strokeLinejoin="round" />
    </svg>
  );
}

function BellIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M18 16v-5a6 6 0 1 0-12 0v5l-2 3h16l-2-3z" strokeLinejoin="round" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </svg>
  );
}

// "İzleme Listeme Ekle" — YouTube "Watch Later" konvansiyonu (saat).
function ClockIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// "İzledim" — kontrol işareti (Trakt/Letterboxd "watched" konvansiyonu).
function CheckCircleIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.5 2.5L16 9.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Blog: Share+Like+Save. Movie/Series (isProduction): +Follow+İzleme
// Listeme Ekle+İzledim. Giriş yapılmamışsa hiçbir durum çekilmez, tıklama
// /account'a yönlendirir (AUTH gerektiren aksiyon anonim kullanıcıya sahte
// state göstermez).
// Save = Bookmark — Watchlist/Watched'ten TAMAMEN bağımsız düz işaretleme
// (kullanıcı kararı, 2026-08-29), Like/Follow ile birebir aynı idempotent
// POST/DELETE + status deseni.
// Watchlist/Watched aynı saved-items mekanizmasını (listType alanıyla)
// paylaşır — backend Watched'a eklerken Watchlist kaydını OTOMATİK siler
// (Trakt/Letterboxd modeli), bu yüzden toggleWatched watchlisted'ı da
// optimistic olarak false'a çeker.
export function ContentActions({ itemId, itemType, shareTitle, shareUrl, isProduction = false }) {
  const { t } = useTranslation();
  const navigate = useLocalizedNavigate();
  const isAuthed = Boolean(getStoredAuth()?.token);

  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [following, setFollowing] = useState(false);
  const [watchlisted, setWatchlisted] = useState(false);
  const [watchlistItemId, setWatchlistItemId] = useState(null);
  const [watched, setWatched] = useState(false);
  const [watchedItemId, setWatchedItemId] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isAuthed) return undefined;
    let cancelled = false;

    getMyLikeStatus(itemType, itemId).then((res) => {
      if (!cancelled) setLiked(res.liked);
    });
    getMyBookmarkStatus(itemType, itemId).then((res) => {
      if (!cancelled) setSaved(res.bookmarked);
    });
    if (isProduction) {
      getMyFollowStatus(itemType, itemId).then((res) => {
        if (!cancelled) setFollowing(res.following);
      });
      getMySavedItemStatus(itemType, itemId).then((res) => {
        if (!cancelled) {
          setWatchlisted(res.saved);
          setWatchlistItemId(res.savedItemId ?? null);
        }
      });
      getMySavedItemStatus(itemType, itemId, 'WATCHED').then((res) => {
        if (!cancelled) {
          setWatched(res.saved);
          setWatchedItemId(res.savedItemId ?? null);
        }
      });
    }
    return () => {
      cancelled = true;
    };
  }, [itemType, itemId, isAuthed, isProduction]);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(timer);
  }, [copied]);

  const toggleLike = async () => {
    if (!isAuthed) return navigate('/account');
    const next = !liked;
    setLiked(next);
    try {
      await (next ? likeItem(itemType, itemId) : unlikeItem(itemType, itemId));
    } catch {
      setLiked(!next);
    }
    return undefined;
  };

  const toggleSave = async () => {
    if (!isAuthed) return navigate('/account');
    const next = !saved;
    setSaved(next);
    try {
      await (next ? bookmarkItem(itemType, itemId) : unbookmarkItem(itemType, itemId));
    } catch {
      setSaved(!next);
    }
    return undefined;
  };

  const toggleFollow = async () => {
    if (!isAuthed) return navigate('/account');
    const next = !following;
    setFollowing(next);
    try {
      await (next ? followItem(itemType, itemId) : unfollowItem(itemType, itemId));
    } catch {
      setFollowing(!next);
    }
    return undefined;
  };

  const toggleWatchlist = async () => {
    if (!isAuthed) return navigate('/account');
    if (watchlisted) {
      const prevId = watchlistItemId;
      setWatchlisted(false);
      setWatchlistItemId(null);
      try {
        await removeFromList(prevId);
      } catch {
        setWatchlisted(true);
        setWatchlistItemId(prevId);
      }
    } else {
      setWatchlisted(true);
      try {
        const res = await addToList(itemId, itemType);
        setWatchlistItemId(res.id);
      } catch {
        setWatchlisted(false);
      }
    }
    return undefined;
  };

  const toggleWatched = async () => {
    if (!isAuthed) return navigate('/account');
    if (watched) {
      const prevId = watchedItemId;
      setWatched(false);
      setWatchedItemId(null);
      try {
        await removeFromList(prevId);
      } catch {
        setWatched(true);
        setWatchedItemId(prevId);
      }
    } else {
      // Backend Watched eklerken Watchlist kaydını otomatik siler — UI'da
      // da aynı anı yansıtılır (revert gerekirse eski watchlist state'i
      // de geri alınır).
      const prevWatchlisted = watchlisted;
      const prevWatchlistItemId = watchlistItemId;
      setWatched(true);
      setWatchlisted(false);
      setWatchlistItemId(null);
      try {
        const res = await addToList(itemId, itemType, { listType: 'WATCHED' });
        setWatchedItemId(res.id);
      } catch {
        setWatched(false);
        setWatchlisted(prevWatchlisted);
        setWatchlistItemId(prevWatchlistItemId);
      }
    }
    return undefined;
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, url: shareUrl });
      } catch {
        // Kullanıcı paylaşım panelini iptal etti — sessiz geç.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
    } catch {
      // Panoya erişim yoksa sessiz geç — kritik olmayan bir kolaylık.
    }
  };

  return (
    <div className={styles.actions}>
      <div className={styles.actionWrap}>
        <button type="button" className={styles.action} onClick={share} aria-label={t('contentActions.share')}>
          <ShareIcon />
        </button>
        {copied && (
          <span className={styles.toast} role="status">
            {t('contentActions.copied')}
          </span>
        )}
      </div>

      <button
        type="button"
        className={styles.action}
        data-active={liked || undefined}
        onClick={toggleLike}
        aria-label={liked ? t('contentActions.unlike') : t('contentActions.like')}
        aria-pressed={liked}
      >
        <HeartIcon active={liked} />
      </button>

      <button
        type="button"
        className={styles.action}
        data-active={saved || undefined}
        onClick={toggleSave}
        aria-label={saved ? t('contentActions.removeFromSaved') : t('contentActions.save')}
        aria-pressed={saved}
      >
        <BookmarkIcon active={saved} />
      </button>

      {isProduction && (
        <>
          <button
            type="button"
            className={styles.action}
            data-active={watchlisted || undefined}
            onClick={toggleWatchlist}
            aria-label={watchlisted ? t('contentActions.removeFromWatchlist') : t('contentActions.addToWatchlist')}
            aria-pressed={watchlisted}
          >
            <ClockIcon active={watchlisted} />
          </button>

          <button
            type="button"
            className={styles.action}
            data-active={watched || undefined}
            onClick={toggleWatched}
            aria-label={watched ? t('contentActions.unmarkWatched') : t('contentActions.markWatched')}
            aria-pressed={watched}
          >
            <CheckCircleIcon active={watched} />
          </button>

          <button
            type="button"
            className={styles.action}
            data-active={following || undefined}
            onClick={toggleFollow}
            aria-label={following ? t('contentActions.unfollow') : t('contentActions.follow')}
            aria-pressed={following}
          >
            <BellIcon active={following} />
          </button>
        </>
      )}

      <AddToListPopover itemId={itemId} itemType={itemType} />
    </div>
  );
}
