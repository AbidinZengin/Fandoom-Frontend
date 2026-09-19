import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CommentIcon, HeartIcon, ShareIcon, BookmarkIcon } from '../ThreadIcons';
import { formatCount } from '../formatCount';
import { useThreadActions } from '../useThreadActions';
import styles from './ThreadActions.module.css';

// Thread kartının alt çubuğu (FeedCard + ThreadBody ortak), referans düzeni:
// yorum / beğeni / paylaş / kaydet — ikon + etiketli sayaç. Paylaş için
// backend'de sayaç YOK (sahte veri yazılmaz), sadece bağlantıyı kopyalar.
export function ThreadActions({ thread, shareUrl }) {
  const { t } = useTranslation();
  const { liked, likeCount, saved, saveCount, toggleLike, toggleSave } = useThreadActions(thread);
  const [copied, setCopied] = useState(false);
  const commentCount = thread.commentCount ?? 0;

  const handleShare = () => {
    navigator.clipboard?.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className={styles.threadActions}>
      <span className={styles.threadActions__item}>
        <CommentIcon />
        {t('community.feed.comments', { count: commentCount, formatted: formatCount(commentCount) })}
      </span>
      <button type="button" className={styles.threadActions__item} data-active={liked} onClick={toggleLike}>
        <HeartIcon filled={liked} />
        {t('community.feed.likes', { count: likeCount, formatted: formatCount(likeCount) })}
      </button>
      <button type="button" className={styles.threadActions__item} onClick={handleShare}>
        <ShareIcon />
        {copied ? t('community.thread.linkCopied') : t('community.thread.share')}
      </button>
      <button type="button" className={styles.threadActions__item} data-active={saved} onClick={toggleSave}>
        <BookmarkIcon filled={saved} />
        {t('community.feed.saved', { count: saveCount, formatted: formatCount(saveCount) })}
      </button>
    </div>
  );
}
