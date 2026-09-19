import { useTranslation } from 'react-i18next';
import { SORT_OPTIONS } from '../Feed.data';
import styles from './SortBar.module.css';

// learned-rules [[topluluk-feed]]: en fazla 3-4 sıralama seçeneği, net
// varsayılan (Hot).
export function SortBar({ sort, onChange }) {
  const { t } = useTranslation();

  return (
    <div className={styles.sortBar}>
      {SORT_OPTIONS.map((option) => (
        <button
          key={option}
          type="button"
          className={styles.sortBar__button}
          data-active={sort === option}
          onClick={() => onChange(option)}
        >
          {t(`community.feed.sort.${option}`)}
        </button>
      ))}
    </div>
  );
}
