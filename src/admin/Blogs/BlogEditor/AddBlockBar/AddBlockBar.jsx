import { BLOCK_TYPES, BLOCK_TYPE_LABELS, createEmptyBlock } from '../BlogEditor.data';
import styles from './AddBlockBar.module.css';

export function AddBlockBar({ onAdd }) {
  return (
    <div className={styles['addBlockBar']}>
      <span className={styles['addBlockBar__label']}>Blok ekle</span>
      {BLOCK_TYPES.map((type) => (
        <button
          key={type}
          type="button"
          className={styles['addBlockBar__button']}
          onClick={() => onAdd(createEmptyBlock(type))}
        >
          + {BLOCK_TYPE_LABELS[type]}
        </button>
      ))}
    </div>
  );
}
