// Movies hub'ın veri erişim katmanı — Series.data.js ile aynı desen:
// GET /api/productions (fetchAllProductions cache'i) üzerinden tüm katalog
// çekilir, type === 'MOVIE' olanlar filtrelenir.
import { fetchAllProductions } from '../../shared/api/productions';

export async function getAllMovies() {
  const all = await fetchAllProductions();
  return all.filter((p) => p.type === 'MOVIE');
}
