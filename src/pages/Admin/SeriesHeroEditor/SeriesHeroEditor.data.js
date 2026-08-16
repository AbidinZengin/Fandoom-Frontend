import { fetchBlocks, saveBlocks } from '../../../shared/api/designServer';
import { ANIMATION_PRESETS } from '../../series/BreakingBad/Hero/heroBlockRenderers';

// Mimari pivot (2026-08, plan: lively-zooming-river.md) — backend/DB
// kaldırıldı, bloklar component'in yanındaki *.blocks.json dosyasına
// local design-server üzerinden yazılır. "Series Hero" ilk somut slot;
// yeni bir slot eklendiğinde bu map'e bir satır eklenir (backend şeması
// DEĞİŞMEZ çünkü zaten yok).
const SLOT_FILES = {
  'series-hero:5': 'src/pages/series/BreakingBad/Hero/Hero.blocks.json',
};

function resolveBlocksPath(seriesId) {
  const path = SLOT_FILES[`series-hero:${seriesId}`];
  if (!path) throw new Error(`Bu series id (${seriesId}) için tanımlı bir Hero slotu yok.`);
  return path;
}

export const BLOCK_TYPES = ['IMAGE', 'LOGO', 'TITLE', 'META', 'SYNOPSIS', 'BUTTON', 'BOX'];

export const BLOCK_TYPE_LABELS = {
  IMAGE: 'Image',
  LOGO: 'Logo',
  TITLE: 'Title',
  META: 'Meta',
  SYNOPSIS: 'Synopsis',
  BUTTON: 'Button (Trailer)',
  // "Text Box" DEĞİL — metin isteğe bağlı (boş bırakılırsa gerçek sayfada
  // hiç render edilmez, bkz. heroBlockRenderers.jsx BoxBlockRenderer).
  // Radius'tan Circle/Pill seçilip metin boş bırakılırsa saf bir geometrik
  // şekil olarak kullanılır — kullanıcı isteği: "şekiller de olsun".
  BOX: 'Shape',
};

// META BİLEREK dışarıda — kullanıcı kararı: "genre ve meta kısmı aynı
// kalacak", gerçek Series verisinden (yıl/sezon/tür) otomatik kompoze
// edilir, elle yazılmaz. Diğer tüm metin taşıyan tipler serbestçe
// yazılabilir (kullanıcı kararı: "excalidraw tarzı hızlı prototip").
export const EDITABLE_TEXT_TYPES = new Set(['TITLE', 'SYNOPSIS', 'BUTTON', 'BOX']);
export const RADIUS_TYPES = new Set(['IMAGE', 'BUTTON', 'BOX']);

