// SeasonDetail sayfasının veri erişim katmanı — BreakingBad/SeasonDetail
// .data.js ile BİREBİR aynı desen (standart imza şablonu). theme HOTD'nin
// KENDİ temasıdır (bkz. ../HouseOfTheDragon.data.js).
export { fetchProductionDetail, fetchSeasonDetail } from '../../../../shared/api/productions';
export { theme } from '../HouseOfTheDragon.data';

import { fetchRelatedBlogs } from '../../../../shared/api/blogs';

export function getRelatedBlogs({ seasonNumber }) {
  return fetchRelatedBlogs({
    productionType: 'SERIES',
    productionSlug: 'house-of-the-dragon',
    seasonNumber,
  });
}
