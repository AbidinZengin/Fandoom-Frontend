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
