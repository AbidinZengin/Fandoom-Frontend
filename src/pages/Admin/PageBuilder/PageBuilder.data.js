// Floating Toolbar'daki 5 gerçek bileşen (Pointer hariç — o bir araç,
// blok değil). heroBlockRenderers.jsx'teki BLOCK_RENDERERS deseninin
// bu sayfaya özel karşılığı — gerçek registerComponent() çağrıları JSX
// içerdiği için PageBuilder.blockRenderers.jsx'te (bu dosya SALT VERİ).
export const TOOLS = [
  { componentType: null, label: 'Pointer', key: '1' },
  { componentType: 'RECTANGLE', label: 'Rectangle', key: '2' },
  { componentType: 'DIAMOND', label: 'Diamond', key: '3' },
  { componentType: 'CIRCLE', label: 'Circle', key: '4' },
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

// EFEKTLER sekmesi (z-index/gölge/padding/opacity) her tipte AYNI —
// registry'nin tip-özel controls'üne değil, doğrudan bu sabit listeye
// bağlı (bkz. ContextPanel.jsx).
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
    ],
  },
  {
    key: 'padding',
    label: 'Padding',
    type: 'text',
    presets: [{ value: '8px' }, { value: '12px' }, { value: '16px' }, { value: '24px' }, { value: '12px 20px' }],
  },
  { key: 'opacity', label: 'Opacity', type: 'slider', min: 0, max: 1, step: 0.05, default: 1 },
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
