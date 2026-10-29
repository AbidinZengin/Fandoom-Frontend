// PortalsIndex'in veri erişim katmanı — GET /api/community/portals (trend sırası).
// Arama istemcide süzer; dizin size'ı 50'de kırpar, portal sayısı bunu aşarsa
// sayfalama + backend `q` araması gerekir (şimdilik 9 seed). ARCHIVED portal yeni
// üye almadığı için listeye girmez.
import { getPortals } from '../../../shared/api/community';
import { setPortalMembership } from '../Portal/Portal.data';

export async function getAllPortals() {
  const res = await getPortals({ sort: 'trending', size: 50 });
  return res.content.filter((portal) => portal.status === 'ACTIVE');
}

export { setPortalMembership };
