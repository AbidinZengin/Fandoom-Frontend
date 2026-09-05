import { useTranslation } from 'react-i18next';
import styles from './CarouselArrow.module.css';

// Sitede Explore CTA'larının kullandığı ok ikonuyla AYNI SVG (bkz.
// BreakingBad/HouseOfTheDragon/SeriesHero ArrowIcon) — düz "‹ ›" karakteri
// DEĞİL (kullanıcı isteği, 2026-09-05). 'prev' için 180° döndürülür.
function ArrowIcon({ direction }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="3.33"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={direction === 'prev' ? { transform: 'rotate(180deg)' } : undefined}
    >
      <line x1="4.5" y1="12" x2="19" y2="12" />
      <polyline points="13.5 6.5 19.5 12 13.5 17.5" />
    </svg>
  );
}

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
      <ArrowIcon direction={direction} />
    </button>
  );
}
