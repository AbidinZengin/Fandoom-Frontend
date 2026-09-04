import { LOGO_PRESET_VARIANTS } from '../../../shared/builder/logoVariants';

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
  // Nested/auto-layout container — diğerleriyle AYNI çiz-yerleştir yoluyla
  // (usePlacement.js, createEmptyBlock zaten CONTAINER'ı özel işliyor)
  // boş bir kesikli çerçeve olarak tuvale eklenir, sonra içine blok
  // sürüklenir (bkz. docs/plans/2026-08-18-pagebuilder-nested-blocks-design.md).
  { componentType: 'CONTAINER', label: 'Container', key: '0' },
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

// TOOLS'un YANINDA ikinci, opsiyonel bir katman: aynı componentType için
// hazır içerik+stil demeti sunan "preset varyant"lar — LeftPanel'in
// Components grid'inde ilgili aracın hemen ALTINDA kendi satırı olarak
// render edilir (bkz. LeftPanel.jsx), tıklanınca activeTool YİNE o
// componentType olur ama yerleştirilen blok TOOLS'un registry default'u
// yerine buradaki content/styles ile doğar (bkz. usePlacement.js
// activePreset). Yeni bir componentType/registry kaydı İCAT ETMEZ — sadece
// aynı BUTTON/LOGO/ICON motorunun farklı bir başlangıç durumu.
//
// İlk kayıt: BreakingBad Hero'daki "Watch Trailer" glassmorfik butonunun
// birebir kopyası (bkz. Hero.module.css .hero__trailer) — learned-rules
// kuralı (2026-08, "bundan sonra eklenen her buton glassmorfik") burada
// da BUTTON preset'inin YENİ varsayılan görünümü. ::before ile çizilen
// gradient-halka kenarlık (mask-composite) bu motorda YOK — düz
// borderColor/borderWidth'e sadeleştirildi, tek fark bu (ince ayrım,
// pixel-perfect değil).
// DÜZELTME (kullanıcı raporu, 2026-09-02): iki BUTTON preset'i de
// fontFamily'i HİÇ belirtmiyordu — TextRenderer bunu doğrudan inline
// style'a basıyor (bkz. PageBuilder.blockRenderers.jsx), boş kalınca
// tarayıcı varsayılan fontuna düşüp canvas'ta site copysinden (Montserrat)
// TAMAMEN farklı/kalın görünüyordu. Artık her iki preset'te de açıkça
// 'Montserrat', sans-serif — sitedeki her gerçek butonun (Hero.module.css
// vb.) taşıdığı değerle aynı.
export const PRESET_VARIANTS = [
  {
    componentType: 'BUTTON',
    key: 'buttonGlassTrailer',
    label: 'Watch Trailer',
    content: { text: '▶  Watch Trailer', to: '' },
    styles: {
      color: '#ffffff',
      fontSize: 'var(--text-sm)',
      fontFamily: "'Montserrat', sans-serif",
      fontWeight: '600',
      textAlign: 'center',
      background: 'linear-gradient(135deg, rgba(255,255,255,0.26) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.18) 100%)',
      borderRadius: 'var(--radius-pill)',
      borderColor: 'rgba(255,255,255,0.4)',
      borderWidth: '1px',
      borderStyle: 'solid',
      padding: 'var(--space-sm) var(--space-lg)',
      boxShadow: 'inset 0 1px 1px rgba(255,255,255,.55), inset 0 -10px 14px -12px rgba(0,0,0,.45), 0 10px 24px rgba(0,0,0,.4)',
      backdropFilter: 'blur(20px) saturate(200%) brightness(1.15)',
    },
  },
  {
    // Sık kullanılan ikinci buton — Sezonlar/Explore Season gibi ikincil
    // CTA'larda kullanılan "şeffaf zemin + kenarlık, hover'da dolan" desen —
    // SeasonRoute.module.css `.focus__cta`/`.focus__cta:hover` İLE BİREBİR
    // AYNI değerler (kullanıcı isteği: "border ı seasons routedaki buton
    // olacak hover ile beyaz olan"). `--fg` token'ı kullanılır (hardcode
    // beyaz DEĞİL) — production tema geçişlerinde (--bg/--accent/--card-bg
    // değişse de --fg sabit kalır) doğru rengi taşımaya devam eder.
    componentType: 'BUTTON',
    key: 'buttonOutline',
    label: 'Explore Season',
    // Ok, ayrı bir ICON bloğu DEĞİL — buttonGlassTrailer'ın "▶  Watch
    // Trailer" deseninin aynısı: glif metnin İÇİNDE, düz metin. Kullanıcı
    // isteği: "istersem kaldırabileyim" — metin alanından " →" silmek
    // yeterli, ayrı bir blok/preset ilişkisi yönetmeye gerek yok.
    // Metin, HotD/BB Hero'daki gerçek CTA copy'siyle (i18n
    // series.exploreSeasonCta = "Explore Season") ve SeasonRoute.jsx'teki
    // ArrowIcon'un birebir kopyası — kullanıcı verdiği referans görüntüyle
    // eşleşiyor (bkz. HouseOfTheDragon/BreakingBad Hero.jsx buttonBlock2).
    content: { text: 'Explore Season →', to: '' },
    styles: {
      color: 'var(--fg)',
      fontSize: 'var(--text-sm)',
      fontFamily: "'Montserrat', sans-serif",
      fontWeight: '600',
      textAlign: 'center',
      background: 'transparent',
      borderColor: 'var(--fg)',
      borderWidth: '1.5px',
      borderStyle: 'solid',
      borderRadius: 'var(--radius-pill)',
      padding: 'var(--space-sm) var(--space-lg)',
    },
    // Hover'da dolan (bg->fg, text->bg) — SeasonRoute .focus__cta:hover ile
    // aynı. Preset'ler için YENİ alan (bkz. schema.js createEmptyBlock
    // defaultHoverStyles, usePlacement.js effectiveDefinition) — normal
    // ayarlanabilir "Hover" stil moduna (ContextPanel) tuvale düşer düşmez
    // dolu gelir, admin sıfırdan ayarlamak zorunda kalmaz.
    hoverStyles: {
      background: 'var(--fg)',
      color: 'var(--bg)',
    },
  },
  // LOGO'nun düz aracı FandoomLogo verir (registry default'u) — yapım-özel
  // logo tile'ları artık src/assets/logos/'taki dosyalardan OTOMATİK
  // türetilir (bkz. shared/builder/logoVariants.js LOGO_PRESET_VARIANTS).
  // Yeni bir logo eklemek bu diziye elle satır eklemeyi GEREKTİRMEZ.
  ...LOGO_PRESET_VARIANTS,
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

// Nested/auto-layout bloklar (bkz.
// docs/plans/2026-08-18-pagebuilder-nested-blocks-design.md) — bir
// CONTAINER'ın ÇOCUĞU olan bloğun X/Y/W/H yerine gösterilen kontrolleri.
// `PropertyFactory`'nin zaten desteklediği `select`/`text` kontrol
// şemasıyla AYNI (yeni bir UI bileşeni icat edilmedi) — ContextPanel bunu
// `block.sizing` objesine bağlar. `fixedCross` SADECE cross:'fixed' iken
// gösterilir (ContextPanel'de koşullu filtrelenir).
export const SIZING_CONTROLS = [
  {
    key: 'primary',
    label: 'Ana eksen (akış yönü)',
    type: 'select',
    default: 'hug',
    options: [
      { value: 'hug', label: 'İçeriğe göre (hug)' },
      { value: 'fill', label: 'Kalanı doldur (fill)' },
      { value: 'fixed', label: 'Sabit (px)' },
    ],
  },
  {
    key: 'cross',
    label: 'Çapraz eksen',
    type: 'select',
    default: 'hug',
    options: [
      { value: 'hug', label: 'İçeriğe göre (hug)' },
      { value: 'fill', label: 'Kapla (fill)' },
      { value: 'fixed', label: 'Sabit (px)' },
    ],
  },
];

export const FIXED_CROSS_CONTROL = { key: 'fixedCross', label: 'Sabit boyut (px, çapraz)', type: 'text', default: '' };
export const FIXED_PRIMARY_CONTROL = { key: 'fixedPrimary', label: 'Sabit boyut (px, ana eksen)', type: 'text', default: '' };

// CONTAINER seçiliyken (kök ya da bir üst container'ın çocuğu fark etmez)
// gösterilen flow kontrolleri — `block.flow`'a bağlanır. Kullanıcı kararı:
// breakpoint'e göre DEĞİŞMEZ (bkz. tasarım dokümanı "Flow breakpoint"
// bölümü), bu yüzden tek bir kontrol seti yeterli.
export const FLOW_CONTROLS = [
  {
    key: 'direction',
    label: 'Yön',
    type: 'select',
    default: 'column',
    options: [
      { value: 'column', label: 'Dikey (column)' },
      { value: 'row', label: 'Yatay (row)' },
    ],
  },
  { key: 'gap', label: 'Boşluk (gap, px)', type: 'slider', min: 0, max: 64, step: 1, default: 12 },
  { key: 'padding', label: 'İç boşluk (padding, px)', type: 'slider', min: 0, max: 64, step: 1, default: 12 },
  {
    key: 'align',
    label: 'Çapraz hizalama (align-items)',
    type: 'select',
    default: 'stretch',
    options: [
      { value: 'stretch', label: 'Stretch' },
      { value: 'flex-start', label: 'Başlangıç' },
      { value: 'center', label: 'Ortala' },
      { value: 'flex-end', label: 'Son' },
    ],
  },
  {
    key: 'justify',
    label: 'Ana eksen hizalama (justify-content)',
    type: 'select',
    default: 'flex-start',
    options: [
      { value: 'flex-start', label: 'Başlangıç' },
      { value: 'center', label: 'Ortala' },
      { value: 'flex-end', label: 'Son' },
      { value: 'space-between', label: 'Aralarına yay (space-between)' },
    ],
  },
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

// DÜZELTME (kullanıcı raporu, 2026-09-02: "masaüstünde 46px yaptığım title
// mobilde de 46px oluyor, küçültemiyorum" / "page builder'ın mobil kısmı
// asla generate ettiğim gibi değil"). Kök neden: codegen (cssRules.js
// fontSizeValue) ham "Npx" fontSize'ı YAZILDIĞI bucket'ın kendi canvas
// genişliğine göre cqw'a çevirir — gerçek sitede metin GERÇEKTEN küçülür.
// Ama editördeki TextRenderer resolveEffectiveStyle'ın döndürdüğü ham
// px'i (hangi bucket'tan geldiğine bakmaksızın) OLDUĞU GİBİ basıyordu —
// breakpoint sekmesi 390px'lik (lg) tuvale geçse bile base'de yazılan
// 46px hâlâ 46px görünüyordu (gerçekte cqw ile ~13px'e karşılık gelirdi).
// Bu fonksiyon SADECE fontSize için AYNI kademeyi (base→aktif breakpoint,
// customCss son söz) izler ama değeri hangi bucket'tan geldiyse O
// bucket'ın canvas genişliğine göre editörün ŞU AN gösterdiği breakpoint'in
// canvas genişliğine ORANTILAR — sonuç, gerçek sitede o breakpoint'te
// görünecek boyutun editördeki BİREBİR karşılığıdır. customCss'ten gelen
// fontSize codegen'de de (customCssDeclarations) cqw dönüşümünden MUAF
// olduğu için burada da ölçeklenmeden aynen basılır.
function scalePxToCanvas(raw, sourceCanvasWidth, targetCanvasWidth) {
  const match = /^(-?[\d.]+)px$/.exec(String(raw).trim());
  if (!match || !sourceCanvasWidth || !targetCanvasWidth) return raw;
  const px = (parseFloat(match[1]) / sourceCanvasWidth) * targetCanvasWidth;
  return `${Math.round(px * 100) / 100}px`;
}

export function resolveEffectiveFontSize(block, breakpoint, mode, canvasWidths) {
  const matrix = block.styles ?? {};
  const base = matrix.base ?? { normal: {}, hover: {} };
  const active = breakpoint !== 'base' ? matrix[breakpoint] : null;
  const targetWidth = canvasWidths?.[breakpoint];

  let raw = base.normal?.fontSize;
  let sourceWidth = canvasWidths?.base;
  if (active?.normal?.fontSize != null) {
    raw = active.normal.fontSize;
    sourceWidth = targetWidth;
  }
  if (mode === 'hover') {
    if (active?.hover?.fontSize != null) {
      raw = active.hover.fontSize;
      sourceWidth = targetWidth;
    } else if (base.hover?.fontSize != null) {
      raw = base.hover.fontSize;
      sourceWidth = canvasWidths?.base;
    }
  }

  const customFontSize = parseCustomCss(block.customCss).fontSize;
  if (customFontSize != null) return customFontSize;
  if (raw == null) return undefined;
  return scalePxToCanvas(raw, sourceWidth, targetWidth);
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
