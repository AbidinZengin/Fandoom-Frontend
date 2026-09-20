import { useTranslation } from 'react-i18next';
import { avatarColor } from '../communityAvatar';
import { timeAgo } from '../Feed/Feed.data';
import styles from './ThreadAuthor.module.css';

// Thread kartının üst satırı (FeedCard + ThreadBody ortak), "isim yanı iz"
// (breadcrumb): avatar + @yazar • zaman. Evren segmenti ("@yazar ▶ Westeros •
// zaman") backend'de thread evren alanı gelince araya girer (Faz 2). Gerçek
// profil fotoğrafı (author.avatarUrl) varsa o, yoksa username'den deterministik
// renkli baş harf (avatar rengi grayscale kararının dışındadır — kullanıcı:
// "avatarların kendi rengi kalsın").
export function ThreadAuthor({ thread }) {
  const { t } = useTranslation();
  const author = thread.author ?? t('community.feed.anonymous');
  const sub = thread.createdAt && timeAgo(thread.createdAt, t);

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
        {sub && (
          <>
            <span className={styles.threadAuthor__dot} aria-hidden="true">
              •
            </span>
            <span className={styles.threadAuthor__sub}>{sub}</span>
          </>
        )}
      </div>
    </div>
  );
}
