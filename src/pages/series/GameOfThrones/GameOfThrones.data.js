// GameOfThrones sayfasının veri erişim katmanı — GET /api/series/slug/:slug'a
// bağlı (entity'nin kendi verisi: title/synopsis). theme (bg/accent/cardBg)
// backend'de hiç karşılığı olmayan, salt frontend'e ait sunum verisidir —
// API'den gelmez, burada sabit kalır.
export { fetchProductionDetail } from '../../../shared/api/productions';

export const theme = {
  bg: '#050505',
  accent: '#e8974a',
  cardBg: '#101012',
};
