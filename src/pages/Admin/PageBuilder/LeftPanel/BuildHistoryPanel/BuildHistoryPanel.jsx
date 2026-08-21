import { useState } from 'react';
import styles from './BuildHistoryPanel.module.css';

function formatRelativeTime(iso) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'az önce';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} dk önce`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} sa önce`;
  return `${Math.floor(hours / 24)} gün önce`;
}

// TopBar'ın "Publish" butonuyla oluşan build geçmişi — LeftPanel'in
// "Geçmiş" sekmesinde WritebackHistoryPanel'in ÜSTÜNDE render edilir
// (bkz. LeftPanel.jsx). Bu geçmiş üzerinde ÇALIŞMAK için değil, sadece
// GÖRÜNTÜLEMEK/geri yüklemek için — düzenleme her zaman taslakta olur.
//
// "Taslağa Yükle" mevcut taslağın ÜZERİNE yazar — yanlışlıkla tıklamayı
// önlemek için çift-tık onay deseni (proje genelinde modal/confirm()
// kullanılmıyor, bu yüzden aynı butona ikinci tıkla onaylanır).
export function BuildHistoryPanel({ builds, loadingBuilds, onRestore }) {
  const [confirmingId, setConfirmingId] = useState(null);

  const handleClick = (buildId) => {
    if (confirmingId === buildId) {
      onRestore(buildId);
      setConfirmingId(null);
    } else {
      setConfirmingId(buildId);
    }
  };

  return (
    <div className={styles.panel}>
      <p className={styles.hint}>
        "Publish" ile oluşan build'ler — bir tanesini seçmek mevcut taslağın <strong>üzerine yazar</strong> (Ctrl+Z ile geri alınabilir).
      </p>
      {loadingBuilds && <p className={styles.hint}>Yükleniyor…</p>}
      {!loadingBuilds && builds.length === 0 && <p className={styles.hint}>Henüz yayınlanmış bir build yok.</p>}
      <ul className={styles.list}>
        {builds.map((build) => (
          <li key={build.id} className={styles.entry}>
            <span className={styles.entryTime}>{formatRelativeTime(build.publishedAt)}</span>
            <span className={styles.entryMeta}>{build.blocks.length} blok</span>
            <button type="button" onClick={() => handleClick(build.id)} onBlur={() => setConfirmingId(null)}>
              {confirmingId === build.id ? 'Emin misin?' : 'Taslağa Yükle'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
