// Bölüm sayfasının altındaki "Dive Deeper" içerik carousel'inin veri
// kaynağı — backend'in blog modülüne (GET /api/blogs/related) bağlanır.
// `src/shared/data` (production sözleşmesi) DIŞINDA tutulan, bu component'e
// özel kaynak — kendi bağımsız endpoint'i zaten var.
import { fetchRelatedBlogs } from '../../../../../shared/api/blogs';

// productionSlug şimdilik sabit — bu sayfa yalnız game-of-thrones bölüm
// rotasında render ediliyor (EpisodePage.jsx). Sayfa çok-yapımlı hâle
// gelirse imza parametrik olmalı.
export function getRelatedBlogs({ seasonNumber, episodeNumber }) {
  return fetchRelatedBlogs({
    productionType: 'SERIES',
    productionSlug: 'game-of-thrones',
    seasonNumber,
    episodeNumber,
  });
}
