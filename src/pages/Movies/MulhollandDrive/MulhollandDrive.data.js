// Mulholland Drive sayfasının veri erişim katmanı — GET /api/movies/slug/:slug'a
// bağlı. theme (bg/accent/cardBg) backend'de karşılığı olmayan, salt frontend'e
// ait sunum verisidir — learned-rules [renk]: zemin sitenin standart siyahında
// kalır, yapımın karakter rengi SADECE accent'e işler. Kırmızı (#c4372f)
// Betty'nin kırmızı üstünden/dudaklardan alınan kullanıcı onaylı değer
// (2026-09-27).
export { fetchProductionDetail } from '../../../shared/api/productions';
export { resolveGenreNames } from '../../../shared/api/genres';

export const MOVIE_ID = 7;

export const theme = {
  bg: '#050505',
  accent: '#c4372f',
  cardBg: '#101012',
};

// Atmosphere üst başlığı (eyebrow) editöryel metindir, kullanıcı seçene kadar
// boş (null) kalır ve gizlenir.
export const ATMOSPHERE_EYEBROW = null;
