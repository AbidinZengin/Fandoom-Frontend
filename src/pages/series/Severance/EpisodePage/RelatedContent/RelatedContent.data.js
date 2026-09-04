// Bölüm sayfasının altındaki "Dive Deeper" içerik carousel'inin veri
// kaynağı — backend'in blog modülüne (GET /api/blogs/related) bağlanır.
// BreakingBad/HouseOfTheDragon RelatedContent.data.js ile BİREBİR aynı, TEK
// fark productionSlug.
import { fetchRelatedBlogs } from '../../../../../shared/api/blogs';

// productionSlug şimdilik sabit — bu sayfa yalnız severance bölüm rotasında
// render ediliyor (EpisodePage.jsx). Sayfa çok-yapımlı hâle gelirse imza
// parametrik olmalı.
export function getRelatedBlogs({ seasonNumber, episodeNumber }) {
  return fetchRelatedBlogs({
    productionType: 'SERIES',
    productionSlug: 'severance',
    seasonNumber,
    episodeNumber,
  });
}
