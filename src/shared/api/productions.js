import { apiClient } from './client';

// GET /api/productions — backend'in movie+series orkestrasyon feed'i.
// Backend'in PageResponse<T> zarfını olduğu gibi döner (content, page, size,
// totalElements, totalPages, last) — sayfalama bilgisi burada atılmaz,
// ihtiyaç duymayan çağıran sadece .content'i alır (ör. FeaturedCarousel).
// content öğesi: { id, slug, title, type: 'MOVIE'|'SERIES', posterUrl, releaseDate }
export async function fetchProductions({ page = 0, size = 20 } = {}) {
  return apiClient.get(`/productions?page=${page}&size=${size}`);
}

// type: 'movie' | 'series' — route segmentinden gelir (App.jsx).
export async function fetchProductionDetail(type, slug) {
  const path = type === 'movie' ? `/movies/slug/${slug}` : `/series/slug/${slug}`;
  return apiClient.get(path);
}

// GET /api/seasons/:id — seasons dizisindeki id (series detail'ın seasons[].id'si,
// series'in kendi id'si DEĞİL). content: { id, seasonNumber, title, posterUrl, episodes }.
export async function fetchSeasonDetail(seasonId) {
  return apiClient.get(`/seasons/${seasonId}`);
}
