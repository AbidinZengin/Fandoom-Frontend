import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ThreadAuthor } from '../../ThreadAuthor/ThreadAuthor';
import { ThreadTags } from '../../ThreadTags/ThreadTags';
import { ThreadMenu } from '../../ThreadMenu/ThreadMenu';
import { RichText } from '../../RichText/RichText';
import { ThreadMedia } from '../../ThreadMedia/ThreadMedia';
import { ThreadActions } from '../../ThreadActions/ThreadActions';
import styles from './ThreadBody.module.css';

// FeedCard ile aynı sosyal-post kartı dili (2026-09-19): yazar satırı →
// başlık → metin → medya mozaiği → aksiyon çubuğu. [[topluluk-spoiler]]:
// tıkla-aç, HOVER değil — metin ve medya aynı kapının arkasında. Medya yoksa
// FAN_ART için kesik çerçeveli "beklemede" iskeleti durur (learned-rules [veri]).
export function ThreadBody({ thread }) {
  const { t } = useTranslation();
  const [revealed, setRevealed] = useState(!thread.spoilerFlagged);
  const hasMedia = thread.media?.length > 0;

  return (
    <article className={styles.threadBody}>
      <ThreadMenu thread={thread} shareUrl={window.location.href} />
      <ThreadAuthor thread={thread} />

      {/* h2: sayfa h1'i CommunityLayout'taki "Community" başlığıdır (iki h1 olmasın). */}
      <h2 className={styles.threadBody__title}>{thread.title}</h2>

      <ThreadTags thread={thread} />

      {thread.body &&
        (revealed ? (
          <div className={styles.threadBody__text}>
            {thread.body.split('\n\n').map((paragraph, index) => (
              <p key={index}>
                <RichText text={paragraph} />
              </p>
            ))}
          </div>
        ) : (
          <button type="button" className={styles.threadBody__spoilerGate} onClick={() => setRevealed(true)}>
            {t('community.thread.spoilerReveal')}
          </button>
        ))}

      {hasMedia
        ? revealed && <ThreadMedia media={thread.media} />
        : thread.surface === 'FAN_ART' && <div className={styles.threadBody__placeholder} aria-hidden="true" />}

      <ThreadActions thread={thread} shareUrl={window.location.href} />
    </article>
  );
}
