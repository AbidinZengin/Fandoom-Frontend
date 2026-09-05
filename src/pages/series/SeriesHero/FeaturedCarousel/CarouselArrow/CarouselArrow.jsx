import { useTranslation } from 'react-i18next';
import styles from './CarouselArrow.module.css';

// Blog/CarouselArrow.jsx'in BİREBİR kopyası (kullanıcı isteği) — henüz
// ikinci sayfada aynı component'e taşınmadığı için colocate kaldı, ortak
// kullanım kesinleşince src/components'e terfi ayrı bir görevdir.
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
