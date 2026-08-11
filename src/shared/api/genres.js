import { apiClient } from './client';

// /api/genres tüm uygulama boyunca değişmeyen küçük bir taksonomi —
// tek seferlik çekilip bellekte tutulur (id -> isim çözümlemesi için).
let genresPromise = null;

function loadGenres() {
  if (!genresPromise) {
    genresPromise = apiClient.get('/genres');
  }
  return genresPromise;
}

// Blog filter paneli (FilterPanel) gibi ham listeye ihtiyaç duyan
// çağıranlar için — resolveGenreNames'in id->isim çözümlemesinin aksine
// tam {id, name} dizisini döner.
export async function fetchAllGenres() {
  return loadGenres();
}

export async function resolveGenreNames(genreIds) {
  if (!genreIds?.length) return [];
  const genres = await loadGenres();
  const nameById = new Map(genres.map((g) => [g.id, g.name]));
  return genreIds.map((id) => nameById.get(id)).filter(Boolean);
}
