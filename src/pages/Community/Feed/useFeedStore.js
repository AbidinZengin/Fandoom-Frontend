import { create } from 'zustand';

// Feed listelerinin oturum-içi önbelleği (PRD: görünüm/sekme değişiminde ve
// detaydan geri dönüşte gereksiz fetch YOK). Anahtar: portal + yüzey + sıralama — Card/
// List/Grid görünümü yalnız yüzeyden türediği için (Feed.jsx VIEWS) görünüm
// değişimi veri değil sadece render değiştirir; daha önce açılmış bir sekmeye
// dönüş anında, ağ isteği olmadan gelir. Yeni paket değil: projede zustand zaten var.
// `scrollY`: detaya giden liste, geri (POP) dönüşte kaldığı yere döner
// ([[topluluk-feed]] scroll-restoration kuralı).
export const FEED_STALE_MS = 5 * 60 * 1000;

// Portal sayfası kendi listesini tutar (aynı yüzey+sıralama farklı portalda
// farklı veridir) — /community akışı `all` kovasında kalır.
export const feedKey = (surface, sort, portal) => `${portal ?? 'all'}:${surface ?? 'ALL'}:${sort}`;

// Önbellek sınırsız şişmesin: en fazla 5 kova tutulur, aşılınca `loadedAt`'i en
// eski olan (LRU'ya yakın, en eski yüklenen) atılır.
const MAX_ENTRIES = 5;

export const useFeedStore = create((set) => ({
  sort: 'hot',
  entries: {},
  setSort: (sort) => set({ sort }),
  save: (key, patch) =>
    set((state) => {
      const entries = { ...state.entries, [key]: { ...state.entries[key], ...patch } };
      const keys = Object.keys(entries);
      if (keys.length > MAX_ENTRIES) {
        // Henüz `loadedAt`'i olmayan kova (yalnız scrollY yazılmış) 0 sayılır; az önce
        // yazılan kova ise asla atılmaz.
        const oldest = keys
          .filter((existing) => existing !== key)
          .reduce((a, b) => ((entries[a].loadedAt ?? 0) <= (entries[b].loadedAt ?? 0) ? a : b));
        delete entries[oldest];
      }
      return { entries };
    }),
  // Beğeni/kaydet sunucudan onaylanınca önbellekteki kopya da güncellenir —
  // detaydan dönünce liste eski sayaçları göstermesin.
  patchThread: (id, patch) =>
    set((state) => ({
      entries: Object.fromEntries(
        Object.entries(state.entries).map(([key, entry]) => [
          key,
          { ...entry, threads: entry.threads?.map((thread) => (thread.id === id ? { ...thread, ...patch } : thread)) },
        ]),
      ),
    })),
  // Yeni post sonrası tüm listeler geçersizdir (yeni kayıt hangi sırada nereye girer bilinmez).
  invalidate: () => set({ entries: {} }),
}));
