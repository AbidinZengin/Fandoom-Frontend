// From sayfasının veri erişim katmanı — GET /api/series/slug/:slug'a
// bağlı. theme (bg/accent/cardBg) backend'de karşılığı olmayan, salt frontend'e
// ait sunum verisidir — learned-rules [renk]: zemin sitenin standart siyahında
// kalır, yapımın karakter rengi SADECE accent'e işler. Soğuk gece mavisi
// (#3f5570) — mevcut dizi accent'leriyle (yeşil/kırmızı/altın/turkuaz)
// çakışmayan, dizinin izole orman gecesi/dehşet temasına uygun kullanıcı
// kararı (2026-09-05, 3 seçenekten seçildi).
export { fetchProductionDetail } from '../../../shared/api/productions';
export { resolveGenreNames } from '../../../shared/api/genres';

export const theme = {
  bg: '#050505',
  accent: '#3f5570',
  cardBg: '#101012',
};
