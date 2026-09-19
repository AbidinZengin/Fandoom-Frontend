import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LocalizedLink as Link } from '../../../../shared/i18n/LocalizedLink';
import { SURFACES } from '../../../../shared/data/community';
import { avatarColor } from '../../communityAvatar';
import { timeAgo } from '../Feed.data';
import styles from './FeedCard.module.css';

// Tek tip kart (kullanıcı kararı, 2026-09-13 — SurfaceHighlight'ın yerine
// geçen Feed spec'i): tüm yüzeyler aynı FeedCard şablonunu kullanır.
// learned-rules [[topluluk-kart]] bu kararla güncellendi. Avatar rengi
// username'den deterministik üretilir (gerçek profil fotoğrafı yok, ama
// düz metin yerine sosyal-medya kartı hissi — kullanıcı düzeltmesi,
// "eski sayfadan çok etkilenmişsin" sonrası görsel dili zenginleştirme).
// Beğen/Kaydet bu fazda LOKAL optimistic toggle (backend'de THREAD
// itemType'ı için like/bookmark ucu teyit edilmedi).
export function FeedCard({ thread }) {
  const { t } = useTranslation();
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  const surfaceInfo = SURFACES.find((s) => s.key === thread.surface);
  const to = surfaceInfo ? `${surfaceInfo.to}/${thread.id}` : '#';
  const primaryTag = thread.tags?.[0];
  const author = thread.author ?? t('community.feed.anonymous');

  return (
    <article className={styles.feedCard}>
      <Link to={to} className={styles.feedCard__link}>
        <div className={styles.feedCard__meta}>
          <span className={styles.feedCard__avatar} style={{ background: avatarColor(author) }}>
            {author.charAt(0).toUpperCase()}
          </span>
          <span className={styles.feedCard__author}>@{author}</span>
          {primaryTag && <span className={styles.feedCard__tag}>#{primaryTag}</span>}
          {thread.createdAt && <span className={styles.feedCard__time}>{timeAgo(thread.createdAt, t)}</span>}
        </div>
        <h3 className={styles.feedCard__title}>{thread.title}</h3>
        {thread.excerpt && <p className={styles.feedCard__excerpt}>{thread.excerpt}</p>}
        <span className={styles.feedCard__readMore}>{t('community.feed.readMore')}</span>
      </Link>

      <div className={styles.feedCard__actions}>
        <button
          type="button"
          className={styles.feedCard__actionButton}
          data-active={liked}
          onClick={() => setLiked((v) => !v)}
        >
          ♥ {(thread.likeCount ?? 0) + (liked ? 1 : 0)}
        </button>
        <span className={styles.feedCard__actionButton}>💬 {thread.commentCount ?? 0}</span>
        <button
          type="button"
          className={styles.feedCard__actionButton}
          data-active={saved}
          aria-label={t('community.feed.save')}
          onClick={() => setSaved((v) => !v)}
        >
          🔖
        </button>
      </div>
    </article>
  );
}
