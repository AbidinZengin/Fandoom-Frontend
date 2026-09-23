import { create } from 'zustand';

// Katıl/Ayrıl sonrası sol menüdeki "Portallarım" ile sağ menüdeki "Top Portals"
// (ve portal sayfası) tazelenmelidir — üçü de CommunityLayout içinde aynı anda
// yaşar, birbirini doğrudan tanımaz. `version` her üyelik değişiminde artar;
// dinleyenler bunu effect bağımlılığı yapıp listelerini yeniden çeker.
export const useMyPortalsStore = create((set) => ({
  version: 0,
  bump: () => set((state) => ({ version: state.version + 1 })),
}));
