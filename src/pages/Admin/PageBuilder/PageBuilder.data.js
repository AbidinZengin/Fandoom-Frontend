// Floating Toolbar'daki 5 gerçek bileşen (Pointer hariç — o bir araç,
// blok değil). heroBlockRenderers.jsx'teki BLOCK_RENDERERS deseninin
// bu sayfaya özel karşılığı — gerçek registerComponent() çağrıları JSX
// içerdiği için PageBuilder.blockRenderers.jsx'te (bu dosya SALT VERİ).
export const TOOLS = [
  { componentType: null, label: 'Pointer', key: '1' },
  { componentType: 'RECTANGLE', label: 'Rectangle', key: '2' },
  { componentType: 'DIAMOND', label: 'Diamond', key: '3' },
  { componentType: 'CIRCLE', label: 'Circle', key: '4' },
  { componentType: 'BUTTON', label: 'Button', key: '5' },
  { componentType: 'LOGO', label: 'Logo', key: '6' },
  { componentType: 'ICON', label: 'Icon', key: '7' },
  { componentType: 'TEXT', label: 'Text', key: '8' },
  { componentType: 'IMAGE', label: 'Image', key: '9' },
];

// Serbest metin CSS alanları (cursor/filter vb.) için datalist önerileri —
// kullanıcı isteği: "hem seçebilir hem yazabilir olsun". SHAPE/TEXT/IMAGE
// arasında ortak olanlar burada TEK yerde tutulur (registerComponent'lerin
// bulunduğu blockRenderers.jsx da bunları import eder).
export const CURSOR_PRESETS = [
  { value: 'default' },
  { value: 'pointer' },
  { value: 'grab' },
  { value: 'move' },
  { value: 'text' },
  { value: 'crosshair' },
  { value: 'zoom-in' },
  { value: 'not-allowed' },
  { value: 'help' },
];

export const FILTER_PRESETS = [
  { value: 'grayscale(1)' },
  { value: 'sepia(0.8)' },
  { value: 'brightness(1.2)' },
  { value: 'contrast(1.3)' },
  { value: 'saturate(1.6)' },
  { value: 'hue-rotate(90deg)' },
  { value: 'invert(1)' },
  { value: 'drop-shadow(0 6px 12px rgba(0,0,0,.35))' },
];

// Sağ panelin "Stil" sekmesi (PropertyFactory) için deklaratif kontrol
// listeleri — tip başına ne kadar geniş olursa Custom CSS o kadar nadir
// kullanılır (kullanıcı isteği: "CSS özelliklerini olabildiğince arttır").
export const SHAPE_CONTROLS = [
  { key: 'background', label: 'Background', type: 'color', default: '#ffffff' },
  { key: 'borderColor', label: 'Border color', type: 'color', default: '' },
  { key: 'borderWidth', label: 'Border width', type: 'text', default: '', presets: [{ value: '1px' }, { value: '2px' }, { value: '3px' }, { value: '4px' }] },
  {
    key: 'borderStyle',
    label: 'Border style',
    type: 'select',
    default: 'solid',
    options: [
      { value: 'solid', label: 'Solid' },
      { value: 'dashed', label: 'Dashed' },
      { value: 'dotted', label: 'Dotted' },
      { value: 'double', label: 'Double' },
    ],
  },
  {
    key: 'borderRadius',
    label: 'Radius',
    type: 'text',
    default: '',
    presets: [
      { value: '0' },
      { value: '4px' },
      { value: '8px' },
      { value: '16px' },
      { value: '9999px', label: '9999px (hap)' },
    ],
  },
  { key: 'rotate', label: 'Rotate (°)', type: 'slider', min: -180, max: 180, step: 1, default: 0 },
  { key: 'scale', label: 'Scale', type: 'slider', min: 0.5, max: 2, step: 0.05, default: 1 },
  { key: 'blur', label: 'Blur (px)', type: 'slider', min: 0, max: 20, step: 1, default: 0 },
  {
    key: 'mixBlendMode',
    label: 'Blend mode',
    type: 'select',
    default: 'normal',
    options: [
      { value: 'normal', label: 'Normal' },
      { value: 'multiply', label: 'Multiply' },
      { value: 'screen', label: 'Screen' },
      { value: 'overlay', label: 'Overlay' },
      { value: 'darken', label: 'Darken' },
      { value: 'lighten', label: 'Lighten' },
    ],
  },
  {
    key: 'transform',
    label: 'Transform (gelişmiş)',
    type: 'text',
    default: '',
    presets: [{ value: 'skew(-8deg, 0)' }, { value: 'skewY(4deg)' }, { value: 'translateY(-6px)' }, { value: 'perspective(600px) rotateY(20deg)' }],
  },
  { key: 'filter', label: 'Filter (gelişmiş)', type: 'text', default: '', presets: FILTER_PRESETS },
  { key: 'cursor', label: 'Cursor', type: 'text', default: '', presets: CURSOR_PRESETS },
];

