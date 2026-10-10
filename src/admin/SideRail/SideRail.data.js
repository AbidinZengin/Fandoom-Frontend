import { DocIcon, FilmIcon, HomeIcon, TvIcon } from '../icons';

// Rail öğeleri — yeni panel bölümleri (Yapımlar vb.) buraya eklenir.
// `end`: yalnız tam eşleşmede aktif.
export const NAV_ITEMS = [
  { to: '/admin', label: 'Genel', icon: HomeIcon, end: true },
  { to: '/admin/series', label: 'Diziler', icon: TvIcon },
  { to: '/admin/movies', label: 'Filmler', icon: FilmIcon },
  { to: '/admin/blogs', label: 'Blog', icon: DocIcon },
];
