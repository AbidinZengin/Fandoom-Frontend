// Bölüm sayfasının altındaki "Dive Deeper" içerik carousel'inin veri
// kaynağı — backend'in blog modülüne (GET /api/blogs/related) bağlanır.
// BreakingBad/RelatedContent.data.js ile BİREBİR aynı, TEK fark productionSlug.
import { fetchRelatedBlogs } from '../../../../../shared/api/blogs';

// productionSlug şimdilik sabit — bu sayfa yalnız house-of-the-dragon bölüm
// rotasında render ediliyor (EpisodePage.jsx). Sayfa çok-yapımlı hâle
// gelirse imza parametrik olmalı.
export function getRelatedBlogs({ seasonNumber, episodeNumber }) {
  return fetchRelatedBlogs({
    productionType: 'SERIES',
    productionSlug: 'house-of-the-dragon',
    seasonNumber,
    episodeNumber,
  });
}
