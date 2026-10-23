import { create } from 'zustand';

// Özel listeler (CUSTOM) birden çok yerde ayrı kopyalarla yaşar: Community sol
// kolonundaki "Listelerim" şeritleri, liste yönetim sayfası ve içerik sayfalarındaki
// "Listeye ekle" penceresi birbirini doğrudan tanımaz. Liste oluşturma/silme/
// düzenleme sonrası `bump()` çağrılır; dinleyenler `version`'ı effect bağımlılığı
// yapıp listelerini yeniden çeker (useMyPortalsStore ile aynı desen).
export const useMyListsStore = create((set) => ({
  version: 0,
  bump: () => set((state) => ({ version: state.version + 1 })),
}));
