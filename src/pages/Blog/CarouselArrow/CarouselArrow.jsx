import styles from './CarouselArrow.module.css';

// SpotlightCard (tek öğe, dekoratif) ve TopBlogsRow'un (çoklu öğe, gerçek
// step()) ok afordansı — onClick/disabled opsiyonel, verilmezse (Spotlight'ta
// olduğu gibi) salt görsel kalır.
export function CarouselArrow({ direction = 'next', onClick, disabled = false }) {
  return (
    <button
      type="button"
      className={styles.arrow}
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === 'prev' ? 'Previous' : 'Next'}
    >
      {direction === 'prev' ? '‹' : '›'}
    </button>
  );
}
