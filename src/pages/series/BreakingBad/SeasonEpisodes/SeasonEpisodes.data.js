// SeasonEpisodes'un veri erişim katmanı — dizinin künyesi (title/seasons)
// GET /api/series/slug/:slug'a, sezon açıldığında bölüm listesi
// GET /api/seasons/:id'e bağlıdır (backend DTO'suyla birebir). GoT'un
// SeasonEpisodes.data.js'iyle AYNI (kullanıcı: "birebir game of thrones'unkinin
// aynısı olsun").
export { fetchProductionDetail, fetchSeasonDetail } from '../../../../shared/api/productions';