// TEXT'in stil kontrol seti — BUTTON preset'i de bunu reuse eder (ayrı bir
// BUTTON stil listesi icat edilmedi, TEXT zaten "düz metin ya da pill/buton
// görünümü" ikisini de destekliyordu — bkz. PageBuilder.blockRenderers.jsx).
export const TEXT_CONTROLS = [
  { key: 'color', label: 'Text color', type: 'color', default: '#111111' },
  { key: 'fontSize', label: 'Size', type: 'text', default: '16px' },
  {
    key: 'fontFamily',
    label: 'Font',
    type: 'select',
    default: '',
    options: [
      { value: '', label: 'Default' },
      { value: "'Montserrat', sans-serif", label: 'Montserrat' },
      { value: "'Fraunces', serif", label: 'Fraunces' },
    ],
  },
  {
    key: 'fontWeight',
    label: 'Weight',
    type: 'select',
    default: '400',
    options: [
      { value: '400', label: 'Regular' },
      { value: '500', label: 'Medium' },
      { value: '600', label: 'Semibold' },
      { value: '700', label: 'Bold' },
      { value: '800', label: 'Extrabold' },
    ],
  },
  {
    key: 'letterSpacing',
    label: 'Letter spacing',
    type: 'text',
    default: '',
    presets: [{ value: '-0.02em' }, { value: '0' }, { value: '0.02em' }, { value: '0.05em' }, { value: '0.1em' }],
  },
  { key: 'lineHeight', label: 'Line height', type: 'text', default: '', presets: [{ value: '1' }, { value: '1.2' }, { value: '1.4' }, { value: '1.6' }] },
  {
    key: 'textAlign',
    label: 'Align',
    type: 'select',
    default: 'left',
    options: [
      { value: 'left', label: 'Left' },
      { value: 'center', label: 'Center' },
      { value: 'right', label: 'Right' },
    ],
  },
  {
    key: 'textTransform',
    label: 'Transform',
    type: 'select',
    default: 'none',
    options: [
      { value: 'none', label: 'None' },
      { value: 'uppercase', label: 'Uppercase' },
      { value: 'capitalize', label: 'Capitalize' },
    ],
  },
  {
    key: 'textDecoration',
    label: 'Decoration',
    type: 'text',
    default: '',
    presets: [{ value: 'none' }, { value: 'underline' }, { value: 'line-through' }, { value: 'underline dotted' }],
  },
  {
    key: 'textShadow',
    label: 'Text shadow',
    type: 'text',
    default: '',
    presets: [
      { value: '0 1px 2px rgba(0,0,0,.4)', label: 'Hafif' },
      { value: '0 2px 10px rgba(0,0,0,.6)', label: 'Derin' },
      { value: '0 0 12px currentColor', label: 'Glow' },
    ],
  },
  // Metin bloğu düz metin ya da (background+radius verilince) buton/
  // pill görünümü alabilir — ayrı bir BUTTON tipi icat edilmedi,
  // "excalidraw tarzı" tek esnek metin bloğu tercih edildi.
  { key: 'background', label: 'Background', type: 'color', default: '' },
  { key: 'borderRadius', label: 'Radius', type: 'text', default: '' },
  { key: 'borderColor', label: 'Border color', type: 'color', default: '' },
  { key: 'borderWidth', label: 'Border width', type: 'text', default: '', presets: [{ value: '1px' }, { value: '2px' }, { value: '3px' }, { value: '4px' }] },
  {
    key: 'borderStyle',
    label: 'Border style',
    type: 'select',
    default: 'solid',
    options: [
      { value: 'solid', label: 'Solid' },
      { value: 'dashed', label: 'Dashed' },
      { value: 'dotted', label: 'Dotted' },
      { value: 'double', label: 'Double' },
    ],
  },
  { key: 'rotate', label: 'Rotate (°)', type: 'slider', min: -180, max: 180, step: 1, default: 0 },
  { key: 'scale', label: 'Scale', type: 'slider', min: 0.5, max: 2, step: 0.05, default: 1 },
  { key: 'blur', label: 'Blur (px)', type: 'slider', min: 0, max: 20, step: 1, default: 0 },
  {
    key: 'mixBlendMode',
    label: 'Blend mode',
    type: 'select',
    default: 'normal',
    options: [
      { value: 'normal', label: 'Normal' },
      { value: 'multiply', label: 'Multiply' },
      { value: 'screen', label: 'Screen' },
      { value: 'overlay', label: 'Overlay' },
      { value: 'darken', label: 'Darken' },
      { value: 'lighten', label: 'Lighten' },
    ],
  },
  {
    key: 'transform',
    label: 'Transform (gelişmiş)',
    type: 'text',
    default: '',
    presets: [{ value: 'skew(-8deg, 0)' }, { value: 'skewY(4deg)' }, { value: 'translateY(-6px)' }, { value: 'perspective(600px) rotateY(20deg)' }],
  },
  { key: 'filter', label: 'Filter (gelişmiş)', type: 'text', default: '', presets: FILTER_PRESETS },
  { key: 'cursor', label: 'Cursor', type: 'text', default: '', presets: CURSOR_PRESETS },
];

