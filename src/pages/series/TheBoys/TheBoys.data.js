// The Boys sayfasının veri erişim katmanı — GET /api/series/slug/:slug'a
// bağlı. theme (bg/accent/cardBg) backend'de karşılığı olmayan, salt frontend'e
// ait sunum verisidir — learned-rules [renk]: zemin sitenin standart siyahında
// kalır, yapımın karakter rengi SADECE accent'e işler. Compound V mavisi (#38a3ff)
// — dizinin kimliğini taşıyan parlayan madde rengi; 3 seçenekten (mavi/kırmızı/
// altın) tavsiye edilen seçildi, kullanıcı 'devam' dedi (2026-09-23).
export { fetchProductionDetail } from '../../../shared/api/productions';
export { resolveGenreNames } from '../../../shared/api/genres';

export const theme = {
  bg: '#050505',
  accent: '#38a3ff',
  cardBg: '#101012',
};
