// Dune: Part Two sayfasının veri erişim katmanı — GET /api/movies/slug/:slug'a
// bağlı. theme (bg/accent/cardBg) backend'de karşılığı olmayan, salt frontend'e
// ait sunum verisidir — learned-rules [renk]: zemin sitenin standart siyahında
// kalır, yapımın karakter rengi SADECE accent'e işler. Çöl turuncusu kullanıcı
// onaylı öneri (2026-09-23), kesin ton visual-verify turunda ince ayar alır.
export { fetchProductionDetail } from '../../../shared/api/productions';
export { resolveGenreNames } from '../../../shared/api/genres';

export const MOVIE_ID = 4;

export const theme = {
  bg: '#050505',
  accent: '#e08a3c',
  cardBg: '#101012',
};
