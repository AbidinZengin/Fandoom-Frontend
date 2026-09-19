import { useTranslation } from 'react-i18next';
import { avatarColor } from '../communityAvatar';
import { timeAgo } from '../Feed/Feed.data';
import styles from './ThreadAuthor.module.css';

// Thread kartının üst satırı (FeedCard + ThreadBody ortak): avatar + @yazar,
// altında "zaman · #tag". Gerçek profil fotoğrafı (author.avatarUrl) varsa o,
// yoksa username'den deterministik renkli baş harf.
export function ThreadAuthor({ thread }) {
  const { t } = useTranslation();
  const author = thread.author ?? t('community.feed.anonymous');
  const sub = [thread.createdAt && timeAgo(thread.createdAt, t), thread.tags?.[0] && `#${thread.tags[0]}`]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className={styles.threadAuthor}>
      {thread.authorAvatarUrl ? (
        <img src={thread.authorAvatarUrl} alt="" className={styles.threadAuthor__avatar} />
      ) : (
        <span className={styles.threadAuthor__avatar} style={{ background: avatarColor(author) }}>
          {author.charAt(0).toUpperCase()}
        </span>
      )}
      <div className={styles.threadAuthor__text}>
        <span className={styles.threadAuthor__name}>@{author}</span>
        {sub && <span className={styles.threadAuthor__sub}>{sub}</span>}
      </div>
    </div>
  );
}
