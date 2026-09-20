import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LocalizedLink as Link } from '../../../../shared/i18n/LocalizedLink';
import { CommentIcon, HeartIcon } from '../../ThreadIcons';
import { formatCount } from '../../formatCount';
import { threadPath } from '../../threadLink';
import styles from './FeedTile.module.css';

// State C — Galeri (Fan Art): masonry karosu. Odak tamamen görsel; başlık/yazar
// ve beğeni/yorum yalnız hover'da (dokunmatikte HER ZAMAN — [topluluk-kart]:
// hover'a bağlı bilgi dokunmatikte gizli kalmaz). Görsel yüklenince fade-in
// eder, öncesinde koyu zemin durur (skeleton/shimmer yok). Spoiler işaretliyse
// medya HİÇ render edilmez (FeedCard/FeedRow ile aynı — [[topluluk-spoiler]]),
// nötr bir yer tutucu durur; tıkla-aç detay sayfasındadır. Yüklenemeyen medya
// başlık karosuna düşer. Görsel oranı backend'den gelmediği için yüklenene dek
// kare yer tutulur (yükleme sonrası kısa yükseklik sıçraması bilinen risk).
export function FeedTile({ thread }) {
  const { t } = useTranslation();
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const author = thread.author ?? t('community.feed.anonymous');
  const media = thread.spoilerFlagged || failed ? undefined : thread.media?.[0];

  return (
    <Link to={threadPath(thread)} className={styles.feedTile} data-loaded={loaded || !media || undefined}>
      {media?.type === 'VIDEO' ? (
        <video
          src={media.url}
          muted
          playsInline
          preload="metadata"
          className={styles.feedTile__media}
          onLoadedMetadata={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      ) : media ? (
        <img
          src={media.url}
          alt=""
          loading="lazy"
          className={styles.feedTile__media}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      ) : (
        <span className={styles.feedTile__textOnly} data-spoiler={thread.spoilerFlagged || undefined}>
          {thread.spoilerFlagged ? t('community.thread.spoilerShort') : thread.title}
        </span>
      )}

      <span className={styles.feedTile__overlay}>
        <span className={styles.feedTile__title}>{thread.title}</span>
        <span className={styles.feedTile__meta}>
          <span>@{author}</span>
          <span className={styles.feedTile__stat}>
            <HeartIcon filled={thread.isLiked} />
            {formatCount(thread.likeCount)}
          </span>
          <span className={styles.feedTile__stat}>
            <CommentIcon />
            {formatCount(thread.commentCount)}
          </span>
        </span>
      </span>
    </Link>
  );
}
