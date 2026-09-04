// Severance sayfasının veri erişim katmanı — GET /api/series/slug/:slug'a
// bağlı. theme (bg/accent/cardBg) backend'de karşılığı olmayan, salt frontend'e
// ait sunum verisidir — learned-rules [renk]: zemin sitenin standart siyahında
// kalır, yapımın karakter rengi SADECE accent'e işler (bkz. productionAccent.js
// 'severance' — turkuaz #1fb5a3).
export { fetchProductionDetail } from '../../../shared/api/productions';
export { resolveGenreNames } from '../../../shared/api/genres';

export const theme = {
  bg: '#050505',
  accent: '#1fb5a3',
  cardBg: '#101012',
};
