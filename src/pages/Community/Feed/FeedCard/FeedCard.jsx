import { useTranslation } from 'react-i18next';
import { LocalizedLink as Link } from '../../../../shared/i18n/LocalizedLink';
import { useLang } from '../../../../shared/i18n/useLang';
import { withLangPrefix } from '../../../../shared/i18n/constants';
import { SURFACES } from '../../../../shared/data/community';
import { ThreadAuthor } from '../../ThreadAuthor/ThreadAuthor';
import { ThreadMedia } from '../../ThreadMedia/ThreadMedia';
import { ThreadActions } from '../../ThreadActions/ThreadActions';
import styles from './FeedCard.module.css';

// Tek tip kart (kullanıcı kararı, 2026-09-13): tüm yüzeyler aynı FeedCard
// şablonunu kullanır. 2026-09-19'da sosyal-medya post kartı referansına
// uyarlandı: yuvarlak koyu kart → yazar satırı → başlık + özet → medya
// mozaiği → etiketli aksiyon çubuğu (ThreadAuthor/ThreadMedia/ThreadActions
// ThreadBody ile ortak). Beğen/Kaydet gerçek uçlara bağlı (useThreadActions).
export function FeedCard({ thread }) {
  const { t } = useTranslation();
  const lang = useLang();

  const surfaceInfo = SURFACES.find((s) => s.key === thread.surface);
  const to = surfaceInfo ? `${surfaceInfo.to}/${thread.slug}` : '#';
  const shareUrl = surfaceInfo ? `${window.location.origin}${withLangPrefix(to, lang)}` : window.location.href;
  // Spoiler işaretli thread'in medyası kartta gösterilmez (detayda tıkla-aç).
  const showMedia = !thread.spoilerFlagged && thread.media?.length > 0;

  return (
    <article className={styles.feedCard}>
      <Link to={to} className={styles.feedCard__link}>
        <ThreadAuthor thread={thread} />
        <h3 className={styles.feedCard__title}>{thread.title}</h3>
        {thread.excerpt && <p className={styles.feedCard__excerpt}>{thread.excerpt}</p>}
        <span className={styles.feedCard__readMore}>{t('community.feed.readMore')}</span>
      </Link>

      {/* Link'in DIŞINDA: galeri/video/+N butonları anchor içinde iç içe interaktif olmasın. */}
      {showMedia && <ThreadMedia media={thread.media} />}

      <ThreadActions thread={thread} shareUrl={shareUrl} />
    </article>
  );
}
