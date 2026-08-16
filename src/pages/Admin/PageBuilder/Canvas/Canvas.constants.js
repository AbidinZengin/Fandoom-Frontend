// Canvas.jsx'in TÜM alt-hook'ları ve JSX'i arasında paylaşılan sabitler —
// tek kaynak, dosya başına yeniden tanımlama yok.

// SeriesHeroEditor/BlockList.jsx'in kanıtlanmış sürükle/boyutlandır/snap
// mantığının bu sayfaya uyarlanmış hâli — alan adları (layout.x/y/w/h)
// ve store fonksiyonları (updateBlock/selectBlock) yeni motora göre
// değişti, snap/collision GEOMETRİSİ birebir aynı. Undo granülerliği
// artık store.js'teki debounced handleSet tarafından otomatik toplandığı
// için (bkz. store.js yorumu) burada BlockList.jsx'teki gibi ayrı bir
// "dragging" flag'i beklemeden her tick doğrudan updateBlock çağrılabilir.
export const SNAP_THRESHOLD_PX = 6;
export const DRAG_THRESHOLD_PX = 4;

// Tık-yerleştirmede (sürüklemeden) önizleme kutusunun görünür boyutu —
// schema.js'in DEFAULT_WIDTH'iyle (30) aynı genişlik, blok şeması bir
// yükseklik varsayımı taşımadığı (h:null → auto) için sadece GÖRSEL
// önizleme amaçlı burada sabit bir yükseklik seçildi.
export const DEFAULT_PREVIEW_WIDTH = 30;
export const DEFAULT_PREVIEW_HEIGHT = 12;

export const RESIZE_CURSOR = { n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize', ne: 'nesw-resize', sw: 'nesw-resize', nw: 'nwse-resize', se: 'nwse-resize' };
export const RESIZE_HANDLES = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

// Tuval genişliği VE yüksekliği artık SABİT değil (2026-08, Faz 1.5 + sonrası)
// — her breakpoint kendisini taşır (TopBar'da düzenlenebilir, bkz.
// PageBuilder.jsx canvasWidths/canvasHeights state'i), Canvas prop olarak
// alır. Sığdırma hesabı (fitToView) sadece genişliğe göre zoom belirler —
// yükseklik taşarsa dikey scroll/pan ile gezilir, zoom'u etkilemez.
export const DEFAULT_CANVAS_WIDTHS = { base: 1360, md: 768, lg: 390 };
export const DEFAULT_CANVAS_HEIGHTS = { base: 800, md: 800, lg: 800 };
export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 4;
export const FIT_PADDING = 48;

export const EMPTY_SELECTION = new Set();
