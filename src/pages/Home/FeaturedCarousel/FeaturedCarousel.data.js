// FeaturedCarousel'in veri erişim katmanı — GET /api/productions'a bağlı.
// posterUrl artık API'den doğrudan geliyor, ayrı bir poster eşleme
// tablosuna gerek kalmadı.
export { fetchProductions } from '../../../shared/api/productions';
