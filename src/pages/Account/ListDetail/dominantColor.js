// Kapak görselinden ortalama rengi çıkarır (Spotify "now playing" tarzı
// arka plan tonu için) — küçük bir canvas'a düşürülmüş görüntüden piksel
// ortalaması alınır. CORS engellenmiş görsellerde canvas "tainted" olur
// (getImageData atar) — bu durumda nötr gri fallback'e düşülür.
const FALLBACK_RGB = [60, 60, 60];
const SAMPLE_SIZE = 24;

export function extractDominantColor(src) {
  return new Promise((resolve) => {
    if (!src) {
      resolve(FALLBACK_RGB);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = SAMPLE_SIZE;
        canvas.height = SAMPLE_SIZE;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
        const { data } = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
        let r = 0;
        let g = 0;
        let b = 0;
        let count = 0;
        for (let i = 0; i < data.length; i += 4) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count += 1;
        }
        resolve([Math.round(r / count), Math.round(g / count), Math.round(b / count)]);
      } catch {
        resolve(FALLBACK_RGB);
      }
    };
    img.onerror = () => resolve(FALLBACK_RGB);
    img.src = src;
  });
}

// ── Canlı baskın renk (hero/kart "erime" zemini için) ──
// Piksel ortalaması koyu görsellerde çamurlu/siyaha yakın çıkar ve gri ortalama
// hue taşımaz. Burada pikseller ton (hue) kovalarına dağıtılır, kovanın ağırlığı
// doygunluk × orta-parlaklık yakınlığıdır (siyah/beyaz/renksiz pikseller sayılmaz);
// en ağır kovanın ortalaması alınır, sonra portal accent renkleri gibi görünür
// bir parlaklık/doygunluk aralığına çekilir. Renksiz (gri tonlu) görsel → nötr gri.
const HUE_BUCKETS = 36;
const VIVID_SAMPLE_SIZE = 48;
const VIVID_LIGHTNESS = 0.4;
const VIVID_MIN_SATURATION = 0.5;
export const NEUTRAL_GRAY = [80, 80, 80];

function rgbToHsl(r, g, b) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  const l = (max + min) / 2;
  if (delta === 0) return { h: 0, s: 0, l };
  const s = delta / (1 - Math.abs(2 * l - 1));
  let h;
  if (max === rn) h = ((gn - bn) / delta) % 6;
  else if (max === gn) h = (bn - rn) / delta + 2;
  else h = (rn - gn) / delta + 4;
  return { h: (h * 60 + 360) % 360, s, l };
}

function hslToRgb(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

export function extractVividDominantColor(src) {
  return new Promise((resolve) => {
    if (!src) {
      resolve(NEUTRAL_GRAY);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = VIVID_SAMPLE_SIZE;
        canvas.height = VIVID_SAMPLE_SIZE;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, VIVID_SAMPLE_SIZE, VIVID_SAMPLE_SIZE);
        const { data } = ctx.getImageData(0, 0, VIVID_SAMPLE_SIZE, VIVID_SAMPLE_SIZE);
        const buckets = Array.from({ length: HUE_BUCKETS }, () => ({ weight: 0, r: 0, g: 0, b: 0 }));
        for (let i = 0; i < data.length; i += 4) {
          const { h, s, l } = rgbToHsl(data[i], data[i + 1], data[i + 2]);
          // Siyaha/beyaza yakın ve renksiz pikseller baskın renk sayılmaz.
          const weight = s * (1 - Math.abs(2 * l - 1));
          if (weight < 0.05) continue;
          const bucket = buckets[Math.floor(h / (360 / HUE_BUCKETS)) % HUE_BUCKETS];
          bucket.weight += weight;
          bucket.r += data[i] * weight;
          bucket.g += data[i + 1] * weight;
          bucket.b += data[i + 2] * weight;
        }
        const top = buckets.reduce((best, bucket) => (bucket.weight > best.weight ? bucket : best));
        if (top.weight === 0) {
          resolve(NEUTRAL_GRAY);
          return;
        }
        const { h, s } = rgbToHsl(top.r / top.weight, top.g / top.weight, top.b / top.weight);
        resolve(hslToRgb(h, Math.max(s, VIVID_MIN_SATURATION), VIVID_LIGHTNESS));
      } catch {
        resolve(NEUTRAL_GRAY);
      }
    };
    img.onerror = () => resolve(NEUTRAL_GRAY);
    img.src = src;
  });
}
