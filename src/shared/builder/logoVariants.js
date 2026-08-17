// PageBuilder'ın LOGO preset'i için yapım-logosu varyantları — FandoomLogo
// (component, kendi iç zoom mantığı var) DIŞINDAKİ tüm varyantlar
// src/assets/logos/'taki görsellerden `import.meta.glob` ile OTOMATİK
// keşfedilir (Vite `public/` klasörünü glob'layamaz — bu yüzden asset'ler
// public/ yerine burada). Yeni bir logo eklemek artık SADECE dosyayı bu
// klasöre atmak demek — kullanıcı raporu: "logos sayfasına yeni logo
// eklediğimde otomatik gelmiyor" (eskiden LOGO_VARIANTS + PageBuilder.data.js
// PRESET_VARIANTS iki AYRI yerde elle güncellenmesi gerekiyordu).
// Tek kaynak: hem canvas render'ı (PageBuilder.blockRenderers.jsx
// LogoRenderer) hem codegen (codegen/jsxForBlock.js) hem de LeftPanel'in
// preset flyout'u (bkz. altta LOGO_PRESET_VARIANTS, PageBuilder.data.js'in
// PRESET_VARIANTS'ına spread edilir) bu objeden okur. `variant` anahtarı
// yoksa (ör. 'fandoom') FandoomLogo render edilir — bkz. LogoRenderer'daki
// fallback.
const logoModules = import.meta.glob('/src/assets/logos/*.{svg,webp,png,jpg,jpeg}', { eager: true, import: 'default' });

// Dosya adından okunur bir varsayılan başlık türetir ("breaking-bad" →
// "Breaking Bad"). Kısaltma olan dosya adları (ör. "got") anlamlı bir
// başlık üretemez — bu durumlarda aşağıdaki LOGO_META_OVERRIDES'a KÜÇÜK
// bir override eklenebilir (ZORUNLU değil, sadece kozmetik).
function titleFromSlug(slug) {
  return slug.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// Dosya adından türetilemeyen alanlar (güzel başlık, tıklanınca gidilecek
// route) için OPSİYONEL override — yeni bir logo eklerken buraya girmek
// zorunlu DEĞİL; girilmezse dosya adından türetilen başlık ve boş route
// (`to: ''`) kullanılır, route istenirse ContextPanel'in "Link" alanından
// blok bazlı da girilebilir.
const LOGO_META_OVERRIDES = {
  got: { alt: 'Game of Thrones', to: '/series/game-of-thrones' },
  'breaking-bad': { alt: 'Breaking Bad', to: '/series/breaking-bad' },
};

export const LOGO_VARIANTS = Object.fromEntries(
  Object.entries(logoModules).map(([path, src]) => {
    const slug = path.split('/').pop().replace(/\.[^.]+$/, '');
    const override = LOGO_META_OVERRIDES[slug];
    return [slug, { src, alt: override?.alt ?? titleFromSlug(slug), to: override?.to ?? '' }];
  }),
);

// LeftPanel'in preset flyout'unda LOGO aracının altında görünen tile'lar —
// her keşfedilen logo için otomatik üretilir (bkz. PageBuilder.data.js
// PRESET_VARIANTS, bu diziyi spread eder).
export const LOGO_PRESET_VARIANTS = Object.entries(LOGO_VARIANTS).map(([variant, { src, alt, to }]) => ({
  componentType: 'LOGO',
  key: `logo-${variant}`,
  label: alt,
  previewImage: src,
  content: { variant, to },
  styles: {},
}));
