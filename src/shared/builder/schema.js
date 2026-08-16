// Universal Block Schema — Generic Builder çekirdek motorunun blok
// sözleşmesi. Bilinçli olarak SeriesHeroEditor'daki `type`/`x,y,width,height`
// ile BlogEditor'daki `blockType`/düz sabit alanlarla İSİM ÇAKIŞMASI
// YARATMAZ — ikisinden de bağımsız, temiz yeni bir sözleşme (motor hiçbir
// editöre bağımlı değil, editörler ileride buna göç eder).
//
// styles matrisi breakpoint (base/md/lg, mobile-first kademeli döşenim) ×
// pseudo-state (normal/hover) — CSS'in kendi kademesiyle aynı sırada iç
// içe (önce media query, içinde pseudo-class). createEmptyBlock sadece
// base.normal'ı doldurur, diğer hücreler boş kalır; okuma tarafı
// (render/PropertyFactory) base → md → lg ve normal → hover sırasıyla
// cascade/merge eder.
//
// layout AYNI breakpoint kademesini izler (2026-08, Faz 1.5) ama hover'ı
// YOK — pozisyon/boyutun hover durumu olmaz. { base: {x,y,w,h}, md, lg }
// — md/lg dokunulmamışsa `null` kalır ve base'in aynı yüzdelerini miras
// alır (bkz. PageBuilder.data.js resolveEffectiveLayout — resolveEffectiveStyle
// ile AYNI kademeli çözümleme deseni). Sadece dizilimi GERÇEKTEN değişmesi
// gereken block'larda o breakpoint'e geçilip elle yeniden konumlandırılır.
const DEFAULT_WIDTH = 30;

export function makeBlockId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `block-${Math.random().toString(36).slice(2)}`;
}

function emptyStyleMatrix() {
  return {
    base: { normal: {}, hover: {} },
    md: { normal: {}, hover: {} },
    lg: { normal: {}, hover: {} },
  };
}

// `definition` registry.js'teki getComponentDefinition() sonucu — kayıtlı
// olmayan bir componentType için de (registry boş/tanımsız) çalışır, motor
// registry'nin doluluğuna bağımlı değildir.
export function createEmptyBlock(componentType, position, definition) {
  const id = makeBlockId();
  const width = DEFAULT_WIDTH;

  return {
    id,
    componentType,
    layout: {
      base: {
        x: position ? Math.min(Math.max(position.x - width / 2, 0), 100 - width) : 10,
        y: position ? Math.max(position.y, 0) : 10,
        w: width,
        h: null,
      },
      md: null,
      lg: null,
    },
    content: definition?.defaultContent ? { ...definition.defaultContent } : {},
    // Doldurulduğunda { entityType, entityId, field } — PageBuilder Data
    // sekmesinin backend'e bağladığı block'larda kullanılır (bkz.
    // entitySchemas.js). Boş obje yerine null: DataTab/renderer'lar
    // `block.bindings` truthy kontrolüyle "bağlı mı" sorusunu cevaplar.
    bindings: null,
    styles: definition?.defaultStyles ? { ...emptyStyleMatrix(), base: { normal: { ...definition.defaultStyles }, hover: {} } } : emptyStyleMatrix(),
    animation: null,
    customCss: '',
    // Katman paneli (Lock/Hide) — additive, geriye dönük uyumlu. locked:
    // canvas'ta görünür ama seçilemez/sürüklenemez (pointer-events kapanır).
    // hidden: DOM'dan tamamen çıkar.
    locked: false,
    hidden: false,
  };
}

// Nokta-ayrılmış path ile context objesinden okur (örn. "series.posterUrl").
// Sadece resolver altyapısı — bir context şeması/binding-seçici UI'ı bu
// görevde YOK, gelecekteki editör migration'ında tanımlanacak.
export function resolveBinding(context, path) {
  if (!context || !path) return undefined;
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), context);
}

// resolveBinding'in tersi — path'teki değeri değiştirilmiş bir KOPYA döner
// (context mutasyona uğramaz, diğer alanlar aynı referansta kalır). Dizi
// index'leri de path segmenti olarak desteklenir ("blocks.8.imageUrl") —
// PageBuilder'ın bağlı-alan geri yazma (PUT) akışı, blog.blocks[]/
// episode.episodeBlocks[] gibi dinamik iç içe alanları düzenlemek için
// kullanır (bkz. entityWriteback.js).
export function applyBinding(context, path, value) {
  const [head, ...rest] = path.split('.');
  if (rest.length === 0) return { ...context, [head]: value };
  const child = context[head];
  if (Array.isArray(child) && /^\d+$/.test(rest[0])) {
    const index = Number(rest[0]);
    const nextChild = child.slice();
    nextChild[index] = applyBinding(child[index], rest.slice(1).join('.'), value);
    return { ...context, [head]: nextChild };
  }
  return { ...context, [head]: applyBinding(child, rest.slice(1).join('.'), value) };
}
