// TopPortals'ın veri erişim katmanı — gerçek GET /api/community/portals (en trend 5).
// Trend formülü backend'de (3*yeniThread(7g) + yeniYorum(7g)); ARCHIVED portal
// yeni üye almadığı için vitrine girmez.
import { getPortals } from '../../../../shared/api/community';
import { setPortalMembership } from '../../Portal/Portal.data';

export async function getTopPortals() {
  const res = await getPortals({ sort: 'trending', size: 10 });
  return res.content.filter((portal) => portal.status === 'ACTIVE');
}

export { setPortalMembership };
