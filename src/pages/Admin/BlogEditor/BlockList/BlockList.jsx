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

  const moveUp = (key) => {
    const idx = blocks.findIndex((b) => b._key === key);
    if (idx > 0) {
      const newBlocks = [...blocks];
      const temp = newBlocks[idx - 1];
      newBlocks[idx - 1] = newBlocks[idx];
      newBlocks[idx] = temp;
      onChange(newBlocks);
      onCommit();
    }
  };

  const moveDown = (key) => {
    const idx = blocks.findIndex((b) => b._key === key);
    if (idx < blocks.length - 1) {
      const newBlocks = [...blocks];
      const temp = newBlocks[idx + 1];
      newBlocks[idx + 1] = newBlocks[idx];
      newBlocks[idx] = temp;
      onChange(newBlocks);
      onCommit();
    }
  };

  return (
    <div className={styles.canvasWrap}>
      <div className={styles.canvas}>
        {blocks.length === 0 && <p className={styles.canvas__empty}>No blocks yet — add one below.</p>}
        {blocks.map((block, index) => (
          <BlockItem
            key={block._key}
            block={block}
            onChange={(next) => patchBlock(block._key, next)}
            onRemove={() => removeBlock(block._key)}
            onCommit={onCommit}
            onMoveUp={() => moveUp(block._key)}
            onMoveDown={() => moveDown(block._key)}
            isFirst={index === 0}
            isLast={index === blocks.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
