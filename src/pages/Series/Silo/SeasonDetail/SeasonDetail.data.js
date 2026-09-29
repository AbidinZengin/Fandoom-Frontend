// SeasonDetail sayfasının veri erişim katmanı — BreakingBad/HouseOfTheDragon
// SeasonDetail.data.js ile BİREBİR aynı desen (standart imza şablonu).
// theme Silo sayfasının KENDİ temasıdır (bkz. ../Silo.data.js).
export { fetchProductionDetail, fetchSeasonDetail } from '../../../../shared/api/productions';
export { theme } from '../Silo.data';

import { fetchRelatedBlogs } from '../../../../shared/api/blogs';

export function getRelatedBlogs({ seasonNumber }) {
  return fetchRelatedBlogs({
    productionType: 'SERIES',
    productionSlug: 'silo',
    seasonNumber,
  });
}
