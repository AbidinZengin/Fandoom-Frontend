// Silo sayfasının veri erişim katmanı — GET /api/series/slug/:slug'a
// bağlı. theme (bg/accent/cardBg) backend'de karşılığı olmayan, salt frontend'e
// ait sunum verisidir — learned-rules [renk]: zemin sitenin standart siyahında
// kalır, yapımın karakter rengi SADECE accent'e işler. Accent #f0a030 — tavsiye edilen
// ton (kullanıcı henüz görmedi/onaylamadı, 2026-09-30); tek satırlık değişiklikle geri alınır.
export { fetchProductionDetail } from '../../../shared/api/productions';
export { resolveGenreNames } from '../../../shared/api/genres';

export const theme = {
  bg: '#050505',
  accent: '#f0a030',
  cardBg: '#101012',
};
