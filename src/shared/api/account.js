import { apiClient } from './client';

// 14a. PROFILE — GET/PATCH /api/me/profile. UserProfileResponse: { username,
// bio, avatarUrl, bannerUrl, accentColor, spoilerProtectionEnabled,
// stats: { commentCount, theoryCount, likeCount, readBlogCount, memberSince } }.
// Satır hiç PATCH edilmemişse backend varsayılan boş değerlerle üretir (DB'ye
// yazmaz) — ilk çağrıda 404 DEĞİL, boş profil döner.
export async function getMyProfile() {
  return apiClient.get('/me/profile');
}

export async function updateMyProfile(fields) {
  return apiClient.patch('/me/profile', fields);
}

// 14b. LIST — sistem listeleri (WATCHLIST/READLIST) GET /api/me/lists ile
// lazy oluşturulur, CUSTOM listeler kullanıcı POST'uyla açılır.
// CreateUserListRequest: { title, description, coverImageUrl, isPublic } —
// hem POST (tam doğrulamalı) hem PATCH (kısmi, null alan "değişmedi" demek)
// için aynı DTO backend'de yeniden kullanılıyor (bkz. AccountController).
// isPinned ve listType bu uca dahil değil (listType CUSTOM'da sabit,
// isPinned ayrı bir PATCH /me/lists/{id}/pin ucu — bu turda kullanılmıyor).
export async function getMyLists() {
  return apiClient.get('/me/lists');
}

export async function getMyListDetail(id, { page = 0, size = 20 } = {}) {
  return apiClient.get(`/me/lists/${id}?page=${page}&size=${size}`);
}

export async function createMyList(payload) {
  return apiClient.post('/me/lists', payload);
}

export async function updateMyList(id, payload) {
  return apiClient.patch(`/me/lists/${id}`, payload);
}

export async function deleteMyList(id) {
  return apiClient.delete(`/me/lists/${id}`);
}

// 14e. FOLLOW — GET /api/me/follows itemId/itemType HAM döner (zenginleş-
// tirilmemiş), çağıran taraf (Account.data.js) prodüksiyon/blog detayına
// kendi çözer (bkz. resolveProductionById/fetchBlogById).
export async function getMyFollows({ page = 0, size = 20 } = {}) {
  return apiClient.get(`/me/follows?page=${page}&size=${size}`);
}

// Tekil durum/toggle — ContentActions (Blog/Movie/Series aksiyon barı) için.
export async function getMyFollowStatus(itemType, itemId) {
  return apiClient.get(`/me/follows/${itemType}/${itemId}`);
}

export async function followItem(itemType, itemId) {
  return apiClient.post(`/me/follows/${itemType}/${itemId}`);
}

export async function unfollowItem(itemType, itemId) {
  return apiClient.delete(`/me/follows/${itemType}/${itemId}`);
}

// 14d. LIKE — GET /api/me/likes (Follow'un birebir kopyası, backend'e
// sonradan eklendi) itemId/itemType HAM döner, aynı enrichment yolunu
// (resolveProductionById/fetchBlogById) kullanır.
export async function getMyLikes({ page = 0, size = 20 } = {}) {
  return apiClient.get(`/me/likes?page=${page}&size=${size}`);
}

// Tekil durum/toggle — ContentActions için.
export async function getMyLikeStatus(itemType, itemId) {
  return apiClient.get(`/me/likes/${itemType}/${itemId}`);
}

export async function likeItem(itemType, itemId) {
  return apiClient.post(`/me/likes/${itemType}/${itemId}`);
}

export async function unlikeItem(itemType, itemId) {
  return apiClient.delete(`/me/likes/${itemType}/${itemId}`);
}

// 14c. SAVED ITEM — Watchlist (varsayılan, listType boş) ve Watched
// (listType:'WATCHED') için ContentActions'ın "İzleme Listeme Ekle"/
// "İzledim" butonları. Watched'a eklenince backend Watchlist kaydını
// otomatik siler (kullanıcı kararı, Trakt/Letterboxd modeli) — frontend
// bunu ayrıca silmez, sadece optimistic UI'da watchlisted'ı false yapar.
// DELETE saved-item'ın KENDİ id'sini ister (itemId DEĞİL) — status sorgusu
// bu yüzden savedItemId'yi de döner.
// NOT: bu status ucu SADECE sistem listeleri (WATCHLIST/READLIST/WATCHED)
// içindir, targetListId PARAMETRESİ KABUL ETMEZ — bir öğenin belirli bir
// CUSTOM listede olup olmadığını öğrenmenin backend'de ayrı bir ucu yok
// (bkz. AddToListPopover.jsx, tüm liste içeriğini çekip client-side arar).
export async function getMySavedItemStatus(itemType, itemId, listType) {
  const query = listType ? `?listType=${listType}` : '';
  return apiClient.get(`/me/saved-items/status/${itemType}/${itemId}${query}`);
}

// targetListId verilirse CUSTOM listeye eklenir (listType YOLLANMAZ —
// ikisi birlikte gönderilirse backend 400 döner). listType verilirse
// sistem listesine (WATCHLIST/WATCHED) eklenir — mevcut davranış aynı.
// Aynı (itemId, itemType, targetListId) zaten listedeyse backend 409 döner.
export async function addToList(itemId, itemType, { listType, targetListId, notes } = {}) {
  return apiClient.post('/me/saved-items', { itemId, itemType, listType, targetListId, notes });
}

export async function removeFromList(savedItemId) {
  return apiClient.delete(`/me/saved-items/${savedItemId}`);
}

// Okuma ilerlemesi (READLIST, BLOG'a özel) — BlogPost.jsx scroll'a göre
// periyodik çağırır. Save/Bookmark'la HİÇBİR ilgisi yok (kullanıcı kararı,
// 2026-08-29) — okuma ilerlemesi kullanıcı bir şeye tıklamadan, salt scroll
// davranışıyla otomatik oluşur/güncellenir.
export async function updateSavedItemProgress(savedItemId, progressPercentage) {
  return apiClient.patch(`/me/saved-items/${savedItemId}`, { progressPercentage });
}

// 14f. BOOKMARK ("Kaydet") — Watchlist/Watched'ten TAMAMEN bağımsız, hiçbir
// listeye dokunmaz (kullanıcı kararı: Save = liste değil, düz işaretleme).
// Like/Follow ile birebir aynı desen — ContentActions'ın "Kaydet" butonu
// bunu kullanır.
export async function getMyBookmarkStatus(itemType, itemId) {
  return apiClient.get(`/me/bookmarks/${itemType}/${itemId}`);
}

export async function bookmarkItem(itemType, itemId) {
  return apiClient.post(`/me/bookmarks/${itemType}/${itemId}`);
}

export async function unbookmarkItem(itemType, itemId) {
  return apiClient.delete(`/me/bookmarks/${itemType}/${itemId}`);
}

export async function getMyBookmarks({ page = 0, size = 20 } = {}) {
  return apiClient.get(`/me/bookmarks?page=${page}&size=${size}`);
}
