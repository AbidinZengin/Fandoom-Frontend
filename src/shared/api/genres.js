import { apiClient, currentApiLang } from './client';

// /api/genres tüm uygulama boyunca değişmeyen küçük bir taksonomi —
// tek seferlik çekilip bellekte tutulur (id -> isim çözümlemesi için).
// Genre.name dil bazlı (Accept-Language) döndüğü için cache dile göre
// anahtarlanır — aksi halde dil değiştirilince (sayfa yenilenmeden, sadece
// client-side navigate ile) önceki dilin isimleri asılı kalırdı.
let genresPromise = null;
let genresLang = null;

function loadGenres() {
  const lang = currentApiLang();
  if (!genresPromise || genresLang !== lang) {
    genresLang = lang;
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
