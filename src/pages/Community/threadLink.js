import { SURFACES } from '../../shared/data/community';

// Thread'in detay yolu (dil öneksiz) — FeedCard/FeedRow/FeedTile ortak kullanır.
// Hibrit URL (Portal = Oda kararı): /portal/{portalSlug}/post/{id}-{slug} —
// backend yalnız id'yi kullanır, slug SEO süsüdür (ThreadDetail uyuşmazsa
// kanonik URL'e replace eder). Portal bilgisi gelmemişse (teorik) eski
// /community/<yüzey>/<slug> yoluna düşer; o da ThreadDetail'de çalışır.
export function threadPath(thread) {
  if (thread.portal?.slug) return `/portal/${thread.portal.slug}/post/${thread.id}-${thread.slug}`;
  const surfaceInfo = SURFACES.find((s) => s.key === thread.surface);
  return surfaceInfo ? `${surfaceInfo.to}/${thread.slug}` : '#';
}
