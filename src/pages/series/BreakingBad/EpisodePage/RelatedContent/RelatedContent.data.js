// Bölüm sayfasının altındaki "Dive Deeper" içerik carousel'inin veri
// kaynağı — backend'in blog modülüne (GET /api/blogs/related) bağlanır.
// GoT'un RelatedContent.data.js'iyle BİREBİR aynı, TEK fark productionSlug.
import { fetchRelatedBlogs } from '../../../../../shared/api/blogs';

// productionSlug şimdilik sabit — bu sayfa yalnız breaking-bad bölüm
// rotasında render ediliyor (EpisodePage.jsx). Sayfa çok-yapımlı hâle
// gelirse imza parametrik olmalı.
export function getRelatedBlogs({ seasonNumber, episodeNumber }) {
  return fetchRelatedBlogs({
    productionType: 'SERIES',
    productionSlug: 'breaking-bad',
    seasonNumber,
    episodeNumber,
  });
}
