// Yapım başına ELLE küratörlüğü yapılan marka teması (bg/accent/fg/gradient).
// Backend bu alanları saklamaz — bu tamamen UI katmanı bilgisidir (learned-rules:
// "Yapım sayfaları TAM TEMA kurar"). Eksik girişler defaultTheme'e düşer;
// yeni yapım için gerçek tasarım kararı verildikçe buraya işlenir
// (posterBySlug ile aynı desen: "bulundukça eklenir").
export const themeBySlug = {
  from: {
    bg: '#0b0f0a',
    accent: '#6f7a3f',
    fg: '#e4e2d6',
    gradient: 'linear-gradient(160deg, #10140f 0%, #26311f 45%, #3d1414 100%)',
  },
  'game-of-thrones': {
    bg: '#120e08',
    accent: '#e8974a',
    fg: '#efe6d2',
    gradient: 'linear-gradient(160deg, #17130a 0%, #3a2c10 45%, #5a1414 100%)',
  },
  severance: {
    bg: '#05100e',
    accent: '#1fb5a3',
    fg: '#eafffb',
    gradient: 'linear-gradient(160deg, #06100e 0%, #0f2b26 45%, #123632 100%)',
  },
  'house-of-the-dragon': {
    bg: '#120404',
    accent: '#c23b3b',
    fg: '#f4e6e2',
    gradient: 'linear-gradient(160deg, #140506 0%, #350a0a 45%, #591414 100%)',
  },
  'stranger-things': {
    bg: '#0a0512',
    accent: '#e0334f',
    fg: '#efe6ff',
    gradient: 'linear-gradient(160deg, #0a0512 0%, #1f0e33 45%, #3d0d1a 100%)',
  },
  'the-bear': {
    bg: '#120a05',
    accent: '#e08a2e',
    fg: '#f6ead9',
    gradient: 'linear-gradient(160deg, #120a05 0%, #2e1a0a 45%, #4a2410 100%)',
  },
};

export const defaultTheme = {
  bg: '#050505',
  accent: '#a02cd8',
  fg: '#f5f5f5',
  gradient: 'linear-gradient(160deg, #050505 0%, #0d0d0f 50%, #050505 100%)',
};
