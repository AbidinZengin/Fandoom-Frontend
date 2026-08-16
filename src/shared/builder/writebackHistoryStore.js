import { create } from 'zustand';

// PageBuilder'ın "Backend'e Kaydet" geçmişi — canvas'ın kendi zundo-tracked
// undo/redo sisteminden (store.js) BİLİNÇLİ BAĞIMSIZ: bu "backend'e ne
// yazıldı" kaydı, canvas düzenleme geçmişi değil. Sadece bellekte
// (session-only, kullanıcı kararı) — sayfa yenilenince kaybolur.
//
// Aynı (entityType,entityId,field) üçlüsü birden fazla kaydedilirse, önceki
// 'active' giriş 'stale' olur — bir üçlü için HER ZAMAN en fazla bir aktif
// (geri alınabilir) giriş var, "hangi state şu an" belirsizliği olmaz.
let nextId = 1;

export const useWritebackHistoryStore = create((set, get) => ({
  entries: [],

  addEntry: ({ entityType, entityId, field, blockId, previousValue, newValue }) => {
    const key = `${entityType}:${entityId}:${field}`;
    set((state) => ({
      entries: [
        { id: nextId++, key, entityType, entityId, field, blockId, previousValue, newValue, savedAt: Date.now(), status: 'active' },
        ...state.entries.map((e) => (e.key === key && e.status === 'active' ? { ...e, status: 'stale' } : e)),
      ],
    }));
    return get().entries[0];
  },

  markReverted: (id) =>
    set((state) => ({
      entries: state.entries.map((e) => (e.id === id ? { ...e, status: 'reverted' } : e)),
    })),
}));
