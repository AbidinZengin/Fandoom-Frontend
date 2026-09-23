import { apiClient } from './client';

// 15a. THREAD
// Feed PUBLIC — sort(hot|new|top) ve sayfalama sunucuda; surface verilmezse
// karışık akış. Cevap PageResponse{content,page,size,totalElements,totalPages,last}.
// `portal` (portal slug'ı): yalnız o odanın thread'leri; yok/HIDDEN portal 404.
// `scope`: 'all' (varsayılan) | 'joined' (AUTH — anonim 401).
export async function getFeed({ surface, sort = 'hot', page = 0, size = 20, portal, scope } = {}) {
  const params = new URLSearchParams({ sort, page, size });
  if (surface) params.set('surface', surface);
  if (portal) params.set('portal', portal);
  if (scope) params.set('scope', scope);
  return apiClient.get(`/community/feed?${params}`);
}

// Thread uçları `{id}` (sayısal, birincil) VEYA `{slug}` (deprecated) alır — aynı
// yol şekli; saf-sayısal segment backend'de HER ZAMAN id sayılır. Yeni kod id
// verir, slug yalnız eski /community/<yüzey>/<slug> linkleri için kalır.
export async function getThread(idOrSlug) {
  return apiClient.get(`/community/threads/${encodeURIComponent(idOrSlug)}`);
}

// like/bookmark AUTH ve idempotent — cevap güncel sayaç+durum döner
// (ThreadLikeStatusResponse{liked, likeCount}, ThreadBookmarkStatusResponse{bookmarked, bookmarkCount}).
// ARCHIVED portalda POST 400, DELETE serbest.
export async function likeThread(id) {
  return apiClient.post(`/community/threads/${encodeURIComponent(id)}/like`);
}

export async function unlikeThread(id) {
  return apiClient.delete(`/community/threads/${encodeURIComponent(id)}/like`);
}

export async function bookmarkThread(id) {
  return apiClient.post(`/community/threads/${encodeURIComponent(id)}/bookmark`);
}

export async function unbookmarkThread(id) {
  return apiClient.delete(`/community/threads/${encodeURIComponent(id)}/bookmark`);
}

// Yazma ucu AUTH: authorId istemciden gelmez, backend JWT'den çıkarır
// (anonim istek 401). Boş/undefined alanlar JSON'da düşer. media: en fazla 6
// {type: 'IMAGE'|'VIDEO', url}, sıra liste sırası. `portalSlug` ZORUNLU (eksikse
// 400 fieldErrors); ARCHIVED portal 400, STAFF_ONLY portal 403, yok/HIDDEN 404.
export async function postThread({ portalSlug, surface, title, body, media, spoilerFlagged, productionSlug, tags }) {
  return apiClient.post('/community/threads', {
    portalSlug,
    surface,
    title,
    body,
    media,
    spoilerFlagged,
    productionSlug,
    tags,
  });
}

// 15e. PORTAL — public. Cevap PageResponse<PortalSummaryResponse>; `size` 1..50'ye
// sessizce kırpılır. sort: trending (varsayılan) | members | new | alpha.
// name/description Accept-Language'e göre çözülür (client.js zaten gönderir).
export async function getPortals({ sort = 'trending', q, page = 0, size = 20 } = {}) {
  const params = new URLSearchParams({ sort, page, size });
  if (q) params.set('q', q);
  return apiClient.get(`/community/portals?${params}`);
}

// AUTH — kullanıcının üye olduğu portallar, DÜZ LİSTE (sayfalama yok), hepsinde
// isMember=true; ARCHIVED görünür, HIDDEN görünmez. Varsayılan sıra: joinedAt azalan.
export async function getMyPortals() {
  return apiClient.get('/me/portals');
}

// Detay PUBLIC (token varsa isMember çözülür); yok/HIDDEN 404. ARCHIVED dönebilir.
export async function getPortal(slug) {
  return apiClient.get(`/community/portals/${encodeURIComponent(slug)}`);
}

// Katıl/Ayrıl AUTH ve idempotent — cevap {member, memberCount} (işlem sonrası
// değerler). ARCHIVED portala yeni üyelik 400 (mevcut üye 200); HIDDEN 404.
// join+leave aynı rate-limit kovasını paylaşır: 60/saat (aşımda 429).
export async function joinPortal(slug) {
  return apiClient.post(`/community/portals/${encodeURIComponent(slug)}/join`);
}

export async function leavePortal(slug) {
  return apiClient.delete(`/community/portals/${encodeURIComponent(slug)}/join`);
}

// 15c. COMMENT (polimorfik) — CommentSubjectType: THREAD|BLOG|SEASON|EPISODE.
// Thread'e özel slug-bazlı uçlar (/api/community/threads/{slug}/comments)
// bu dosyaya DAHİL DEĞİL — Blog/Season/Episode için backend'in TEK yolu bu
// merkezi /api/community/comments ucu (bkz. backend contract notu).
// GEÇİCİ: `sort` query parametresi backend'de (hangi değer olursa olsun)
// 500 Internal Server Error'a düşüyor (2026-09-12 doğrulandı, doğrudan
// backend'e curl ile — frontend'den bağımsız). Parametre hiç gönderilmezse
// backend kendi varsayılanına (new) düşüyor ve 200 dönüyor — bu yüzden
// `sort` burada BİLEREK query'e eklenmiyor. Backend düzelince geri eklenmeli.
export async function getComments(subjectType, subjectId, { page = 0, size = 20 } = {}) {
  return apiClient.get(`/community/comments?subjectType=${subjectType}&subjectId=${subjectId}&page=${page}&size=${size}`);
}

export async function postComment({ subjectType, subjectId, body, spoilerFlagged, parentId }) {
  return apiClient.post('/community/comments', { subjectType, subjectId, body, spoilerFlagged, parentId });
}

export async function deleteComment(id) {
  return apiClient.delete(`/community/comments/${id}`);
}

export async function likeComment(id) {
  return apiClient.post(`/community/comments/${id}/like`);
}

export async function unlikeComment(id) {
  return apiClient.delete(`/community/comments/${id}/like`);
}
