// PageBuilder'ın ICON preset'i için site-İÇERİĞİ ikon seti — icons.jsx'teki
// admin toolbar ikonlarından BİLİNÇLİ olarak ayrı (farklı kaygı: biri editör
// chrome'u, biri üretilen sayfaya gömülecek gerçek içerik). Yeni bir npm
// paketi eklenmeden (CLAUDE.md kuralı) elle çizilmiş, tek `d` path'i olacak
// şekilde tutulur — hem IconRenderer'ın (canvas) React render'ı hem de
// jsxForBlock'un (codegen) string üretimi AYNI veriden beslenir, tekrar
// yazım yok. `filled: true` → fill=currentColor/stroke=none, aksi halde
// stroke=currentColor (icons.jsx'teki IconPointer/diğerleri ile aynı ayrım).
export const CONTENT_ICONS = {
  play: { viewBox: '0 0 24 24', path: 'M8 5l11 7-11 7V5z', filled: true },
  star: {
    viewBox: '0 0 24 24',
    path: 'M12 2l2.9 6.9L22 9.2l-5.5 5 1.6 7.6L12 18l-6.1 3.8 1.6-7.6-5.5-5 7.1-0.3L12 2z',
    filled: true,
  },
  heart: {
    viewBox: '0 0 24 24',
    path: 'M12 20s-7-4.4-9.5-9C1 7.8 2.3 4.8 5.4 4.1 7.6 3.6 9.8 4.6 12 7c2.2-2.4 4.4-3.4 6.6-2.9 3.1.7 4.4 3.7 2.9 6.9C19 15.6 12 20 12 20z',
    filled: true,
  },
  share: { viewBox: '0 0 24 24', path: 'M14 3h7v7M21 3l-9 9M5 12v7a2 2 0 002 2h7M5 12V5a2 2 0 012-2h6' },
  arrowRight: { viewBox: '0 0 24 24', path: 'M4 12h16M13 5l7 7-7 7' },
  close: { viewBox: '0 0 24 24', path: 'M6 6l12 12M18 6L6 18' },
  chevronDown: { viewBox: '0 0 24 24', path: 'M5 8l7 7 7-7' },
  menu: { viewBox: '0 0 24 24', path: 'M4 6h16M4 12h16M4 18h16' },
};

export const CONTENT_ICON_KEYS = Object.keys(CONTENT_ICONS);
