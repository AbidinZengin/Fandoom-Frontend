// SeasonDetail sayfasının veri erişim katmanı — BreakingBad/HouseOfTheDragon
// SeasonDetail.data.js ile BİREBİR aynı desen (standart imza şablonu).
// theme Invincible'ın KENDİ temasıdır (bkz. ../Invincible.data.js).
export { fetchProductionDetail, fetchSeasonDetail } from '../../../../shared/api/productions';
export { theme } from '../Invincible.data';

import { fetchRelatedBlogs } from '../../../../shared/api/blogs';

export function getRelatedBlogs({ seasonNumber }) {
  return fetchRelatedBlogs({
    productionType: 'SERIES',
    productionSlug: 'invincible',
    seasonNumber,
  });
}
