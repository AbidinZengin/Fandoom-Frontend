// ContentSection'ın veri erişim katmanı — ileride GET /api/productions/:slug
// servis çağrısına dönüşecek seam. Ortak kaynak: src/shared/data.
export { getProductionBySlug } from '../../../shared/data/productions';

// Afiş (poster) asset eşlemesi — UI katmanı bilgisi; ortak şemaya alan eklemek
// yasak olduğu için component'in kendi data seam'inde yaşar (FeaturedCarousel
// ile aynı desen). Eksik afişler bulundukça buraya eklenir; afiş yokken
// yapımın posterGradient atmosferi görünür.
export const posterBySlug = {
  'game-of-thrones': '/got/poster.jpg',
};
