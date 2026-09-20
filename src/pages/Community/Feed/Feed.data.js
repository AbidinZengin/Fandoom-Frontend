// Feed'in veri erişim katmanı — gerçek /api/community/** uçlarına bağlı
// (mock thread seti ve localStorage optimistic kaldırıldı). Component'ler
// backend cevabına değil, buradaki kart şekline (author string) bağlıdır.
import { getFeed, getThread, postThread } from '../../../shared/api/community';

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
// Thread.id (Comments subjectId'si), `slug` route parametresi. Profili
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
    createdAt: res.createdAt,
  };
}

export async function getFeedThreads({ surface, sort, page, size }) {
  const res = await getFeed({ surface, sort, page, size });
  return { threads: res.content.map(toThreadCard), hasMore: !res.last };
}

// 404 (slug yok / DELETED / HIDDEN) → null; diğer hatalar çağırana fırlar.
export async function getThreadBySlug(slug) {
  try {
    return toThreadCard(await getThread(slug));
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
}

export async function createThread({ surface, title, body, media, tags, spoilerFlagged }) {
  const created = await postThread({
    surface,
    title,
    body: body || undefined,
    media: media?.length ? media : undefined,
    tags,
    spoilerFlagged: spoilerFlagged || undefined,
  });
  return toThreadCard(created);
}
