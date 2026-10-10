// Yan menü öğeleri — yeni admin bölümleri (Yapımlar vb.) buraya eklenir.
// `end`: yalnızca tam eşleşmede aktif (Genel, /admin/* altındaki her şeyde
// aktif görünmesin).
export const NAV_ITEMS = [
  { to: '/admin', label: 'Genel', end: true },
  { to: '/admin/blogs', label: 'Blog' },
  { to: '/admin/series-hero', label: 'Series Hero' },
  { to: '/admin/page-builder', label: 'Page Builder' },
];
