// TheSilenceOfTheLambs sayfasının veri erişim katmanı — GET /api/movies/slug/:slug'a
// bağlı. theme (bg/accent/cardBg) backend'de karşılığı olmayan, salt frontend'e
// ait sunum verisidir — learned-rules [renk]: zemin sitenin standart siyahında
// kalır, yapımın karakter rengi SADECE accent'e işler. soğuk mavi
// (#7a9bd6) öneri ton (2026-10-10), screenshot görülerek ince ayar alır.
export { fetchProductionDetail } from '../../../shared/api/productions';
export { resolveGenreNames } from '../../../shared/api/genres';

export const MOVIE_ID = 25;

export const theme = {
  bg: '#050505',
  accent: '#7a9bd6',
  cardBg: '#101012',
};

// Atmosphere üst başlığı (eyebrow) editöryel metindir, kullanıcı seçene kadar
// boş (null) kalır ve gizlenir.
export const ATMOSPHERE_EYEBROW = null;
