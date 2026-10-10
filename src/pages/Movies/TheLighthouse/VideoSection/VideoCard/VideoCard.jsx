import { useTranslation } from 'react-i18next';
import PosterImage from '../PosterImage/PosterImage';
import styles from './VideoCard.module.css';

// Şerit kartı: kapak + play butonu. Tıklayınca YERİNDE oynamaz — VideoLightbox
// açılır ve çerçeve bu kartın kutusundan büyür (`frameRef` o kutuyu üst bileşene
// verir). Kartta iframe yok: sayfa hafif kalır, YouTube çerezleri oynatmadan önce
// set edilmez.
export default function VideoCard({ video, frameRef, onOpen }) {
  const { t } = useTranslation();

  return (
    <article className={styles.card}>
      <div ref={frameRef} className={styles.card__frame}>
        <button
          type="button"
          className={styles.card__poster}
          aria-label={t('series.videoPlay', { title: video.title })}
          aria-haspopup="dialog"
          onClick={onOpen}
        >
          <PosterImage youtubeId={video.youtubeId} className={styles.card__image} />
          <span className={styles.card__scrim} aria-hidden="true" />
          <span className={styles.card__play} aria-hidden="true">
            <svg className={styles.card__playIcon} viewBox="0 0 24 24" focusable="false">
              <path d="M8 5.5v13a1 1 0 0 0 1.52.85l10.4-6.5a1 1 0 0 0 0-1.7L9.52 4.65A1 1 0 0 0 8 5.5Z" />
            </svg>
          </span>
        </button>
      </div>

      <div className={styles.card__meta}>
        <h3 className={styles.card__title}>{video.title}</h3>
        <p className={styles.card__source}>
          <a className={styles.card__link} href={video.channelUrl} target="_blank" rel="noopener noreferrer">
            {video.channelName}
          </a>
          <span className={styles.card__dot} aria-hidden="true">
            •
          </span>
          <a
            className={styles.card__link}
            href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('series.videoOpenOnYoutube')}
          </a>
        </p>
      </div>
    </article>
  );
}
