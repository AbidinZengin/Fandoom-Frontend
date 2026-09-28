// Parasite sayfasının veri erişim katmanı — GET /api/movies/slug/:slug'a
// bağlı. theme (bg/accent/cardBg) backend'de karşılığı olmayan, salt frontend'e
// ait sunum verisidir — learned-rules [renk]: zemin sitenin standart siyahında
// kalır, yapımın karakter rengi SADECE accent'e işler. Yosun yeşili, Parkların
// bahçesindeki ivy/kıskançlık motifinden türetilen kullanıcı onaylı değer
// (2026-09-27).
export { fetchProductionDetail } from '../../../shared/api/productions';
export { resolveGenreNames } from '../../../shared/api/genres';

export const MOVIE_ID = 8;

export const theme = {
  bg: '#050505',
  accent: '#7c8f5a',
  cardBg: '#101012',
};
