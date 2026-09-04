// SeasonDetail sayfasının veri erişim katmanı — BreakingBad/HouseOfTheDragon
// SeasonDetail.data.js ile BİREBİR aynı desen (standart imza şablonu).
// theme Severance'ın KENDİ temasıdır (bkz. ../Severance.data.js).
export { fetchProductionDetail, fetchSeasonDetail } from '../../../../shared/api/productions';
export { theme } from '../Severance.data';

import { fetchRelatedBlogs } from '../../../../shared/api/blogs';

export function getRelatedBlogs({ seasonNumber }) {
  return fetchRelatedBlogs({
    productionType: 'SERIES',
    productionSlug: 'severance',
    seasonNumber,
  });
}
