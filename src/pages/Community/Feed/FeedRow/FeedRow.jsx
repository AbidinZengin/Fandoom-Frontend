import { useTranslation } from 'react-i18next';
import { LocalizedLink as Link } from '../../../../shared/i18n/LocalizedLink';
import { avatarColor } from '../../communityAvatar';
import { ArrowUpIcon, CommentIcon } from '../../ThreadIcons';
import { RichText } from '../../RichText/RichText';
import { formatCount } from '../../formatCount';
import { threadPath } from '../../threadLink';
import { timeAgo } from '../Feed.data';
import styles from './FeedRow.module.css';

// State B — Okuma Odası (Discussion/Theories): zengin konu satırı (Discourse/
// Reddit tarzı, kullanıcı kararı 2026-09-21). Sol: dikey upvote bloğu (ok +
// sayaç). Orta: başlık → TEK meta satırı "avatar @yazar • yorum • zaman"
// (başlığın hemen altında, soluk) → özetin ilk satırı (soluk, tek satır).
// Sağ: 72x72 küçük resim, SADECE resim varsa (yuva açılmaz — resimsiz satırda
// metin tüm genişliği kullanır). Büyük görsel gizlenir; küçük resim ilk GÖRSEL
// medyadır (video için kare yok); spoiler işaretli postta özet ve küçük resim
// gösterilmez. Upvote = backend'in beğeni sayacı (aşağı-oy YOK: backend'de
// karşılığı yok, sahte kontrol eklenmez). Katılımcı avatarları / "son yanıt"
// backend'de alan olmadığı için YOK; gelince meta satırına eklenir.
// Tüm satır tek link — detay sayfasına gider (modal yok).
export function FeedRow({ thread }) {
  const { t } = useTranslation();
  const author = thread.author ?? t('community.feed.anonymous');
  const thumb = thread.spoilerFlagged ? undefined : thread.media?.find((item) => item.type === 'IMAGE');
  const likes = formatCount(thread.likeCount);
  const comments = formatCount(thread.commentCount);
  const posted = thread.createdAt && timeAgo(thread.createdAt, t);

  return (
    <Link to={threadPath(thread)} className={styles.feedRow} data-has-thumb={Boolean(thumb) || undefined}>
      <span
        className={styles.feedRow__votes}
        data-zero={!thread.likeCount || undefined}
        aria-label={t('community.feed.likes', { count: thread.likeCount, formatted: likes })}
      >
        <ArrowUpIcon />
        {likes}
      </span>

      <span className={styles.feedRow__body}>
        <span className={styles.feedRow__title}>{thread.title}</span>

        <span className={styles.feedRow__meta}>
          {thread.authorAvatarUrl ? (
            <img src={thread.authorAvatarUrl} alt="" className={styles.feedRow__avatar} />
          ) : (
            <span className={styles.feedRow__avatar} style={{ background: avatarColor(author) }} aria-hidden="true">
              {author.charAt(0).toUpperCase()}
            </span>
          )}
          <span className={styles.feedRow__author}>@{author}</span>
          <span className={styles.feedRow__dot} aria-hidden="true">
            •
          </span>
          <span className={styles.feedRow__comments} data-zero={!thread.commentCount || undefined}>
            <CommentIcon />
            {t('community.feed.comments', { count: thread.commentCount, formatted: comments })}
          </span>
          {posted && (
            <>
              <span className={styles.feedRow__dot} aria-hidden="true">
                •
              </span>
              <span className={styles.feedRow__time}>{posted}</span>
            </>
          )}
        </span>

        {thread.spoilerFlagged ? (
          <span className={styles.feedRow__excerpt}>{t('community.feed.spoilerRow')}</span>
        ) : (
          thread.excerpt && (
            <span className={styles.feedRow__excerpt}>
              <RichText text={thread.excerpt} />
            </span>
          )
        )}
      </span>

      {thumb && <img src={thumb.url} alt="" loading="lazy" className={styles.feedRow__thumb} />}
    </Link>
  );
}
