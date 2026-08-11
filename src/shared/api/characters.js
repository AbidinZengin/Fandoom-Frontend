import { apiClient } from './client';

// Character artık bir yapıma bağlı (subjectType: 'MOVIE'|'SERIES' + subjectId,
// billingOrder'a göre sıralı) — /movies/:id/characters ve /series/:id/characters
// nested endpoint'leri bunun için var. Düz GET /api/characters TÜM yapımların
// karakterlerini karışık döner, bu yüzden yapıma özel sayfalarda kullanılmaz.
// content öğesi: { id, name, slug, description, quote, imageUrl, subjectType,
//                   subjectId, billingOrder }
export async function fetchCharactersForSeries(seriesId) {
  return apiClient.get(`/series/${seriesId}/characters`);
}

export async function fetchCharactersForMovie(movieId) {
  return apiClient.get(`/movies/${movieId}/characters`);
}

export async function fetchCharacterBySlug(slug) {
  return apiClient.get(`/characters/slug/${slug}`);
}
