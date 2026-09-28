// Yapım sayfası portal vitrininin veri kaynağı — gerçek Community uçları:
// GET /community/portals (liste) + GET /community/feed?portal=&sort=new.
// Her yapımın portalı OLMAYABİLİR ve bir portal birden çok yapımı kapsayabilir
// (Westeros = GoT + HotD), bu yüzden portal slug'ı varsayılmaz: portal,
// `productionSlugs`ı yapımı içeren ilk portal olarak bulunur (en kalabalıktan
// başlayarak). Bulunamazsa null döner ve bölüm hiç basılmaz. Liste öğesi
// (PortalSummaryResponse) header'ın ihtiyacı olan tüm alanları taşıdığı için
// ayrıca detay ucu çağrılmaz. Dizin size'ı 50'de kırpar — portal sayısı bunu
// aşarsa arama/sayfalama gerekir (şimdilik 9 seed).
import { getPortals } from '../../../../shared/api/community';
import { setPortalMembership } from '../../../Community/Portal/Portal.data';
import { getFeedThreads } from '../../../Community/Feed/Feed.data';

export async function getPortalBanner(productionSlug) {
  const res = await getPortals({ sort: 'members', size: 50 });
  const portal = res.content.find(
    (item) => item.status !== 'HIDDEN' && item.productionSlugs?.includes(productionSlug),
  );
  if (!portal) return null;
  // Vitrin: portalın en yeni 2 gönderisi (Recent Discussions) — tür süzülmez,
  // teori olmak zorunda değil.
  const { threads } = await getFeedThreads({ sort: 'new', size: 2, portal: portal.slug });
  return { portal, threads };
}

export { setPortalMembership };
