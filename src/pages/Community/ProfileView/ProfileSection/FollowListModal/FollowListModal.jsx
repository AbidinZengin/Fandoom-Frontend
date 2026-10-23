import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LocalizedLink } from '../../../../../shared/i18n/LocalizedLink';
import { useLocalizedNavigate } from '../../../../../shared/i18n/useLocalizedNavigate';
import { getStoredAuth } from '../../../../../shared/api/authStorage';
import { getMyProfile } from '../../../../../shared/api/account';
import { avatarColor } from '../../../communityAvatar';
import { getFollowList, setFollowing } from './FollowListModal.data';
import styles from './FollowListModal.module.css';

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <line x1="5" y1="5" x2="19" y2="19" />
      <line x1="19" y1="5" x2="5" y2="19" />
    </svg>
  );
}

// Satır kendi takip durumunu tutar (optimistic, hata olursa geri alınır) —
// listede bir satırı takip etmek diğer satırları veya profil sayaçlarını
// etkilemez. Oturumsuz kullanıcı /account'a gider (UserProfile ile aynı kural).
function FollowRow({ person, isMe, onNavigate }) {
  const { t } = useTranslation();
  const navigate = useLocalizedNavigate();
  const [following, setFollowingState] = useState(person.following);

  const handleToggle = async () => {
    if (!getStoredAuth()?.token) {
      navigate('/account');
      return;
    }
    const next = !following;
    setFollowingState(next);
    try {
      const res = await setFollowing(person.username, next);
      setFollowingState(res.following);
    } catch {
      setFollowingState(!next);
    }
  };

  return (
    <li className={styles.followList__item}>
      <LocalizedLink
        to={`/community/u/${encodeURIComponent(person.username)}`}
        className={styles.followList__person}
        onClick={onNavigate}
      >
        {person.avatarUrl ? (
          <img src={person.avatarUrl} alt="" className={styles.followList__avatar} />
        ) : (
          <span
            className={styles.followList__avatar}
            style={{ background: avatarColor(person.username) }}
            aria-hidden="true"
          >
            {person.username.charAt(0).toUpperCase()}
          </span>
        )}
        <span className={styles.followList__info}>
          <span className={styles.followList__username}>@{person.username}</span>
          {person.bio && <span className={styles.followList__bio}>{person.bio}</span>}
        </span>
      </LocalizedLink>
      {!isMe && (
        <button
          type="button"
          className={styles.followList__button}
          data-following={following || undefined}
          aria-pressed={following}
          onClick={handleToggle}
        >
          {t(following ? 'account.profile.following' : 'account.profile.follow')}
        </button>
      )}
    </li>
  );
}

// kind: 'followers' | 'following'. Esc ve dış tıklamayla kapanır; açılışta
// odak kapat butonuna gider, kapanınca çağıran tetikleyiciye döndürür.
export function FollowListModal({ username, kind, isSelf, onClose }) {
  const { t } = useTranslation();
  const closeRef = useRef(null);
  const [people, setPeople] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [status, setStatus] = useState('loading');
  const [myUsername, setMyUsername] = useState(null);

  const load = useCallback(
    async (nextPage) => {
      setStatus('loading');
      try {
        const res = await getFollowList(kind, username, nextPage);
        setPeople((prev) => (nextPage === 0 ? res.content : [...prev, ...res.content]));
        setPage(nextPage);
        setHasMore(!res.last);
        setStatus('ready');
      } catch {
        setStatus('error');
      }
    },
    [kind, username],
  );

  useEffect(() => {
    load(0);
  }, [load]);

  // Kendi satırında takip butonu çıkmasın (kendini takip 400 verir).
  useEffect(() => {
    if (!getStoredAuth()?.token) return;
    getMyProfile()
      .then((me) => setMyUsername(me.username))
      .catch(() => {});
  }, []);

  // onClose çağıranda inline fonksiyon olabilir; ref'te tutulur ki efekt her
  // render'da yeniden koşup odağı kapat butonuna geri çalmasın.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const trigger = document.activeElement;
    closeRef.current?.focus();
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      trigger?.focus?.();
    };
  }, []);

  const title = t(kind === 'followers' ? 'account.profile.followersTitle' : 'account.profile.followingTitle');

  return (
    <div className={styles.followList__backdrop} onClick={onClose}>
      <div
        className={styles.followList__card}
        role="dialog"
        aria-modal="true"
        aria-labelledby="follow-list-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.followList__head}>
          <h2 id="follow-list-title" className={styles.followList__title}>
            {title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            className={styles.followList__closeButton}
            onClick={onClose}
            aria-label={t('account.profile.closeModal')}
          >
            <CloseIcon />
          </button>
        </div>

        {people.length > 0 && (
          <ul className={styles.followList__list}>
            {people.map((person) => (
              <FollowRow key={person.username} person={person} isMe={person.username === myUsername} onNavigate={onClose} />
            ))}
          </ul>
        )}

        {status === 'ready' && people.length === 0 && (
          <p className={styles.followList__message}>
            {t(
              kind === 'followers'
                ? isSelf ? 'account.profile.followersEmptySelf' : 'account.profile.followersEmpty'
                : isSelf ? 'account.profile.followingEmptySelf' : 'account.profile.followingEmpty',
            )}
          </p>
        )}
        {status === 'error' && (
          <p className={styles.followList__message} role="alert">
            {t('account.profile.followListError')}
          </p>
        )}
        {status === 'loading' && <span className={styles.followList__spinner} role="status" aria-label={t('account.profile.followListLoading')} />}

        {(status === 'error' || (status === 'ready' && hasMore)) && (
          <button type="button" className={styles.followList__more} onClick={() => load(people.length ? page + 1 : 0)}>
            {t('account.profile.followListMore')}
          </button>
        )}
      </div>
    </div>
  );
}
