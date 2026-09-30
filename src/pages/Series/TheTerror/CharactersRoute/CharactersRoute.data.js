// CharactersRoute'un veri erişim katmanı — dizinin id'si (SeasonRoute ile
// aynı desen) GET /api/series/slug/:slug'dan çözülür, karakter listesi
// GET /api/series/:id/characters'a bağlıdır (billingOrder sıralı).
export { fetchProductionDetail } from '../../../../shared/api/productions';
export { fetchCharactersForSeries } from '../../../../shared/api/characters';
