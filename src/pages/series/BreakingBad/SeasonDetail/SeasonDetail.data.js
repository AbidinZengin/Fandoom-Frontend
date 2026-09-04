// SeasonDetail sayfasının veri erişim katmanı — dizi detayından (seasons[])
// hedef seasonNumber'ı bulup GET /api/seasons/:id ile bölüm listesini çeker
// (GoT SeasonRow/EpisodePage'deki aynı iki-uçlu desen). theme, BreakingBad'in
// TAM TEMA'sıyla aynıdır (learned-rules: yapım sayfaları tek tema kurar,
// zemin sitenin standart siyahında kalır).
export { fetchProductionDetail, fetchSeasonDetail } from '../../../../shared/api/productions';
export { theme } from '../BreakingBad.data';

// Sağ sidebar'daki "Dive Deeper" şeridinin veri kaynağı — EpisodePage'in
// RelatedContent.data.js'iyle AYNI uç (GET /api/blogs/related), tek fark
// sezon düzeyinde çağrılması (episodeNumber YOK).
import { fetchRelatedBlogs } from '../../../../shared/api/blogs';

export function getRelatedBlogs({ seasonNumber }) {
  return fetchRelatedBlogs({
    productionType: 'SERIES',
    productionSlug: 'breaking-bad',
    seasonNumber,
  });
}
