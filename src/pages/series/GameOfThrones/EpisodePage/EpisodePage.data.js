// EpisodePage'in veri erişim katmanı — sezon listesi için GET
// /api/series/slug/:slug'a, sezonun bölüm dizisi için GET /api/seasons/:id'e
// bağlıdır (SeasonEpisodes ile aynı iki uç, backend DTO'suyla birebir).
import {
  fetchProductionDetail as apiProductionDetail,
  fetchSeasonDetail as apiSeasonDetail,
} from '../../../../shared/api/productions';

// Bölüm/sezon değiştirmek route param'ı değiştirdiği için effect'ler yeniden
// çalışır ve AYNI iki uç tekrar tekrar çağrılırdı. Yanıtlar bu oturum
// boyunca değişmeyen katalog verisi olduğundan promise düzeyinde
// önbelleklenir — eşzamanlı çağrılar da tek isteğe iner. Hata durumunda
// kayıt düşürülür ki sonraki deneme gerçekten yeniden istesin.
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

// Backend Cloudinary'den ham dosyayı veriyor (bölüm kareleri 3840x2160 JPEG) —
// 1920px'lik bir hero için ~4 kat fazla piksel. URL'e dönüşüm segmenti
// eklenerek format (f_auto → webp/avif) ve kalite (q_auto) tarayıcıya göre
// seçtirilir. Cloudinary olmayan/biçimi tanınmayan URL olduğu gibi döner.
export function still(url, width) {
  if (!url || !url.includes('/image/upload/')) return url;
  return url.replace('/image/upload/', `/image/upload/f_auto,q_auto,w_${width}/`);
}

// Hero tam genişlik (sizes="100vw") — yaygın ekran genişliklerine göre
// srcset; tarayıcı DPR'ı da hesaba katarak en uygununu seçer.
export function stillSrcSet(url) {
  if (!url || !url.includes('/image/upload/')) return undefined;
  return [1280, 1920, 2560].map((w) => `${still(url, w)} ${w}w`).join(', ');
}
