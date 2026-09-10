// BreakingBad sayfasının veri erişim katmanı — GET /api/series/slug/:slug'a
// bağlı (entity'nin kendi verisi: title/synopsis/coverImageUrl). theme
// (bg/accent/cardBg) backend'de karşılığı olmayan, salt frontend'e ait
// sunum verisidir.
export { fetchProductionDetail } from '../../../shared/api/productions';
export { resolveGenreNames } from '../../../shared/api/genres';

export const theme = {
  // DÜZELTME (kullanıcı kararı, 2026-09-06): --bg TÜM opak bölüm
  // zeminlerinde (SeasonRoute/CharactersRoute/vb. `background: var(--bg)`)
  // düz dolgu olarak kullanılıyor — burayı cesur yeşil yapmak (#12211a)
  // TÜM sayfayı yeşile boyadı ("çok fazla yeşil" — kullanıcı düzeltmesi).
  // Doğrusu TERSİ: genel zemin neredeyse saf siyah kalır, hafif yeşil
  // sadece BreakingBad.jsx'teki body radial-gradient'inde, hero'nun
  // hemen etrafında yoğunlaşır. Diğer TÜM yapım sayfaları hâlâ #050505.
  bg: '#070907',
  accent: '#245a3e',
  cardBg: '#101012',
};
