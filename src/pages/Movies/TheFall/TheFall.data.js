// The Fall sayfasının veri erişim katmanı — GET /api/movies/slug/:slug'a
// bağlı. theme (bg/accent/cardBg) backend'de karşılığı olmayan, salt frontend'e
// ait sunum verisidir — learned-rules [renk]: zemin sitenin standart siyahında
// kalır, yapımın karakter rengi SADECE accent'e işler. Çöl altını, filmin
// fantastik/epik görsel dünyasından türetilen kullanıcı onaylı değer
// (2026-09-27).
export { fetchProductionDetail } from '../../../shared/api/productions';
export { resolveGenreNames } from '../../../shared/api/genres';

export const MOVIE_ID = 10;

export const theme = {
  bg: '#050505',
  accent: '#c9a13c',
  cardBg: '#101012',
};
