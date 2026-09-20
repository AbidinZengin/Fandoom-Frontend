import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CommentIcon, HeartIcon, LinkIcon, BookmarkIcon } from '../ThreadIcons';
import { formatCount } from '../formatCount';
import { useThreadActions } from '../useThreadActions';
import { AnimatedCount } from './AnimatedCount/AnimatedCount';
import styles from './ThreadActions.module.css';

// i18n etiketini ("1 Like") sayı + metin diye böler: sayı kısmı AnimatedCount
// olur, kalan metin (çoğul eki dahil) olduğu gibi kalır. Etiket biçimli sayıyı
// içermiyorsa (beklenmedik çeviri) düz metin döner.
function CountLabel({ count, labelKey }) {
  const { t } = useTranslation();
  const formatted = formatCount(count);
  const label = t(labelKey, { count, formatted });
  const at = label.indexOf(formatted);
  if (at < 0) return label;
  return (
    <>
      {label.slice(0, at)}
      <AnimatedCount count={count} text={formatted} />
      {label.slice(at + formatted.length)}
    </>
  );
}

// Thread kartının alt çubuğu (FeedCard + ThreadBody ortak), referans düzeni:
// yorum / beğeni / paylaş / kaydet — ikon + etiketli sayaç. Paylaş için
// backend'de sayaç YOK (sahte veri yazılmaz), sadece bağlantıyı kopyalar.
export function ThreadActions({ thread, shareUrl }) {
  const { t } = useTranslation();
  const { liked, likeCount, saved, saveCount, toggleLike, toggleSave } = useThreadActions(thread);
  const [copied, setCopied] = useState(false);
  // Beğen/kaydet "pop": yalnız kullanıcı AKTİF hâle getirdiğinde oynar (sayfa
  // yüklenirken zaten beğenilmiş kartlar zıplamasın). Güncelleme zaten anında
  // (optimistic, useThreadActions); pop animasyon bitince temizlenir.
  const [pop, setPop] = useState(null);
  // Sayaç (AnimatedCount) animasyonları da bubble eder — yalnız ikonun bitişi temizler.
  const clearPop = (event) => {
    if (event.target instanceof SVGElement) setPop(null);
  };
  const commentCount = thread.commentCount ?? 0;

  const handleShare = () => {
    navigator.clipboard?.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className={styles.threadActions}>
      {/* Sol: ana etkileşimler (yorum, beğeni, paylaş); sağ: kişisel eylem (kaydet). */}
      <div className={styles.threadActions__group}>
        <span className={styles.threadActions__item}>
          <CommentIcon />
          <CountLabel count={commentCount} labelKey="community.feed.comments" />
        </span>
        <button
          type="button"
          className={styles.threadActions__item}
          data-active={liked}
          data-pop={pop === 'like' || undefined}
          onClick={() => {
            if (!liked) setPop('like');
            toggleLike();
          }}
          onAnimationEnd={clearPop}
        >
          <HeartIcon filled={liked} />
          <CountLabel count={likeCount} labelKey="community.feed.likes" />
        </button>
        <button type="button" className={styles.threadActions__item} onClick={handleShare}>
          <LinkIcon />
          {copied ? t('community.thread.linkCopied') : t('community.thread.share')}
        </button>
      </div>
      <button
        type="button"
        className={styles.threadActions__item}
        data-active={saved}
        data-pop={pop === 'save' || undefined}
        onClick={() => {
          if (!saved) setPop('save');
          toggleSave();
        }}
        onAnimationEnd={clearPop}
      >
        <BookmarkIcon filled={saved} />
        <CountLabel count={saveCount} labelKey="community.feed.saved" />
      </button>
    </div>
  );
}
