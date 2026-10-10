import { BlockItem } from './BlockItem/BlockItem';
import styles from './BlockList.module.css';

export function BlockList({ blocks, onChange, onCommit }) {
  const patchBlock = (key, next) => {
    onChange(blocks.map((b) => (b._key === key ? next : b)));
  };

  const removeBlock = (key) => {
    onChange(blocks.filter((b) => b._key !== key));
    onCommit();
  };

  // `from` indeksindeki bloğu `to` indeksine alır (komşu takası).
  const swap = (from, to) => {
    if (to < 0 || to >= blocks.length) return;
    const next = [...blocks];
    [next[from], next[to]] = [next[to], next[from]];
    onChange(next);
    onCommit();
  };

  return (
    <div className={styles['blockList']}>
      {blocks.length === 0 && (
        <p className={styles['blockList__empty']}>Henüz blok yok, aşağıdan ekle.</p>
      )}
      {blocks.map((block, index) => (
        <BlockItem
          key={block._key}
          block={block}
          onChange={(next) => patchBlock(block._key, next)}
          onRemove={() => removeBlock(block._key)}
          onCommit={onCommit}
          onMoveUp={() => swap(index, index - 1)}
          onMoveDown={() => swap(index, index + 1)}
          isFirst={index === 0}
          isLast={index === blocks.length - 1}
        />
      ))}
    </div>
  );
}
