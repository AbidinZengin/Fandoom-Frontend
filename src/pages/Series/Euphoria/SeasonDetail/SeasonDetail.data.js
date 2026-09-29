// SeasonDetail sayfasının veri erişim katmanı — BreakingBad/HouseOfTheDragon
// SeasonDetail.data.js ile BİREBİR aynı desen (standart imza şablonu).
// theme Euphoria sayfasının KENDİ temasıdır (bkz. ../Euphoria.data.js).
export { fetchProductionDetail, fetchSeasonDetail } from '../../../../shared/api/productions';
export { theme } from '../Euphoria.data';

import { fetchRelatedBlogs } from '../../../../shared/api/blogs';

export function getRelatedBlogs({ seasonNumber }) {
  return fetchRelatedBlogs({
    productionType: 'SERIES',
    productionSlug: 'euphoria',
    seasonNumber,
  });
}
