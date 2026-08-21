import { create } from 'zustand';

const STORAGE_KEY = 'fandoom.pageBuilder.writebackHistory';
// Sınırsız büyümesin diye üst sınır — tek bir kayıt (iki kısa string +
// birkaç alan) küçük olsa da, kalıcı hale geldiği için (aşağıya bkz.)
// sayfa hiç yenilenmeden BIRAKILMAZ artık; bir tavan olmalı.
const MAX_ENTRIES = 200;

// PageBuilder'ın "Backend'e Kaydet" geçmişi — canvas'ın kendi zundo-tracked
// undo/redo sisteminden (store.js) BİLİNÇLİ BAĞIMSIZ: bu "backend'e ne
// yazıldı" kaydı, canvas düzenleme geçmişi değil.
//
// localStorage'da KALICI (kullanıcı kararı, 2026-08-19 — önceki karar
// "session-only, sayfa yenilenince kaybolur" idi, TERS ÇEVRİLDİ). Gerçek
// çoklu-kullanıcı "kim değiştirdi" denetimi bunun kapsamı DIŞINDA kalır —
// bu sadece bu TARAYICIDA tutulan tek-kullanıcı bir iz; backend'de karşılık
// gelen bir audit-log endpoint'i yok (ayrı bir görev, bilinçli ertelendi).
//
// Aynı (entityType,entityId,field) üçlüsü birden fazla kaydedilirse, önceki
// 'active' giriş 'stale' olur — bir üçlü için HER ZAMAN en fazla bir aktif
// (geri alınabilir) giriş var, "hangi state şu an" belirsizliği olmaz.
function readFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeToStorage(entries) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // localStorage dolu/erişilemez olabilir — sessizce yok say, geçmiş bu
    // durumda sadece o oturum boyunca bellekte kalır.
  }
}

let nextId = 1;

export const useWritebackHistoryStore = create((set, get) => ({
  entries: readFromStorage(),

  addEntry: ({ entityType, entityId, field, blockId, previousValue, newValue }) => {
    const key = `${entityType}:${entityId}:${field}`;
    set((state) => {
      const entries = [
        { id: nextId++, key, entityType, entityId, field, blockId, previousValue, newValue, savedAt: Date.now(), status: 'active' },
        ...state.entries.map((e) => (e.key === key && e.status === 'active' ? { ...e, status: 'stale' } : e)),
      ].slice(0, MAX_ENTRIES);
      writeToStorage(entries);
      return { entries };
    });
    return get().entries[0];
  },

  markReverted: (id) =>
    set((state) => {
      const entries = state.entries.map((e) => (e.id === id ? { ...e, status: 'reverted' } : e));
      writeToStorage(entries);
      return { entries };
    }),

  // Geçmiş artık kalıcı olduğu için (yenileme onu otomatik temizlemiyor)
  // kullanıcının elle boşaltabileceği bir çıkış yolu şart — bkz.
  // WritebackHistoryPanel.jsx'teki "Geçmişi temizle" butonu.
  clearAll: () =>
    set(() => {
      writeToStorage([]);
      return { entries: [] };
    }),
}));
