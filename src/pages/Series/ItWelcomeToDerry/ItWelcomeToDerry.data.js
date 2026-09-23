// IT: Welcome to Derry sayfasının veri erişim katmanı — GET /api/series/slug/:slug'a
// bağlı. theme (bg/accent/cardBg) backend'de karşılığı olmayan, salt frontend'e
// ait sunum verisidir — learned-rules [renk]: zemin sitenin standart siyahında
// kalır, yapımın karakter rengi SADECE accent'e işler. Kan kırmızısı (#b3211f)
// — Pennywise'ın balonu/kanının ikonik rengi, kullanıcı kararı (2026-09-06,
// 3 seçenekten seçildi).
export { fetchProductionDetail } from '../../../shared/api/productions';
export { resolveGenreNames } from '../../../shared/api/genres';

export const theme = {
  bg: '#050505',
  accent: '#b3211f',
  cardBg: '#101012',
};
