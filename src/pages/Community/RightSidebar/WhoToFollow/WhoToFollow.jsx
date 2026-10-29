import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LocalizedLink as Link } from '../../../../shared/i18n/LocalizedLink';
import { useLocalizedNavigate } from '../../../../shared/i18n/useLocalizedNavigate';
import { getStoredAuth } from '../../../../shared/api/authStorage';
import { toFollowStatus, followLabelKey } from '../../../../shared/follow/followState';
import { getPeopleToFollow, setFollowing } from './WhoToFollow.data';
import styles from './WhoToFollow.module.css';

// Topluluk üyeleri (gerçek /community/users): avatar + @kullanıcı adı + bio,
// kullanıcı adı profile (/community/u/:username) gider, buton gerçek takip
// ucuna bağlı. Optimistic, hatada geri alınır; oturumsuzken /account'a yönlenir.
// Hata veya boş listede widget sessizce kaybolur (TopPortals ile aynı).
export function WhoToFollow() {
  const { t } = useTranslation();
  const navigate = useLocalizedNavigate();
  const [people, setPeople] = useState([]);
  // Çift tık aynı anda iki istek atmasın.
  const pending = useRef(new Set());

  useEffect(() => {
    let cancelled = false;
    getPeopleToFollow()
      .then((list) => {
        if (!cancelled) setPeople(list);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const patch = (username, status) =>
    setPeople((list) => list.map((p) => (p.username === username ? { ...p, status } : p)));

  // Kişinin gizli olup olmadığı listede bilinmez: takip etmek (FOLLOWING mi
  // REQUESTED mi) sunucu yanıtıyla çizilir, bırakmak/geri çekmek iyimser.
  const handleToggle = async (person) => {
    if (!getStoredAuth()?.token) {
      navigate('/account');
      return;
    }
    if (pending.current.has(person.username)) return;
    pending.current.add(person.username);
    const prev = toFollowStatus(person);
    try {
      if (prev === 'NONE') {
        patch(person.username, toFollowStatus(await setFollowing(person.username, true)));
      } else {
        patch(person.username, 'NONE');
        await setFollowing(person.username, false);
      }
    } catch {
      patch(person.username, prev);
    } finally {
      pending.current.delete(person.username);
    }
  };

  if (people.length === 0) return null;

  return (
    <section className={styles.whoToFollow}>
      <h2 className={styles.whoToFollow__heading}>{t('community.sidebar.whoToFollowHeading')}</h2>
      <ul className={styles.whoToFollow__list}>
        {people.map((person) => {
          const status = toFollowStatus(person);
          const label = t(followLabelKey(status, 'community.sidebar.follow'));
          return (
          <li key={person.username} className={styles.whoToFollow__item}>
            <Link to={`/community/u/${encodeURIComponent(person.username)}`} className={styles.whoToFollow__link}>
              {person.avatarUrl ? (
                <img src={person.avatarUrl} alt="" className={styles.whoToFollow__avatar} />
              ) : (
                <span className={styles.whoToFollow__avatar} aria-hidden="true">
                  {person.username.charAt(0).toUpperCase()}
                </span>
              )}
              <span className={styles.whoToFollow__info}>
                <span className={styles.whoToFollow__username}>@{person.username}</span>
                {person.bio && <span className={styles.whoToFollow__bio}>{person.bio}</span>}
              </span>
            </Link>
            <button
              type="button"
              className={styles.whoToFollow__button}
              data-following={status !== 'NONE' || undefined}
              aria-pressed={status !== 'NONE'}
              aria-label={`${label}: @${person.username}`}
              onClick={() => handleToggle(person)}
            >
              {label}
            </button>
          </li>
          );
        })}
      </ul>
    </section>
  );
}
