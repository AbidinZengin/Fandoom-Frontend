// RecentActivity'nin veri erişim katmanı — gerçek GET /api/community/feed?sort=new.
// Backend'de ayrı bir etkinlik akışı yok; yalnız "yeni konu açıldı" olayı
// gösterilebilir (yorum olayı için thread+yorum birleşik bir uç gerekir).
import { getFeedThreads } from '../../Feed/Feed.data';

const LATEST_COUNT = 4;

export async function getLatestThreads() {
  const { threads } = await getFeedThreads({ sort: 'new', page: 0, size: LATEST_COUNT });
  return threads;
}
