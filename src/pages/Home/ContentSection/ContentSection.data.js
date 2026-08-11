// ContentSection'ın veri erişim katmanı — gerçek backend'e bağlı: slug
// çözümleme GET /api/productions'a (fetchAllProductions cache'i), genre
// GET /api/movies|series/slug/:slug + /api/genres'e bağlıdır.
// posterGradient/accent backend'de karşılığı olmayan sunum verisi olduğu
// için shared/theme/productionAccent'ten gelir (ContentSection, NewsCard,
// Community ortak kaynağı).
export { resolveProductionBySlug, fetchProductionDetail } from '../../../shared/api/productions';
export { resolveGenreNames } from '../../../shared/api/genres';
export { getProductionAccent } from '../../../shared/theme/productionAccent';

// Afiş (poster) asset eşlemesi — UI katmanı bilgisi; ortak şemaya alan eklemek
// yasak olduğu için component'in kendi data seam'inde yaşar (FeaturedCarousel
// ile aynı desen). Eksik afişler bulundukça buraya eklenir; afiş yokken
// yapımın posterGradient atmosferi görünür.
export const posterBySlug = {
  'game-of-thrones': '/got/poster.jpg',
};
