// CommunitySpotlight'ın veri erişim katmanı — gerçek /api/community uçlarına bağlı.
// Yan işler bağımsız: odalar/sayaçlar bir kez, thread'ler sekme/sıralama değişince
// (component önbelleğiyle) çekilir. Hata → sessizce boş (sahte içerik yok).
import { getFeed, getPortals } from '../../../shared/api/community';

const THREAD_LIMIT = 6;
const PORTAL_LIMIT = 8;

// surface: 'ALL' | 'DISCUSSION' | 'THEORY' | 'FAN_ART'; sort: 'hot' | 'new' | 'top'.
// Spoiler işaretli thread'in başlığı/görseli spoiler olabilir — vitrine girmez.
// null → istek düştü (çağıran "yüklenemedi" ile "boş"u ayırt edebilsin).
export async function getCommunityThreads({ surface = 'ALL', sort = 'hot' } = {}) {
  try {
    const res = await getFeed({
      surface: surface === 'ALL' ? undefined : surface,
      sort,
      size: THREAD_LIMIT + 4, // spoiler elenince 6'ya yetsin
    });
    return res.content.filter((t) => !t.spoilerFlagged).slice(0, THREAD_LIMIT);
  } catch {
    return null;
  }
}

export async function getCommunityMeta() {
  try {
    const res = await getPortals({ sort: 'trending', size: 20 });
    const active = res.content.filter((p) => p.status === 'ACTIVE');
    return {
      portals: active.slice(0, PORTAL_LIMIT),
      // Gerçek toplamlar (sahte sayı yok); 0 olan sayaç component'te gizlenir.
      stats: {
        members: active.reduce((sum, p) => sum + p.memberCount, 0),
        discussions: active.reduce((sum, p) => sum + p.threadCount, 0),
        portals: active.length,
      },
    };
  } catch {
    return null;
  }
}
