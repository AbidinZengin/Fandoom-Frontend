import { BLOCK_TYPES, BLOCK_TYPE_LABELS, createEmptyBlock } from '../BlogEditor.data';
import styles from './AddBlockBar.module.css';

export function AddBlockBar({ onAdd }) {
  const handleAdd = (type) => {
    onAdd(createEmptyBlock(type));
  };

  return (
    <div className={styles.addBlockBar}>
      {BLOCK_TYPES.map((type) => (
        <button
          key={type}
          type="button"
          className={styles.addBlockBar__button}
          onClick={() => handleAdd(type)}
        >
          + {BLOCK_TYPE_LABELS[type]}
        </button>
      ))}
    </div>
  );
}
