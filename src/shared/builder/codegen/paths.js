// targetDir'in `src/pages/` köküne göre derinliği + üretilen component'in
// KENDİ klasörü (+1) — `src/shared/api/*` gibi ortak modüllere giden `../`
// sayısını belirler. Node'un `path` modülü TARAYICIDA yok (bu motor
// PageBuilder React uygulamasının içinde, istemci tarafında çalışıyor),
// bu yüzden elle hesaplanır.
//
// Örnek: targetDir "series/GameOfThrones/Intro" (3 segment) → üretilen
// dosya src/pages/series/GameOfThrones/Intro/<Ad>/<Ad>.jsx'te oturur —
// src/'e dönmek için 5 kez "../" gerekir (pages, series, GameOfThrones,
// Intro, <Ad> — beş klasör derinliği).
export function relativeImportPrefix(targetDir) {
  const depth = targetDir.split('/').filter(Boolean).length + 2;
  return '../'.repeat(depth);
}
