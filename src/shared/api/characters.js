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

export async function fetchCharacterById(id) {
  return apiClient.get(`/characters/${id}`);
}

// PageBuilder bağlı-veri geri yazma — backend'e iletilen generic
// CharacterRequest isteğine göre yazıldı (bkz. productions.js'teki
// updateProduction yorumu, aynı doğrulanmamışlık notu geçerli).
export async function updateCharacter(id, fields) {
  return apiClient.put(`/characters/${id}`, fields);
}

export async function createCharacter(fields) {
  return apiClient.post('/characters', fields);
}
