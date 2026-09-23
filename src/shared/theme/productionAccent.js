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
    posterGradient: 'linear-gradient(160deg, #0a0512 0%, #1f0e33 45%, #3d0d0d 100%)',
    accent: '#e2231a',
  },
  'the-boys': {
    posterGradient: 'linear-gradient(160deg, #050a12 0%, #0c2340 45%, #4a0f14 100%)',
    accent: '#38a3ff',
  },
  'the-bear': {
    posterGradient: 'linear-gradient(160deg, #120a05 0%, #2e1a0a 45%, #4a2410 100%)',
    accent: '#e08a2e',
  },
};

export function getProductionAccent(slug) {
  return PRODUCTION_ACCENT[slug] ?? null;
}

// AccentButton'ın (src/styles/AccentButton.module.css) 3 duraklı gradient
// halkası — soldan sağa, KULLANICI SEÇER (2026-09-20). Yapım başına TEK yer;
// dizi sayfaları applyAccentGradient(slug) ile okur. Girdisi olmayan dizide
// theme.css'teki accent-türevi renkler geçerli kalır. PRODUCTION_ACCENT'ten
// ayrı: o haritanın tüketicileri (Home/News/Community) afiş gradyanı bekler ve
// tüm diziler orada yok (breaking-bad, pluribus, it-welcome-to-derry).
export const PRODUCTION_BUTTON_GRADIENT = {
  severance: ['#3a3e43', '#537594', '#458aca'], // rgb(58,62,67) → rgb(83,117,148) → rgb(69,138,202)
  pluribus: ['#f0f8ff', '#769ec1', '#d2d04f'], // aliceblue → rgb(118,158,193) → rgb(210,208,79)
  'it-welcome-to-derry': ['#181818', '#3f0e0e', '#ac0f0f'], // rgb(24,24,24) → #3f0e0e → rgb(172,15,15)
  'game-of-thrones': ['#343532fa', 'hwb(36 9% 79%)', '#3f2f12'], // koyu füme (kullanıcı değeri birebir) → hwb(36 9% 79%) koyu kahve → #3f2f12; NOT: GoT Hero'sunda AccentButton kullanan buton henüz yok, sayfa applyAccentGradient çağırmıyor
  from: ['#262626fa', 'hwb(157 20% 77%)', '#2a3a2d'], // koyu gri (kullanıcı değeri birebir) → hwb(157 20% 77%) koyu yeşil → #2a3a2d
  'house-of-the-dragon': ['#33342efa', 'hwb(4 8% 67%)', '#780505'], // koyu füme (kullanıcı değeri birebir) → hwb(4 8% 67%) koyu bordo → #780505 kırmızı
  'breaking-bad': ['#262626fa', 'hwb(160 16% 82%)', '#0b2311'], // koyu gri (kullanıcı değeri birebir) → hwb(160 16% 82%) koyu yeşil → #0b2311 koyu orman yeşili
  'stranger-things': ['#070b4efa', 'hsl(0, 73%, 16%)', '#950707'], // koyu lacivert (kullanıcı değeri birebir) → koyu bordo hsl(0,73%,16%) → rgb(149,7,7) kırmızı
};
