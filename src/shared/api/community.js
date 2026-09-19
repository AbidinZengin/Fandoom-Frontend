import { apiClient } from './client';

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
