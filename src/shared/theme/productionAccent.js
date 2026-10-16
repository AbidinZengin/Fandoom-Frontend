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
  invincible: {
    posterGradient: 'linear-gradient(160deg, #06090f 0%, #10254a 45%, #4a3c08 100%)',
    accent: '#f2c230',
  },
  'silo': {
    posterGradient: 'linear-gradient(160deg, #0a0a0a 0%, #48300e 45%, #90601d 100%)',
    accent: '#f0a030',
  },
  'the-last-of-us': {
    posterGradient: 'linear-gradient(160deg, #0a0a0a 0%, #2f361b 45%, #5e6b37 100%)',
    accent: '#9db35b',
  },
  'euphoria': {
    posterGradient: 'linear-gradient(160deg, #0a0a0a 0%, #372548 45%, #6d4a90 100%)',
    accent: '#b67cf0',
  },
  'the-terror': {
    posterGradient: 'linear-gradient(160deg, #0a0a0a 0%, #2b3741 45%, #566e82 100%)',
    accent: '#8fb8d8',
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
  invincible: ['#f2c230', '#796118', '#0a0a0a'], // tek renk: kostüm sarısı (accent) → yarı koyulaşmış sarı → siyaha yakın (kullanıcı kararı, 2026-09-30)
  'silo': ['#f0a030', '#714b17', '#0a0a0a'], // tek renk: accent → yarı koyulaşmış → siyaha yakın (Invincible ile aynı kural)
  'the-last-of-us': ['#9db35b', '#4a542b', '#0a0a0a'], // tek renk: accent → yarı koyulaşmış → siyaha yakın (Invincible ile aynı kural)
  'euphoria': ['#b67cf0', '#563a71', '#0a0a0a'], // tek renk: accent → yarı koyulaşmış → siyaha yakın (Invincible ile aynı kural)
  'the-terror': ['#8fb8d8', '#435666', '#0a0a0a'], // tek renk: accent → yarı koyulaşmış → siyaha yakın (Invincible ile aynı kural)
  midsommar: ['#0a0a0a', '#665523', '#d9b44a'], // tek renk: siyaha yakın (sol) → yarı koyulaşmış → accent (sağ) (kullanıcı kararı, 2026-10-05)
  pearl: ['#0a0a0a', '#541216', '#b3262e'], // tek renk: siyaha yakın (sol) → yarı koyulaşmış → accent (sağ) (kullanıcı kararı, 2026-10-05)
  nightcrawler: ['#0a0a0a', '#694b17', '#e0a030'], // tek renk: siyaha yakın (sol) → yarı koyulaşmış → accent (sağ) (kullanıcı kararı, 2026-10-05)
  'gone-girl': ['#0a0a0a', '#434d54', '#8fa3b3'], // tek renk: siyaha yakın (sol) → yarı koyulaşmış → accent (sağ) (kullanıcı kararı, 2026-10-05)
  'the-shining': ['#0a0a0a', '#5e281d', '#c8553d'], // tek renk: siyaha yakın (sol) → yarı koyulaşmış → accent (sağ) (kullanıcı kararı, 2026-10-05)
  'a-clockwork-orange': ['#0a0a0a', '#6d3814', '#e8782a'], // tek renk: siyaha yakın (sol) → yarı koyulaşmış → accent (sağ) (kullanıcı kararı, 2026-10-05)
  'eyes-wide-shut': ['#0a0a0a', '#4f1823', '#a8324a'], // tek renk: siyaha yakın (sol) → yarı koyulaşmış → accent (sağ) (kullanıcı kararı, 2026-10-05)
  obsession: ['#0a0a0a', '#5b2014', '#c2452b'], // tek renk: siyaha yakın (sol) → yarı koyulaşmış → accent (sağ) (öneri, 2026-10-09; renk onayı bekliyor)
  'the-lighthouse': ['#0a0a0a', '#594b2d', '#d4b36a'], // tek renk: lamba ışığı kehribarı (kullanıcı kararı, 2026-10-10)
  'taxi-driver': ['#0a0a0a', '#74580f', '#f6bb20'], // tek renk: checker taksi sarısı (öneri, 2026-10-16; renk onayı bekliyor)
  'wuthering-heights': ['#0a0a0a', '#511018', '#c2253a'], // tek renk: kırmızı elbise kızılı (kullanıcı kararı, 2026-10-10)
  frankenstein: ['#0a0a0a', '#284935', '#5fae7e'], // tek renk: laboratuvar yeşili (kullanıcı kararı, 2026-10-10)
  'project-hail-mary': ['#0a0a0a', '#653a0f', '#f08a24'], // tek renk: astronot kıyafeti turuncusu (kullanıcı kararı, 2026-10-10)
  'the-silence-of-the-lambs': ['#0a0a0a', '#33415a', '#7a9bd6'], // tek renk: soğuk mavi (kullanıcı kararı, 2026-10-10)
  enemy: ['#0a0a0a', '#4b4b22', '#b8b64e'], // tek renk: Toronto'yu saran zeytin-sarı sis (kullanıcı kararı, 2026-10-11)
  'girl-interrupted': ['#0a0a0a', '#644148', '#d48a9a'], // tek renk: koğuş pembesi, açılış yazısının soluk gülü (öneri, 2026-10-16; renk onayı bekliyor)
  'sinister': ['#0a0a0a', '#54110f', '#b3241f'], // tek renk: kan duvarı kızılı (öneri, 2026-10-16; renk onayı bekliyor)
  'weapons': ['#0a0a0a', '#651815', '#d6332c'], // tek renk: gece 2:17 saat kırmızısı (öneri, 2026-10-16; renk onayı bekliyor)
  'call-me-by-your-name': ['#0a0a0a', '#766802', '#fbde05'], // tek renk: afiş yazısının yaz sarısı (öneri, 2026-10-16; renk onayı bekliyor)
  'challengers': ['#0a0a0a', '#616923', '#cfe04a'], // tek renk: tenis topu sarısı (öneri, 2026-10-16; renk onayı bekliyor)
  'mickey-17': ['#0a0a0a', '#6b4e03', '#e3a506'], // tek renk: afiş hardal sarısı (öneri, 2026-10-16; renk onayı bekliyor)
  'the-odyssey': ['#0a0a0a', '#5c0a0c', '#c4161a'], // tek renk: miğfer sorgucu kızılı (öneri, 2026-10-16; renk onayı bekliyor)
  'memento': ['#0a0a0a', '#664c23', '#d8a24a'], // tek renk: polaroid sepyası (öneri, 2026-10-16; renk onayı bekliyor)
  'american-psycho': ['#0a0a0a', '#54080e', '#b3121e'], // tek renk: kravat ve kan kırmızısı (öneri, 2026-10-16; renk onayı bekliyor)
};