// Sadece görsel dönüşüm kontrolleri (kutu/border DEĞİL) — LOGO preset'i
// (gerçek FandoomLogo component'i, kendi iç layout'una sahip) için;
// SHAPE_CONTROLS'ün arka yarısıyla AYNI (bilinçli kopya, mevcut kod tekrarı
// deseniyle tutarlı — bkz. SHAPE_CONTROLS/TEXT_CONTROLS'ün de aynı kuyruğu
// taşıması).
export const VISUAL_TRANSFORM_CONTROLS = [
  { key: 'rotate', label: 'Rotate (°)', type: 'slider', min: -180, max: 180, step: 1, default: 0 },
  { key: 'scale', label: 'Scale', type: 'slider', min: 0.5, max: 2, step: 0.05, default: 1 },
  { key: 'blur', label: 'Blur (px)', type: 'slider', min: 0, max: 20, step: 1, default: 0 },
  {
    key: 'mixBlendMode',
    label: 'Blend mode',
    type: 'select',
    default: 'normal',
    options: [
      { value: 'normal', label: 'Normal' },
      { value: 'multiply', label: 'Multiply' },
      { value: 'screen', label: 'Screen' },
      { value: 'overlay', label: 'Overlay' },
      { value: 'darken', label: 'Darken' },
      { value: 'lighten', label: 'Lighten' },
    ],
  },
  {
    key: 'transform',
    label: 'Transform (gelişmiş)',
    type: 'text',
    default: '',
    presets: [{ value: 'skew(-8deg, 0)' }, { value: 'skewY(4deg)' }, { value: 'translateY(-6px)' }, { value: 'perspective(600px) rotateY(20deg)' }],
  },
  { key: 'filter', label: 'Filter (gelişmiş)', type: 'text', default: '', presets: FILTER_PRESETS },
  { key: 'cursor', label: 'Cursor', type: 'text', default: '', presets: CURSOR_PRESETS },
];

// EFEKTLER sekmesi (z-index/gölge/padding/opacity/...) her tipte AYNI —
// registry'nin tip-özel controls'üne değil, doğrudan bu sabit listeye
// bağlı (bkz. ContextPanel.jsx). Kullanıcı isteği: "daha çok abstract ve
// hazır kullanım için tasarlanmış olmalı, animasyonları da arttır" —
// bu yüzden yeni anahtarlar (backgroundImage/backdropFilter/animation/…)
// BİLİNÇLİ olarak SHAPE/TEXT/IMAGE controls'teki `background`/`transform`
// gibi anahtarlarla ÇAKIŞMAZ (aynı isim iki listede birden olursa
// ContextPanel'in EFFECT_KEYS ayrımı değeri yanlış sekmeden okur).
// `animation` ve `transformOrigin`, rotate/scale gibi Canvas.jsx'teki
// DIŞ sarmalayıcıya uygulanır (bkz. Canvas.jsx) — outer'da modern CSS'in
// AYRI `rotate`/`scale` property'leriyle birlikte var oldukları için
// preset'lerin `transform: scale()/rotate()` keyframe'leri kullanıcının
// elle verdiği rotate/scale slider'ıyla ÇARPIŞMAZ, üstüne biner (kasıtlı
// kompozisyon). `transition` hem dış hem iç köke uygulanır ki hover modu
// (styleMode) geçişleri animasyonlu olsun.
export const GRADIENT_PRESETS = [
  { value: 'var(--brand-gradient)', label: 'Marka gradyanı' },
  { value: 'var(--brand-gradient-blue)', label: 'Marka gradyanı (mavi)' },
  { value: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,.28), transparent 60%)', label: 'Radial parıltı' },
  { value: 'linear-gradient(135deg, #ff6a3d 0%, #e01275 55%, #7b2ff0 100%)', label: 'Gün batımı' },
  { value: 'linear-gradient(160deg, rgba(255,255,255,.16), rgba(255,255,255,.02))', label: 'Buzlu cam' },
  { value: 'radial-gradient(circle, transparent 35%, rgba(0,0,0,.7) 100%)', label: 'Koyu vinyet' },
  { value: 'conic-gradient(from 180deg, #e8112d, #7b2ff0, #3223e8, #e8112d)', label: 'Konik gökkuşağı' },
  {
    value:
      'radial-gradient(at 20% 20%, rgba(232,17,45,.35), transparent 50%), radial-gradient(at 80% 30%, rgba(123,47,240,.35), transparent 50%), radial-gradient(at 50% 85%, rgba(50,35,232,.35), transparent 50%)',
    label: 'Mesh (çok nokta)',
  },
];

