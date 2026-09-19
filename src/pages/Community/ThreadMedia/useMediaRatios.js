import { useEffect, useState } from 'react';

// Backend medya boyutu (genişlik/yükseklik) döndürmüyor — oranlar tarayıcıda,
// görsel/video metadata'sı yüklenince ölçülür. URL bazlı önbellek: aynı medya
// tekrar (feed yeniden yüklenince, detay sayfasına geçince) ölçülmez.
const FALLBACK_RATIO = 4 / 3;
const cache = new Map();

function measure({ url, type }) {
  if (cache.has(url)) return Promise.resolve(cache.get(url));

  return new Promise((resolve) => {
    const finish = (ratio) => {
      cache.set(url, ratio);
      resolve(ratio);
    };
    if (type === 'VIDEO') {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => finish(video.videoWidth / video.videoHeight || FALLBACK_RATIO);
      video.onerror = () => finish(FALLBACK_RATIO);
      video.src = url;
    } else {
      const image = new Image();
      image.onload = () => finish(image.naturalWidth / image.naturalHeight || FALLBACK_RATIO);
      image.onerror = () => finish(FALLBACK_RATIO);
      image.src = url;
    }
  });
}

// Tüm oranlar hazır olana dek null döner (çağıran sabit oranlı bir yer tutucu
// çizer, düzen sıçraması yaşanmaz).
export function useMediaRatios(items) {
  const key = items.map((item) => item.url).join('|');
  const [result, setResult] = useState({ key: '', ratios: null });

  useEffect(() => {
    let cancelled = false;
    Promise.all(items.map(measure)).then((ratios) => {
      if (!cancelled) setResult({ key, ratios });
    });
    return () => {
      cancelled = true;
    };
    // items içeriği key'e sıkıştırıldı (URL listesi) — referans değişimi tetiklemesin.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return result.key === key ? result.ratios : null;
}
