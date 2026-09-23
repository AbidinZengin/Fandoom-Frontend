// Stranger Things sayfasının veri erişim katmanı — GET /api/series/slug/:slug'a
// bağlı. theme (bg/accent/cardBg) backend'de karşılığı olmayan, salt frontend'e
// ait sunum verisidir — learned-rules [renk]: zemin sitenin standart siyahında
// kalır, yapımın karakter rengi SADECE accent'e işler. Neon kırmızı (#e2231a)
// — dizinin ikonik '80'ler tabela logosunun rengi, kullanıcı kararı
// (2026-09-06, 3 seçenekten seçildi).
export { fetchProductionDetail } from '../../../shared/api/productions';
export { resolveGenreNames } from '../../../shared/api/genres';

export const theme = {
  bg: '#050505',
  accent: '#e2231a',
  cardBg: '#101012',
};
