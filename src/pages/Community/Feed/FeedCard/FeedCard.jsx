import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LocalizedLink as Link } from '../../../../shared/i18n/LocalizedLink';
import { useLang } from '../../../../shared/i18n/useLang';
import { withLangPrefix } from '../../../../shared/i18n/constants';
import { threadPath } from '../../threadLink';
import { ThreadAuthor } from '../../ThreadAuthor/ThreadAuthor';
import { ThreadTags } from '../../ThreadTags/ThreadTags';
import { ThreadMenu } from '../../ThreadMenu/ThreadMenu';
import { ThreadMedia } from '../../ThreadMedia/ThreadMedia';
import { ThreadActions } from '../../ThreadActions/ThreadActions';
import { RichText } from '../../RichText/RichText';
import { StarIcon } from '../../ThreadIcons';
import styles from './FeedCard.module.css';

// Tek tip kart (kullanıcı kararı, 2026-09-13): tüm yüzeyler aynı FeedCard
// şablonunu kullanır. 2026-09-19'da sosyal-medya post kartı referansına
// uyarlandı: yuvarlak koyu kart → yazar satırı → başlık + özet → medya
// mozaiği → etiketli aksiyon çubuğu (ThreadAuthor/ThreadMedia/ThreadActions
// ThreadBody ile ortak). Beğen/Kaydet gerçek uçlara bağlı (useThreadActions).
// `featured`: Hot sıralamanın gerçek verisinden türetilir (ilk sıradaki, etkileşimi
// olan thread) — backend'de sabitleme alanı olmadığı için uydurma veri YOK.
// `enterDelay` (ms): giriş animasyonundaki kademe gecikmesi — grup içi sırayla verilir.
// Spoiler ([[topluluk-spoiler]]): özet bulanık + tıkla-aç (HOVER değil); medya
// açılana dek hiç render edilmez.
export function FeedCard({ thread, featured = false, enterDelay = 0 }) {
  const { t } = useTranslation();
  const lang = useLang();
  const excerptRef = useRef(null);
  const [revealed, setRevealed] = useState(!thread.spoilerFlagged);
  // Özet 3 satıra sığmayıp kesildiyse alt kenarı soldurulur; genişlik değişince
  // (responsive) yeniden ölçülür.
  const [truncated, setTruncated] = useState(false);

  const to = threadPath(thread);
  const shareUrl = to !== '#' ? `${window.location.origin}${withLangPrefix(to, lang)}` : window.location.href;
  const showMedia = revealed && thread.media?.length > 0;
  const showGate = !revealed;

  useEffect(() => {
    const element = excerptRef.current;
    if (!element) return undefined;
    const measure = () => setTruncated(element.scrollHeight > element.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [thread.excerpt, revealed]);

  return (
    <article
      className={styles.feedCard}
      data-featured={featured || undefined}
      style={{ '--enter-delay': `${enterDelay}ms` }}
    >
      {featured && (
        <span className={styles.feedCard__badge}>
          <StarIcon />
          {t('community.feed.featured')}
        </span>
      )}
      <ThreadMenu thread={thread} shareUrl={shareUrl} />

      <ThreadAuthor thread={thread} />
      <Link to={to} className={styles.feedCard__link}>
        <h3 className={styles.feedCard__title}>{thread.title}</h3>
      </Link>

      <ThreadTags thread={thread} />

      {showGate ? (
        <button type="button" className={styles.feedCard__spoilerGate} onClick={() => setRevealed(true)}>
          {thread.excerpt && (
            <span className={styles.feedCard__spoilerText} aria-hidden="true">
              {thread.excerpt}
            </span>
          )}
          <span className={styles.feedCard__spoilerLabel}>{t('community.thread.spoilerReveal')}</span>
        </button>
      ) : (
        <Link to={to} className={styles.feedCard__link}>
          {thread.excerpt && (
            <p ref={excerptRef} className={styles.feedCard__excerpt} data-truncated={truncated || undefined}>
              <RichText text={thread.excerpt} />
            </p>
          )}
          <span className={styles.feedCard__readMore}>{t('community.feed.readMore')}</span>
        </Link>
      )}

      {/* Link'in DIŞINDA: galeri/video/+N butonları anchor içinde iç içe interaktif olmasın. */}
      {showMedia && <ThreadMedia media={thread.media} />}

      <ThreadActions thread={thread} shareUrl={shareUrl} />
    </article>
  );
}
