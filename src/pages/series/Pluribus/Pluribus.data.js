// Pluribus sayfasının veri erişim katmanı — GET /api/series/slug/:slug'a
// bağlı. theme (bg/accent/cardBg) backend'de karşılığı olmayan, salt frontend'e
// ait sunum verisidir — learned-rules [renk]: zemin sitenin standart siyahında
// kalır, yapımın karakter rengi SADECE accent'e işler. Sıcak sarı/altın
// (#e8b94a) dizinin "mutluluk" temasına ve poster tonuna uygun kullanıcı kararı
// (2026-09-05) — kesin ton posterin kendisi görülmeden seçildi, gerekirse
// visual-verify turunda ince ayar yapılır.
export { fetchProductionDetail } from '../../../shared/api/productions';
export { resolveGenreNames } from '../../../shared/api/genres';

export const theme = {
  bg: '#050505',
  accent: '#e8b94a',
  cardBg: '#101012',
};