// Kullanıcı isteği: "var olan css özelliklerinin hepsini seçilebilir...
// yap amaç abstractlaşmak" — sağ-tık menüsü artık PropertiesPanel'in
// sabit kontrollerinin (radius/blur/font/background) DIŞINDA kalan geniş
// bir CSS özellik kütüphanesi sunar (kategori bazlı). Hâlâ TÜM CSS
// evrenini tek tek saymıyoruz (o, "excalidraw gibi basit" hedefiyle
// çelişir) — listede olmayan herhangi bir özellik için PropertyMenu'nün
// "Custom…" alanı zaten tam kaçış kapısı, dolayısıyla pratikte gerçekten
// HERHANGİ bir CSS özelliği eklenebilir. Değer her zaman düz metin
// (Custom CSS ile aynı güvenlik gerekçesi — statik veri, kod çalıştırmaz);
// PropertiesPanel bu anahtarlar için otomatik bir input satırı üretir.
export const EXTRA_STYLE_PROPERTIES = [
  // Görünürlük / katman
  { key: 'opacity', label: 'Opacity' },
  { key: 'zIndex', label: 'Z-index' },
  { key: 'overflow', label: 'Overflow' },
  { key: 'pointerEvents', label: 'Pointer events' },
  { key: 'cursor', label: 'Cursor' },
  // Tipografi
  { key: 'letterSpacing', label: 'Letter spacing' },
  { key: 'lineHeight', label: 'Line height' },
  { key: 'textAlign', label: 'Text align' },
  { key: 'textTransform', label: 'Text transform' },
  { key: 'textDecoration', label: 'Text decoration' },
  { key: 'fontWeight', label: 'Font weight' },
  { key: 'fontStyle', label: 'Font style' },
  { key: 'whiteSpace', label: 'White space' },
  { key: 'wordSpacing', label: 'Word spacing' },
  { key: 'textShadow', label: 'Text shadow' },
  { key: 'color', label: 'Text color' },
  // Kutu / çerçeve
  { key: 'border', label: 'Border' },
  { key: 'borderWidth', label: 'Border width' },
  { key: 'borderColor', label: 'Border color' },
  { key: 'borderStyle', label: 'Border style' },
  { key: 'outline', label: 'Outline' },
  { key: 'padding', label: 'Padding' },
  { key: 'margin', label: 'Margin' },
  { key: 'aspectRatio', label: 'Aspect ratio' },
  // Efekt
  { key: 'boxShadow', label: 'Box shadow' },
  { key: 'backdropFilter', label: 'Backdrop blur' },
  { key: 'mixBlendMode', label: 'Blend mode' },
  { key: 'clipPath', label: 'Clip path' },
  // Dönüşüm / geçiş
  { key: 'transform', label: 'Transform' },
  { key: 'transformOrigin', label: 'Transform origin' },
  { key: 'transition', label: 'Transition' },
  // Yerleşim
  { key: 'display', label: 'Display' },
  { key: 'justifyContent', label: 'Justify content' },
  { key: 'alignItems', label: 'Align items' },
  { key: 'gap', label: 'Gap' },
];

// Zaten kendi özel kontrolü olan alanlar — PropertiesPanel'in "Extra
// properties" bölümü bunları TEKRAR listelemez (çakışma olmasın diye).
export const FIXED_STYLE_KEYS = new Set(['filter', 'borderRadius', 'background', 'fontFamily', 'fontSize']);

// Kullanıcı düzeltmesi: "neden bir tane" — projede ZATEN var olan font
// listesi kullanılır (BlogEditor'ün FONT_OPTIONS'ıyla aynı üç marka fontu:
// GoT/Fraunces/Montserrat, bkz. learned-rules "Fandoom marka fontu
// Montserrat KALIR") + Breaking Bad'e özel Cooper BT. Değer doğrudan CSS
// font-family string'i, styles.fontFamily'ye yazılır. 'Default' boş
// bırakır — miras kalan --font-body (Montserrat) geçerli olur.
export const FONT_OPTIONS = [
  { value: '', label: 'Default' },
  { value: "'Montserrat', sans-serif", label: 'Montserrat' },
  { value: "'Game of Thrones', 'Cinzel', serif", label: 'Game of Thrones' },
  { value: "'Fraunces', serif", label: 'Fraunces' },
  { value: "'Cooper BT', serif", label: 'Cooper BT' },
];

// KRİTİK — kullanıcı düzeltmesi: "var olan CSS kütüphanelerini
// kullanmalıydım" — bunlar kendi icat ettiğim px değerleri DEĞİL,
// projenin TEK gerçek kaynağı theme.css'teki --radius-* token'larının
// doğrudan referansı. theme.css'te değer değişirse buradaki seçenekler
// de otomatik güncel kalır (learned-rules: "hardcode etme, skalaya bak").
export const BORDER_RADIUS_OPTIONS = [
  { value: 'var(--radius-sm)', label: 'Small' },
  { value: 'var(--radius-md)', label: 'Medium' },
  { value: 'var(--radius-lg)', label: 'Large' },
  { value: 'var(--radius-pill)', label: 'Pill' },
  // 50% tasarım skalası değeri değil, saf geometri (kare/dikdörtgeni
  // daireye çeviren CSS sabiti) — theme.css --radius-* token'larıyla
  // aynı kategoride değil, o yüzden istisna değil.
  { value: '50%', label: 'Circle' },
];

