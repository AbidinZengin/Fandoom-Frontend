import { SURFACES } from '../../shared/data/community';

// Thread'in detay yolu (dil öneksiz) — FeedCard/FeedRow/FeedTile ortak kullanır.
// Yüzey bulunamazsa '#'.
export function threadPath(thread) {
  const surfaceInfo = SURFACES.find((s) => s.key === thread.surface);
  return surfaceInfo ? `${surfaceInfo.to}/${thread.slug}` : '#';
}
