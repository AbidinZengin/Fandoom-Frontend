import { useState } from 'react';
import { CommentIcon, HeartIcon } from '../../../Community/ThreadIcons';
import { formatCount } from '../../../Community/formatCount';
import { Cover } from '../Cover/Cover';
import styles from './PostTile.module.css';

// Görselli kartın oran aralığı: aşırı uzun (ekran görüntüsü şeridi) ya da aşırı
// geniş görsel masonry'yi bozmasın diye kırpılır. Backend görsel ölçüsü
// vermediği için oran yüklenince doğal ölçüden okunur (varsayılan 4/3).
const RATIO_MIN = 0.75;
const RATIO_MAX = 1.6;
const RATIO_DEFAULT = 4 / 3;

// Vitrin kartı (masonry). Görselli kartlar KENDİ ORANINDA, görselsizler içeriğe
// göre uzar. Kartın tamamı "aç" düğmesidir (tıklayınca öne gelen kart); beğeni
// düğmesi onun ÜSTÜNDE durur. İç içe düğme olmasın diye açma düğmesi kardeş
// bir katmandır.
export function PostTile({ thread, like, onToggleLike, onOpen, onActivate, registerRef, lifted }) {
  const image = thread.media?.[0]?.type === 'IMAGE' ? thread.media[0].url : null;
  const [ratio, setRatio] = useState(RATIO_DEFAULT);
  // Kırpılmamış ham oran: öne gelen kart görselin KENDİ oranında açılsın diye.
  const [rawRatio, setRawRatio] = useState(null);

  const handleImageLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    if (naturalWidth && naturalHeight) {
      setRawRatio(naturalWidth / naturalHeight);
      setRatio(Math.min(RATIO_MAX, Math.max(RATIO_MIN, naturalWidth / naturalHeight)));
    }
  };

  return (
    <article
      ref={registerRef}
      className={styles.tile}
      data-image={image ? 'true' : undefined}
      data-lifted={lifted || undefined}
      onMouseEnter={() => onActivate(thread.id)}
      onFocus={() => onActivate(thread.id)}
    >
      {image && (
        <div className={styles.tile__media} style={{ aspectRatio: ratio }}>
          <Cover src={image} className={styles.tile__image} onLoad={handleImageLoad} />
        </div>
      )}

      <div className={styles.tile__body}>
        {thread.portal?.name && <span className={styles.tile__portal}>{thread.portal.name}</span>}
        <h3 className={styles.tile__title}>{thread.title}</h3>
        {!image && thread.excerpt && <p className={styles.tile__excerpt}>{thread.excerpt}</p>}
        <div className={styles.tile__meta}>
          <button
            type="button"
            className={styles.tile__like}
            aria-pressed={like.liked}
            aria-label={`${formatCount(like.count)}`}
            onClick={() => onToggleLike(thread)}
          >
            <HeartIcon filled={like.liked} />
            {formatCount(like.count)}
          </button>
          <span className={styles.tile__stat}>
            <CommentIcon />
            {formatCount(thread.commentCount)}
          </span>
        </div>
      </div>

      <button
        type="button"
        className={styles.tile__open}
        aria-label={thread.title}
        onClick={() => onOpen(thread, rawRatio)}
      />
    </article>
  );
}