export const ANIMATION_PRESETS = [
  { value: '', label: 'Yok' },
  { value: 'pbFloat 3s ease-in-out infinite', label: 'Yüzen' },
  { value: 'pbPulse 2.2s ease-in-out infinite', label: 'Nabız' },
  { value: 'pbSpin 6s linear infinite', label: 'Dönme' },
  { value: 'pbWiggle 1.6s ease-in-out infinite', label: 'Sallanma' },
  { value: 'pbBounceIn .7s cubic-bezier(.34,1.56,.64,1) both', label: 'Sıçrayarak giriş' },
  { value: 'pbFadeInUp .6s ease both', label: 'Yukarı belirme' },
];

export const EFFECT_CONTROLS = [
  { key: 'zIndex', label: 'Z-index', type: 'text' },
  {
    key: 'boxShadow',
    label: 'Shadow',
    type: 'text',
    presets: [
      { value: '0 4px 12px rgba(0,0,0,.25)', label: 'Yumuşak' },
      { value: '0 8px 24px rgba(0,0,0,.4)', label: 'Derin' },
      { value: '0 0 0 3px var(--brand-red)', label: 'Kırmızı outline' },
      { value: 'inset 0 0 0 2px rgba(255,255,255,.5)', label: 'İç çerçeve' },
      { value: '0 0 24px 4px var(--brand-red)', label: 'Neon parıltı' },
      { value: '0 0 0 2px rgba(255,255,255,.8), 0 8px 24px rgba(0,0,0,.4)', label: 'Çift halka' },
    ],
  },
  {
    key: 'padding',
    label: 'Padding',
    type: 'text',
    presets: [{ value: '8px' }, { value: '12px' }, { value: '16px' }, { value: '24px' }, { value: '12px 20px' }],
  },
  { key: 'opacity', label: 'Opacity', type: 'slider', min: 0, max: 1, step: 0.05, default: 1 },
  { key: 'backgroundImage', label: 'Fill / Gradient', type: 'text', default: '', presets: GRADIENT_PRESETS },
  {
    key: 'backgroundBlendMode',
    label: 'Fill blend mode',
    type: 'select',
    default: 'normal',
    options: [
      { value: 'normal', label: 'Normal' },
      { value: 'multiply', label: 'Multiply' },
      { value: 'screen', label: 'Screen' },
      { value: 'overlay', label: 'Overlay' },
      { value: 'soft-light', label: 'Soft light' },
      { value: 'color-dodge', label: 'Color dodge' },
      { value: 'luminosity', label: 'Luminosity' },
    ],
  },
  {
    key: 'backdropFilter',
    label: 'Backdrop (cam efekti)',
    type: 'text',
    default: '',
    presets: [
      { value: 'blur(8px)', label: 'Hafif blur' },
      { value: 'blur(16px) saturate(180%)', label: 'Cam (glass)' },
      { value: 'blur(24px) brightness(1.15)', label: 'Yoğun buzlu' },
      { value: 'blur(6px) contrast(1.1) saturate(1.4)', label: 'Canlı blur' },
    ],
  },
  {
    key: 'transformOrigin',
    label: 'Transform origin',
    type: 'select',
    default: 'center',
    options: [
      { value: 'center', label: 'Merkez' },
      { value: 'top', label: 'Üst' },
      { value: 'bottom', label: 'Alt' },
      { value: 'left', label: 'Sol' },
      { value: 'right', label: 'Sağ' },
      { value: 'top left', label: 'Sol üst' },
      { value: 'top right', label: 'Sağ üst' },
      { value: 'bottom left', label: 'Sol alt' },
      { value: 'bottom right', label: 'Sağ alt' },
    ],
  },
  {
    key: 'transition',
    label: 'Transition (hover geçişi)',
    type: 'text',
    default: '',
    presets: [
      { value: 'all var(--duration-micro) ease', label: 'Anlık' },
      { value: 'all var(--duration-fast) ease', label: 'Standart' },
      { value: 'all var(--duration-base) cubic-bezier(.16,1,.3,1)', label: 'Yumuşak & yavaş' },
      { value: 'transform var(--duration-fast) cubic-bezier(.34,1.56,.64,1)', label: 'Sadece transform (yaylı)' },
    ],
  },
  { key: 'animation', label: 'Animation (hazır)', type: 'text', default: '', presets: ANIMATION_PRESETS },
];

