import { apiClient } from './client';

// 15a. THREAD
// Feed PUBLIC — sort(hot|new|top) ve sayfalama sunucuda; surface verilmezse
// karışık akış. Cevap PageResponse{content,page,size,totalElements,totalPages,last}.
export async function getFeed({ surface, sort = 'hot', page = 0, size = 20 } = {}) {
  const params = new URLSearchParams({ sort, page, size });
  if (surface) params.set('surface', surface);
  return apiClient.get(`/community/feed?${params}`);
}

export async function getThread(slug) {
  return apiClient.get(`/community/threads/${encodeURIComponent(slug)}`);
}

// like/bookmark AUTH ve idempotent — cevap güncel sayaç+durum döner
// (ThreadLikeStatusResponse{liked, likeCount}, ThreadBookmarkStatusResponse{bookmarked, bookmarkCount}).
export async function likeThread(slug) {
  return apiClient.post(`/community/threads/${encodeURIComponent(slug)}/like`);
}

export async function unlikeThread(slug) {
  return apiClient.delete(`/community/threads/${encodeURIComponent(slug)}/like`);
}

export async function bookmarkThread(slug) {
  return apiClient.post(`/community/threads/${encodeURIComponent(slug)}/bookmark`);
}

export async function unbookmarkThread(slug) {
  return apiClient.delete(`/community/threads/${encodeURIComponent(slug)}/bookmark`);
}

// Yazma ucu AUTH: authorId istemciden gelmez, backend JWT'den çıkarır
// (anonim istek 401). Boş/undefined alanlar JSON'da düşer. media: en fazla 6
// {type: 'IMAGE'|'VIDEO', url}, sıra liste sırası.
export async function postThread({ surface, title, body, media, spoilerFlagged, productionSlug, tags }) {
  return apiClient.post('/community/threads', { surface, title, body, media, spoilerFlagged, productionSlug, tags });
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
