// Invincible sayfasının veri erişim katmanı — GET /api/series/slug/:slug'a
// bağlı. theme (bg/accent/cardBg) backend'de karşılığı olmayan, salt frontend'e
// ait sunum verisidir — learned-rules [renk]: zemin sitenin standart siyahında
// kalır, yapımın karakter rengi SADECE accent'e işler. Kostüm sarısı (#f2c230) —
// Mark'ın Invincible kostümünün imza rengi; 3 seçenekten (sarı/kırmızı/mavi) tavsiye
// edilen sarı seçildi, kullanıcı onayladı (2026-09-30).
export { fetchProductionDetail } from '../../../shared/api/productions';
export { resolveGenreNames } from '../../../shared/api/genres';

export const theme = {
  bg: '#050505',
  accent: '#f2c230',
  cardBg: '#101012',
};
