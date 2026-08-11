// Backend'de HİÇ karşılığı olmayan, salt frontend'e ait sunum verisi —
// gerçek /api/productions bunu asla dönmeyecek (bkz. i18n endpoint sözleşmesi
// notları). Üretim başına afiş gradyanı + tema vurgu rengi; birden çok
// sayfa/component (ContentSection, NewsCard, Community/UniverseBrowse) aynı
// slug'lar için aynı renkleri kullandığından tek yerde toplanır.
export const PRODUCTION_ACCENT = {
  from: {
    posterGradient: 'linear-gradient(160deg, #10140f 0%, #26311f 45%, #3d1414 100%)',
    accent: '#6f7a3f',
  },
  'game-of-thrones': {
    posterGradient: 'linear-gradient(160deg, #17130a 0%, #3a2c10 45%, #5a1414 100%)',
    accent: '#e8974a',
  },
  severance: {
    posterGradient: 'linear-gradient(160deg, #06100e 0%, #0f2b26 45%, #123632 100%)',
    accent: '#1fb5a3',
  },
  'house-of-the-dragon': {
    posterGradient: 'linear-gradient(160deg, #140506 0%, #350a0a 45%, #591414 100%)',
    accent: '#c23b3b',
  },
  'stranger-things': {
    posterGradient: 'linear-gradient(160deg, #0a0512 0%, #1f0e33 45%, #3d0d1a 100%)',
    accent: '#e0334f',
  },
  'the-bear': {
    posterGradient: 'linear-gradient(160deg, #120a05 0%, #2e1a0a 45%, #4a2410 100%)',
    accent: '#e08a2e',
  },
};

export function getProductionAccent(slug) {
  return PRODUCTION_ACCENT[slug] ?? null;
}
