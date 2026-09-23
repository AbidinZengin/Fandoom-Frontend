// The Batman sayfasının veri erişim katmanı — GET /api/movies/slug/:slug'a
// bağlı. theme (bg/accent/cardBg) backend'de karşılığı olmayan, salt frontend'e
// ait sunum verisidir — learned-rules [renk]: zemin sitenin standart siyahında
// kalır, yapımın karakter rengi SADECE accent'e işler. Koyu kırmızı (#b3242c)
// öneri ton (2026-09-23), poster görülerek visual-verify turunda ince ayar alır.
export { fetchProductionDetail } from '../../../shared/api/productions';
export { resolveGenreNames } from '../../../shared/api/genres';

export const MOVIE_ID = 5;

export const theme = {
  bg: '#050505',
  accent: '#b3242c',
  cardBg: '#101012',
};
