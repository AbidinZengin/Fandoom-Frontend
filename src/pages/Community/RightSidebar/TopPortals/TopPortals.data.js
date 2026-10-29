// TopPortals'ın veri erişim katmanı — gerçek GET /api/community/portals (en trend 5).
// Trend formülü backend'de (3*yeniThread(7g) + yeniYorum(7g)); ARCHIVED portal
// yeni üye almadığı için vitrine girmez. ARCHIVED süzüldükten sonra ilk 5 kalır
// (süzme sonrası eksik kalmasın diye 10 çekilir); devamı /portal sayfasında.
import { getPortals } from '../../../../shared/api/community';
import { setPortalMembership } from '../../Portal/Portal.data';

const TOP_COUNT = 5;

export async function getTopPortals() {
  const res = await getPortals({ sort: 'trending', size: 10 });
  return res.content.filter((portal) => portal.status === 'ACTIVE').slice(0, TOP_COUNT);
}

export { setPortalMembership };
