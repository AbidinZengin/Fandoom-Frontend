// CharactersRoute'un veri erişim katmanı — filmin id'si
// GET /api/movies/slug/:slug'dan çözülür, karakter listesi
// GET /api/movies/:id/characters'a bağlıdır (billingOrder sıralı).
export { fetchProductionDetail } from '../../../../shared/api/productions';
export { fetchCharactersForMovie } from '../../../../shared/api/characters';
