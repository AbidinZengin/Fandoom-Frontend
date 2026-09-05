// SeasonDetail sayfasının veri erişim katmanı — BreakingBad/HouseOfTheDragon
// SeasonDetail.data.js ile BİREBİR aynı desen (standart imza şablonu).
// theme From'ın KENDİ temasıdır (bkz. ../From.data.js).
export { fetchProductionDetail, fetchSeasonDetail } from '../../../../shared/api/productions';
export { theme } from '../From.data';

import { fetchRelatedBlogs } from '../../../../shared/api/blogs';

export function getRelatedBlogs({ seasonNumber }) {
  return fetchRelatedBlogs({
    productionType: 'SERIES',
    productionSlug: 'from',
    seasonNumber,
  });
}
