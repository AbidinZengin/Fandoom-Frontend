import { useTranslation } from 'react-i18next';
import styles from './CarouselArrow.module.css';

// SpotlightCard (tek öğe, dekoratif) ve TopBlogsRow'un (çoklu öğe, gerçek
// step()) ok afordansı — onClick/disabled opsiyonel, verilmezse (Spotlight'ta
// olduğu gibi) salt görsel kalır.
export function CarouselArrow({ direction = 'next', onClick, disabled = false }) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      className={styles.arrow}
      data-direction={direction}
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === 'prev' ? t('common.previous') : t('common.next')}
    >
      {direction === 'prev' ? '‹' : '›'}
    </button>
  );
}
