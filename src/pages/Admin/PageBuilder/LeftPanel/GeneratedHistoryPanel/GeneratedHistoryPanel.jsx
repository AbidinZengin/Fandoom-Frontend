import { useState } from 'react';
import styles from './GeneratedHistoryPanel.module.css';

function formatRelativeTime(iso) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'az önce';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} dk önce`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} sa önce`;
  return `${Math.floor(hours / 24)} gün önce`;
}

// "Kodu Üret"ün başarılı her çağrısının KAYNAK blok ağacını listeler (bkz.
// design-server.mjs .generated.json) — BuildHistoryPanel'le AYNI kalıp,
// farkı: geri yüklenen şey Publish build'i değil, bir component'i "şablon"
// gibi tuvale açıp entity/metin değiştirip TEKRAR Kodu Üret'e basma niyeti.
// Üretilen .jsx/.css dosyası burada asla okunmaz/parse edilmez — sadece onu
// üreten ham veri.
export function GeneratedHistoryPanel({ generated, loadingGenerated, onRestore }) {
  const [confirmingId, setConfirmingId] = useState(null);

  const handleClick = (entryId) => {
    if (confirmingId === entryId) {
      onRestore(entryId);
      setConfirmingId(null);
    } else {
      setConfirmingId(entryId);
    }
  };

  return (
    <div className={styles.panel}>
      <p className={styles.hint}>
        "Kodu Üret" ile oluşturulan component'lerin kaynak tasarımı — birini tuvale geri yüklemek mevcut taslağın{' '}
        <strong>üzerine yazar</strong> (Ctrl+Z ile geri alınabilir), sonra entity/metni değiştirip tekrar üretebilirsin.
      </p>
      {loadingGenerated && <p className={styles.hint}>Yükleniyor…</p>}
      {!loadingGenerated && generated.length === 0 && <p className={styles.hint}>Henüz üretilmiş bir component yok.</p>}
      <ul className={styles.list}>
        {generated.map((entry) => (
          <li key={entry.id} className={styles.entry}>
            <div className={styles.entryHead}>
              <span className={styles.entryName}>{entry.name}</span>
              <span className={styles.entryTime}>{formatRelativeTime(entry.generatedAt)}</span>
            </div>
            <span className={styles.entryMeta}>
              {entry.path} · {entry.blocks.length} blok
            </span>
            <button type="button" onClick={() => handleClick(entry.id)} onBlur={() => setConfirmingId(null)}>
              {confirmingId === entry.id ? 'Emin misin?' : 'Taslağa Yükle'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
