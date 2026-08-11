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

// GET /api/episodes/:id — sezon detayındaki episodes[] öğesinin id'si (bkz.
// fetchSeasonDetail). content: { ..., storyKicker, storyTitle, storyThesis,
// episodeBlocks: [{ id, orderIndex, blockType, sceneKey, tone, pinned,
// sceneKicker, content, mediaUrl, mediaAlt, mediaRatio, col, row }] }.
export async function fetchEpisodeDetail(episodeId) {
  return apiClient.get(`/episodes/${episodeId}`);
}

// genres.js'teki desenin aynısı: tüm katalog oturum boyunca değişmeyecek
// kadar küçük — tek seferlik çekilip bellekte tutulur. Slug'a göre senkron-
// benzeri çözümleme isteyen çağıranlar (ContentSection, NewsCard, Community)
// bunun üstüne kurulur.
let allProductionsPromise = null;

export async function fetchAllProductions() {
  if (!allProductionsPromise) {
    allProductionsPromise = fetchProductions({ size: 100 }).then((res) => res.content);
  }
  return allProductionsPromise;
}

export async function resolveProductionBySlug(slug) {
  const all = await fetchAllProductions();
  return all.find((p) => p.slug === slug) ?? null;
}

// BlogTagResponse (subjectType/subjectId) gibi sayısal FK taşıyan
// çapraz-kesen ilişkileri slug'a çözer — type de verilirse (MOVIE/SERIES
// ayrı id dizileri kullanabilir) eşleşme ona göre daraltılır.
export async function resolveProductionById(id, type) {
  const all = await fetchAllProductions();
  return all.find((p) => p.id === id && (!type || p.type === type)) ?? null;
}