// Aynı gerekçe — theme.css'teki --text-* tipografi skalasının doğrudan
// referansı, keyfi px/em değerleri değil.
export const FONT_SIZE_OPTIONS = [
  { value: '', label: 'Default' },
  { value: 'var(--text-xs)', label: 'XS' },
  { value: 'var(--text-sm)', label: 'Small' },
  { value: 'var(--text-base)', label: 'Base' },
  { value: 'var(--text-md)', label: 'Medium' },
  { value: 'var(--text-lg)', label: 'Large' },
  { value: 'var(--text-h2)', label: 'H2' },
  { value: 'var(--text-h1)', label: 'H1' },
];

// Watch Trailer butonunun kendi blur değeriyle (Hero.module.css:
// blur(20px)) AYNI — yeni IMAGE bloğu bu değerle başlar, admin serbestçe
// değiştirebilir (styles.filter serbest CSS string'i).
export const DEFAULT_BLUR_PX = 20;

export function makeBlockId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `block-${Math.random().toString(36).slice(2)}`;
}

export function createEmptyBlock(type, position) {
  const isEditableText = EDITABLE_TEXT_TYPES.has(type);
  const hasRadius = RADIUS_TYPES.has(type);
  const width = type === 'IMAGE' ? 60 : type === 'LOGO' ? 24 : 30;
  const id = makeBlockId();

  const content = {};
  if (type === 'IMAGE' || type === 'LOGO') content.imageUrl = null;
  // Kullanıcı kararı: "tr eng farkını kaldır, ben kendim doldururum" —
  // tek serbest metin alanı, dil ayrımı editörde yok.
  if (isEditableText) content.text = '';

  const styles = {};
  if (type === 'IMAGE') styles.filter = `blur(${DEFAULT_BLUR_PX}px)`;
  if (hasRadius) styles.borderRadius = type === 'BUTTON' ? 'var(--radius-pill)' : 'var(--radius-md)';
  if (type === 'BOX') styles.background = '#000000';

  return {
    id,
    _key: id, // BlockList.jsx/AddBlockBar.jsx bu alanı okur — id ile aynı, ayrı bir kavram değil
    orderIndex: 0,
    type,
    x: position ? Math.min(Math.max(position.x - width / 2, 0), 100 - width) : 10,
    y: position ? Math.max(position.y, 0) : 10,
    width,
    height: type === 'IMAGE' ? 40 : null,
    content,
    styles,
    animation:
      type === 'IMAGE' || type === 'META'
        ? null
        : { preset: 'fadeUpStagger', params: { duration: 0.9, delay: 0 } },
    customCss: '',
  };
}

export function emptyDraft() {
  return { heroBlocks: [] };
}

// design-server'dan gelen dizi ZATEN düzenlenebilir şekle çok yakın —
// backend'in ayrı bir Request/Response şekli yok (dosya = tek gerçek
// kaynak), sadece _key (editörün React key'i) eklenir.
export function toEditableState(list) {
  const sorted = (list ?? []).slice().sort((a, b) => a.orderIndex - b.orderIndex);
  return {
    heroBlocks: sorted.map((block) => ({ ...block, _key: block.id })),
  };
}

export function toSaveableBlocks(draft) {
  return draft.heroBlocks.map(({ _key, ...block }, index) => ({ ...block, orderIndex: index }));
}

export async function loadSeriesHeroForEdit(seriesId) {
  const list = await fetchBlocks(resolveBlocksPath(seriesId));
  return toEditableState(list);
}

export async function saveSeriesHeroDraft(seriesId, draft) {
  return saveBlocks(resolveBlocksPath(seriesId), toSaveableBlocks(draft));
}

export { ANIMATION_PRESETS };
