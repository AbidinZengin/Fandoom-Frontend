// SeasonEpisodes'un veri erişim katmanı — dizinin künyesi (title/seasons)
// GET /api/series/slug/:slug'a, sezon açıldığında bölüm listesi
// GET /api/seasons/:id'e bağlıdır (backend DTO'suyla birebir).
export { fetchProductionDetail, fetchSeasonDetail } from '../../../../shared/api/productions';
