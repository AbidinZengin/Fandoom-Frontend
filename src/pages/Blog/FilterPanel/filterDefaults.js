// FilterPanel.jsx ve FilterResults.jsx arasında paylaşılan sabitler — ayrı
// dosyada (react/only-export-components: component dosyası sadece component
// export etmeli, fast-refresh bunu bozuyor).
export const SORT_OPTIONS = [
  { value: 'latest', label: 'Latest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'trending', label: 'Trending' },
  { value: 'recommended', label: 'Recommended' },
];

export const EMPTY_FILTERS = {
  format: null,
  franchise: null,
  genre: [],
  mood: [],
  spoilerFree: false,
  sort: 'latest',
};
