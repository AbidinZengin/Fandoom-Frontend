import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { avatarColor } from '../../communityAvatar';
import { timeAgo } from '../../Feed/Feed.data';
import styles from './ThreadBody.module.css';

// learned-rules [[topluluk-header]]: başlık → yazar+zaman+tag meta satırı →
// like bloğu (masaüstü dikey-sol, mobil yatay) → paylaş/kaydet sağda.
// [[topluluk-spoiler]]: tıkla-aç, HOVER değil. Fan Art'ta gerçek görsel
// asset'i yok — production'ın kendi CSS gradyanı placeholder olarak durur
// (learned-rules [veri]: sahte içerik değil, kesik/beklemede iskelet ruhu).
export function ThreadBody({ thread }) {
  const { t } = useTranslation();
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(!thread.spoilerFlagged);

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  const author = thread.author ?? t('community.feed.anonymous');

  return (
    <article className={styles.threadBody}>
      <div className={styles.threadBody__voteCol}>
        <button
          type="button"
          className={styles.threadBody__voteButton}
          data-active={liked}
          onClick={() => setLiked((v) => !v)}
          aria-label={t('community.feed.readMore')}
        >
          ♥
        </button>
        <span className={styles.threadBody__voteCount}>{(thread.likeCount ?? 0) + (liked ? 1 : 0)}</span>
      </div>

      <div className={styles.threadBody__content}>
        <div className={styles.threadBody__meta}>
          <span className={styles.threadBody__avatar} style={{ background: avatarColor(author) }}>
            {author.charAt(0).toUpperCase()}
          </span>
          <span className={styles.threadBody__author}>@{author}</span>
          {thread.createdAt && <span className={styles.threadBody__time}>{timeAgo(thread.createdAt, t)}</span>}
          {thread.tags?.[0] && <span className={styles.threadBody__tag}>#{thread.tags[0]}</span>}
        </div>

        <h1 className={styles.threadBody__title}>{thread.title}</h1>

        {thread.surface === 'FAN_ART' && <div className={styles.threadBody__placeholder} aria-hidden="true" />}

        {thread.body &&
          (revealed ? (
            <div className={styles.threadBody__text}>
              {thread.body.split('\n\n').map((paragraph) => (
                <p key={paragraph.slice(0, 24)}>{paragraph}</p>
              ))}
            </div>
          ) : (
            <button type="button" className={styles.threadBody__spoilerGate} onClick={() => setRevealed(true)}>
              {t('community.thread.spoilerReveal')}
            </button>
          ))}
      </div>

      <div className={styles.threadBody__actionsCol}>
        <button
          type="button"
          className={styles.threadBody__actionButton}
          data-active={saved}
          onClick={() => setSaved((v) => !v)}
          aria-label={t('community.feed.save')}
        >
          🔖
        </button>
        <button
          type="button"
          className={styles.threadBody__actionButton}
          onClick={handleShare}
          aria-label={t('community.thread.share')}
        >
          {copied ? t('community.thread.linkCopied') : '↗'}
        </button>
      </div>
    </article>
  );
}
