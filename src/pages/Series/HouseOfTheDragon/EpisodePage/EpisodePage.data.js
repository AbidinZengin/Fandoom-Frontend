// EpisodePage'in veri erişim katmanı — BreakingBad/EpisodePage/EpisodePage.data.js
// ile BİREBİR aynı (production-agnostic desen), tek fark promise-cache'in
// kendi Map'leri (BB/GoT'unkiyle paylaşılmaz).
import {
  fetchProductionDetail as apiProductionDetail,
  fetchSeasonDetail as apiSeasonDetail,
} from '../../../../shared/api/productions';

const seriesCache = new Map();
const seasonCache = new Map();

function cached(store, key, load) {
  if (!store.has(key)) {
    store.set(
      key,
      load().catch((err) => {
        store.delete(key);
        throw err;
      })
    );
  }
  return store.get(key);
}

export function fetchProductionDetail(type, slug) {
  return cached(seriesCache, `${type}:${slug}`, () => apiProductionDetail(type, slug));
}

export function fetchSeasonDetail(seasonId) {
  return cached(seasonCache, String(seasonId), () => apiSeasonDetail(seasonId));
}

export function still(url, width) {
  if (!url || !url.includes('/image/upload/')) return url;
  return url.replace('/image/upload/', `/image/upload/f_auto,q_auto,w_${width}/`);
}

export function stillSrcSet(url) {
  if (!url || !url.includes('/image/upload/')) return undefined;
  return [1280, 1920, 2560].map((w) => `${still(url, w)} ${w}w`).join(', ');
}