// Breakpoint (base/md/lg) × pseudo-state (normal/hover) matrisinden
// canvas'ta gösterilecek TEK efektif stil objesini kademeli olarak
// çözer — CSS'in kendi kademesiyle aynı sırada (base → aktif breakpoint,
// sonra normal → hover). Sadece SEÇİLİ blok için hover önizlemesi
// uygulanır (ContextPanel'deki mod seçiciyle), diğer bloklar her zaman
// kendi normal/base görünümünü gösterir.
export function resolveEffectiveStyle(block, breakpoint, mode) {
  const matrix = block.styles ?? {};
  const base = matrix.base ?? { normal: {}, hover: {} };
  const active = breakpoint !== 'base' ? matrix[breakpoint] : null;
  return {
    ...base.normal,
    ...(active?.normal ?? {}),
    ...(mode === 'hover' ? base.hover : {}),
    ...(mode === 'hover' ? (active?.hover ?? {}) : {}),
    ...parseCustomCss(block.customCss),
  };
}

// resolveEffectiveStyle ile AYNI kademeli desen, sadece hover katmanı yok
// (pozisyon/boyutun hover durumu olmaz) — bkz. schema.js layout yorumu.
// Dokunulmamış md/lg `null` kalır, base'in yüzdelerini miras alır.
const DEFAULT_LAYOUT = { x: 10, y: 10, w: 30, h: null };
export function resolveEffectiveLayout(block, breakpoint) {
  const matrix = block.layout ?? {};
  // Geriye dönük uyumluluk: Faz 1.5 öncesi kaydedilmiş bir taslakta layout
  // düz {x,y,w,h} olabilir (matrix.base yok ama matrix.x var) — bu durumda
  // matrix'in KENDİSİ base sayılır, veri kaybolmaz.
  const base = matrix.base ?? (matrix.x != null ? matrix : DEFAULT_LAYOUT);
  const active = breakpoint !== 'base' ? matrix[breakpoint] : null;
  return { ...DEFAULT_LAYOUT, ...base, ...(active ?? {}) };
}

// Bir layout patch'ini (x/y/w/h'den bir kısmı) AKTİF breakpoint'in kendi
// bucket'ına yazar — resolveEffectiveLayout'un okuduğu ŞEKİLLE simetrik.
// updateBlock(id, { layout: patchLayoutMatrix(block.layout, breakpoint, patch) })
// şeklinde kullanılır; Canvas.jsx'teki TÜM sürükle/resize/hizala yazma
// noktaları ve ContextPanel'in X/Y/W/H alanları bunu paylaşır.
export function patchLayoutMatrix(layout, breakpoint, patch) {
  const bucket = layout[breakpoint] ?? {};
  return { ...layout, [breakpoint]: { ...bucket, ...patch } };
}

// BlockItem.jsx'teki (SeriesHeroEditor) parseCustomCss ile AYNI mantık —
// bilinçli kopya, motor hiçbir editöre bağımlı olmamalı. Custom CSS
// TÜM deklare/efekt kontrollerinin ÜSTÜNE biner (kaçış kapısı — nadiren
// kullanılacak, kullanıcı isteği: "çok kullanmayacağız").
export function parseCustomCss(customCss) {
  if (!customCss) return {};
  const result = {};
  customCss.split(';').forEach((decl) => {
    const idx = decl.indexOf(':');
    if (idx === -1) return;
    const key = decl.slice(0, idx).trim();
    const value = decl.slice(idx + 1).trim();
    if (key && value) result[key] = value;
  });
  return result;
}
