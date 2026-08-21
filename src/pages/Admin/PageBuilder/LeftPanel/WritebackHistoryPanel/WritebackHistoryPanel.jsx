import { useMemo, useState } from 'react';
import { useWritebackHistoryStore } from '../../../../../shared/builder/writebackHistoryStore';
import { revertWritebackEntry } from '../../../../../shared/builder/entityWriteback';
import { getComponentDefinition } from '../../../../../shared/builder/registry';
import { ENTITY_SCHEMAS } from '../../../../../shared/builder/entitySchemas';
import styles from './WritebackHistoryPanel.module.css';

const STATUS_LABEL = { active: 'Geri Al', stale: 'Eskimiş', reverted: 'Geri alındı' };

function formatValue(value) {
  const text = value == null || value === '' ? '(boş)' : String(value);
  return text.length > 40 ? `${text.slice(0, 40)}…` : text;
}

function formatRelativeTime(ts) {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return 'az önce';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} dk önce`;
  const hours = Math.floor(minutes / 60);
  return `${hours} sa önce`;
}

// LeftPanel'in "Geçmiş" sekmesi — bu oturumda yapılan HER "Backend'e
// Kaydet" işlemini listeler + geri alma (bkz. writebackHistoryStore.js
// yorumu: canvas'ın kendi undo/redo'sundan bağımsız, sadece bellekte).
// `blocks`/`onRestoreBlockContent` PageBuilder.jsx'ten geliyor — geri alma
// sadece backend kaydını değil, blok hâlâ aynı alana bağlıysa canvas
// içeriğini de senkronlar (bkz. entityWriteback.js revertWritebackEntry).
export function WritebackHistoryPanel({ blocks, onRestoreBlockContent }) {
  const entries = useWritebackHistoryStore((s) => s.entries);
  const clearAll = useWritebackHistoryStore((s) => s.clearAll);
  const [revertingId, setRevertingId] = useState(null);
  const [errorId, setErrorId] = useState(null);

  const blocksById = useMemo(() => Object.fromEntries(blocks.map((b) => [b.id, b])), [blocks]);

  const handleRevert = async (entry) => {
    setRevertingId(entry.id);
    setErrorId(null);
    try {
      const block = blocksById[entry.blockId];
      const shouldSync = await revertWritebackEntry(entry, block);
      if (shouldSync) {
        const definition = getComponentDefinition(block.componentType);
        if (definition?.bindableField) {
          onRestoreBlockContent(entry.blockId, { ...block.content, [definition.bindableField.key]: entry.previousValue });
        }
      }
    } catch {
      setErrorId(entry.id);
    } finally {
      setRevertingId(null);
    }
  };

  if (entries.length === 0) {
    return (
      <div className={styles.panel}>
        <p className={styles.hint}>Henüz "Backend'e Kaydet" ile yapılmış bir değişiklik yok.</p>
      </div>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.headRow}>
        <p className={styles.hint}>Bu tarayıcıda kalıcı — farklı cihaz/tarayıcıda görünmez.</p>
        <button type="button" className={styles.clearButton} onClick={clearAll}>
          Temizle
        </button>
      </div>
      <ul className={styles.list}>
        {entries.map((entry) => (
          <li key={entry.id} className={styles.entry} data-status={entry.status}>
            <span className={styles.entryLabel}>
              {ENTITY_SCHEMAS[entry.entityType]?.label ?? entry.entityType} #{entry.entityId} · {entry.field}
            </span>
            <span className={styles.entryDiff}>
              "{formatValue(entry.previousValue)}" → "{formatValue(entry.newValue)}"
            </span>
            <div className={styles.entryFooter}>
              <span className={styles.entryTime}>{formatRelativeTime(entry.savedAt)}</span>
              <button type="button" onClick={() => handleRevert(entry)} disabled={entry.status !== 'active' || revertingId === entry.id}>
                {revertingId === entry.id ? 'Geri alınıyor…' : STATUS_LABEL[entry.status]}
              </button>
            </div>
            {errorId === entry.id && <p className={styles.error}>Geri alınamadı, tekrar dene.</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
