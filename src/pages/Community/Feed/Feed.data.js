// Feed'in veri erişim katmanı — gerçek /api/community/** uçlarına bağlı
// (mock thread seti ve localStorage optimistic kaldırıldı). Component'ler
// backend cevabına değil, buradaki kart şekline (author string) bağlıdır.
import { getFeed, getPortal, getPortals, getThread, joinPortal, leavePortal, postThread } from '../../../shared/api/community';

// FeedCard ve ThreadBody arasında paylaşılan zaman etiketi — ikisi de aynı
// thread verisini gösterir, tek yerde tanımlı.
export function timeAgo(iso, t) {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return t('community.feed.timeJustNow');
  if (minutes < 60) return t('community.feed.timeMinutesAgo', { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('community.feed.timeHoursAgo', { count: hours });
  return t('community.feed.timeDaysAgo', { count: Math.floor(hours / 24) });
}

export const SORT_OPTIONS = ['hot', 'new', 'top'];

// ThreadSummaryResponse / ThreadDetailResponse → kart şekli. `id` numeric
// Thread.id (Comments subjectId'si + hibrit URL'in kimliği), `slug` URL'in
// süsü. `portal` {slug, name} her thread cevabında gelir. Profili
// silinmiş yazarda author null gelir — kart "unknown" etiketine düşer.
function toThreadCard(res) {
  return {
    id: res.id,
    slug: res.slug,
    surface: res.surface,
    title: res.title,
    excerpt: res.excerpt ?? (res.body ? res.body.slice(0, 200) : ''),
    body: res.body ?? undefined,
    author: res.author?.username ?? undefined,
    authorAvatarUrl: res.author?.avatarUrl ?? undefined,
    bookmarkCount: res.bookmarkCount ?? 0,
    likeCount: res.likeCount ?? 0,
    commentCount: res.commentCount ?? 0,
    isLiked: res.isLiked ?? false,
    isBookmarked: res.isBookmarked ?? false,
    tags: res.tags ?? [],
    // [{type: 'IMAGE'|'VIDEO', url, position}] — eski tek-görselli thread'ler
    // de burada tek elemanlı IMAGE olarak gelir, imageUrl'e ayrıca bakılmaz.
    media: res.media ?? [],
    spoilerFlagged: res.spoilerFlagged ?? false,
    productionSlug: res.productionSlug ?? undefined,
    portal: res.portal ?? undefined,
    createdAt: res.createdAt,
  };
}

export async function getFeedThreads({ surface, sort, page, size, portal }) {
  const res = await getFeed({ surface, sort, page, size, portal });
  return { threads: res.content.map(toThreadCard), hasMore: !res.last };
}

// 404 (yok / DELETED / HIDDEN / portalı HIDDEN) → null; diğer hatalar çağırana
// fırlar. `idOrSlug`: hibrit URL'de id, eski /community/<yüzey>/<slug> linkinde slug.
export async function getThreadByIdOrSlug(idOrSlug) {
  try {
    return toThreadCard(await getThread(idOrSlug));
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
}

// PortalDetailResponse → sayfa şekli (alanlar sözleşmeyle aynı). 404 (yok /
// HIDDEN) → null; diğer hatalar çağırana fırlar.
export async function getPortalBySlug(slug) {
  try {
    return await getPortal(slug);
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
}

// {member, memberCount} döner.
export async function setPortalMembership(slug, member) {
  return member ? joinPortal(slug) : leavePortal(slug);
}

// Composer'ın portal seçicisi: yalnız ACTIVE portallar (ARCHIVED'da yazma kapalı,
// HIDDEN zaten dönmez), en kalabalıktan başlayarak. Dizin size'ı 50'de kırpar —
// portal sayısı bunu aşarsa seçici arama/sayfalama ister (şimdilik 9 seed).
export async function getPortalOptions() {
  const res = await getPortals({ sort: 'members', size: 50 });
  return res.content
    .filter((portal) => portal.status === 'ACTIVE')
    .map(({ slug, name, postingPolicy }) => ({ slug, name, postingPolicy }));
}

export async function createThread({ portalSlug, surface, title, body, media, tags, spoilerFlagged }) {
  const created = await postThread({
    portalSlug,
    surface,
    title,
    body: body || undefined,
    media: media?.length ? media : undefined,
    tags,
    spoilerFlagged: spoilerFlagged || undefined,
  });
  return toThreadCard(created);
}
