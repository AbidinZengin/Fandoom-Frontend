import { quickSearch } from '../../../shared/api/search';

export const MIN_QUERY_LENGTH = 2;
export const DEBOUNCE_MS = 300;

// PERSON grubu kişi detay sayfası gelene kadar gösterilmez (kullanıcı kararı,
// 2026-10-15). Sıra backend'den gelir; burası yalnız neyin görüneceğini seçer.
const VISIBLE_TYPES = new Set(['MOVIE', 'SERIES', 'CHARACTER', 'PORTAL', 'BLOG']);

export const GROUP_LABEL_KEYS = {
  MOVIE: 'search.groups.movies',
  SERIES: 'search.groups.series',
  CHARACTER: 'search.groups.characters',
  PORTAL: 'search.groups.portals',
  BLOG: 'search.groups.blogs',
};

// Karakterin kendi detay sayfası yok ve SearchHit yapım bilgisi taşımıyor:
// tıklama tam arama sayfasının Karakterler sekmesine gider (kullanıcı kararı).
export function hitPath(type, hit, q) {
  switch (type) {
    case 'MOVIE':
      return `/movies/${hit.slug}`;
    case 'SERIES':
      return `/series/${hit.slug}`;
    case 'PORTAL':
      return `/portal/${hit.slug}`;
    case 'BLOG':
      return `/blog/${hit.slug}`;
    case 'CHARACTER':
      return searchPagePath(q, 'characters');
    default:
      return searchPagePath(q);
  }
}

export function searchPagePath(q, type) {
  const params = new URLSearchParams({ q });
  if (type) params.set('type', type);
  return `/search?${params}`;
}

// Küçük poster (2:3) thumbnail — Cloudinary dönüşümü FE'de eklenir (sözleşme).
// Cloudinary dışı URL'ler olduğu gibi kalır.
export function thumbUrl(url) {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  return url.replace('/upload/', '/upload/c_fill,g_auto,w_72,h_108,f_auto,q_auto/');
}

export async function fetchQuickResults(q, { signal } = {}) {
  const data = await quickSearch(q, { signal });
  return (data?.groups ?? []).filter((g) => VISIBLE_TYPES.has(g.type) && g.items.length > 0);
}

