import { apiClient } from './client';

// GET /api/search/quick — header arama kutusu. Tür başına en fazla 5 sonuç,
// sonucu olmayan türün grubu yanıtta hiç yer almaz. Yanıt:
// { groups: [{ type, items: SearchHit[] }] }, SearchHit = { id, slug, title,
// subtitle, imageUrl }. Sözleşme: docs/plans/2026-10-15-unified-search-design.md
export async function quickSearch(q, { signal } = {}) {
  const params = new URLSearchParams({ q });
  return apiClient.get(`/search/quick?${params}`, { signal });
}

// GET /api/search/{type} — tam arama sayfası, tür başına PageResponse<T>.
// type: movies | series | characters | people | portals | blogs
export async function searchByType(type, { q, page = 0, size = 20, signal } = {}) {
  const params = new URLSearchParams({ q, page, size });
  return apiClient.get(`/search/${type}?${params}`, { signal });
}
