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
//
// Nested/auto-layout bloklar (2026-08-18, bkz.
// docs/plans/2026-08-18-pagebuilder-nested-blocks-design.md): her blok artık
// `parentId` taşır (null = sayfa/container kökünde, flat map + pointer
// deseni — gerçek bir ağaç yapısına GEÇİLMEDİ, `blocks[id]` lookup'ları
// bozulmasın diye). CONTAINER tipi ayrıca `childOrder` (kendi `blockOrder`
// karşılığı) ve `flow` (direction/gap/padding/align/justify) taşır — `h`
// HER ZAMAN null kalır, container her zaman içeriğini sarar. Her blok
// (CONTAINER dahil, iç içe container'a girebilir) bir container'a
// GİRERSE anlam kazanan `sizing` (primary/cross eksen) ve `fixedCross`
// (px, sadece cross:'fixed' iken) alanlarını da baştan taşır — parentId
// null iken bu alanlar kullanılmaz, koşullu eklemek yerine hep var olması
// (ör. cssRules.js'te `block.sizing ?? default` gibi dağınık fallback'ler
// yerine) daha basit.
export function createEmptyBlock(componentType, position, definition) {
  const id = makeBlockId();
  const width = componentType === 'CONTAINER' ? 60 : DEFAULT_WIDTH;

  const block = {
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
    parentId: null,
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
    sizing: { primary: 'hug', cross: 'hug' },
    fixedCross: null,
    // Ana eksende de 'fixed' olabilir (px) — bkz. groupBlocksIntoContainer/
    // reparentBlock: VAR OLAN bir blok container'a girerken kullanıcı
    // kararı gereği (2026-08-19: "container a koyunca hiçbir boyutu/
    // layoutu değişmemeli") o anki piksel boyutu buraya donuyor, container
    // flex akışı görünümü DEĞİŞTİRMEZ. Sadece primary:'fixed' iken okunur.
    fixedPrimary: null,
    // Layers panelinde kullanıcının verdiği serbest ad (Figma'daki katman
    // yeniden adlandırması) — null iken panel `componentType`'a düşer,
    // codegen/render bu alanı OKUMAZ (sadece UI etiketi).
    name: null,
  };

  if (componentType === 'CONTAINER') {
    block.layout.base.h = null;
    block.childOrder = [];
    block.flow = { direction: 'column', gap: 12, padding: 12, align: 'stretch', justify: 'flex-start' };
  }

  return block;
}

// Bir CONTAINER'ın flow.direction'ına göre çocuğun mevcut piksel boyutunu
// (pxSize: {w,h}) sizing:{primary:'fixed',cross:'fixed'} + fixedPrimary/
// fixedCross'a çevirir — kullanıcı kararı (2026-08-19): VAR OLAN bir blok
// container'a girerken görünümü/boyutu HİÇ değişmemeli, container'ın flex
// akışı ona dokunmasın. `pxSize` yoksa (yeni/taze blok, önceki bir "hâli"
// olmayan) hiçbir şey değişmez — createEmptyBlock'un hug/hug varsayılanı
// kalır (bilinçli fark: taze bloklar akıllı varsayılanı hak eder, VAR OLAN
// bir bloğun görünümünü kimse sormadan değiştirmemeliyiz).
function applyPreservedPxSize(block, direction, pxSize) {
  if (!pxSize) return block;
  return {
    ...block,
    sizing: { primary: 'fixed', cross: 'fixed' },
    fixedPrimary: direction === 'row' ? pxSize.w : pxSize.h,
    fixedCross: direction === 'row' ? pxSize.h : pxSize.w,
  };
}

// Seçili blokları (AYNI ebeveyne sahip olmaları şart — çağıran taraf
// garanti eder) yeni bir CONTAINER'a sarar. `parentOrder`: taşınan
// bloğun bulunduğu kapsayıcının sıra dizisi — köktekiler için `blockOrder`,
// bir container içindekiler için o container'ın `childOrder`'ı. Container
// bounding box'ı seçili blokların `layout.base` değerlerinden hesaplanır
// (md/lg çözümlemesine gerek yok — base her zaman somut). `pxSizes`
// (opsiyonel, {[id]: {w,h}} piksel) verilirse her çocuğun GÖRÜNÜMÜ
// donar (bkz. applyPreservedPxSize) — çağıran taraf (Canvas.jsx) DOM'dan
// okuyup geçirir, bu fonksiyon DOM'a dokunmaz (saf kalır). Saf fonksiyon:
// yeni `blocksById`/sıra dizisini DÖNER, store'u kendisi mutasyona uğratmaz
// (zustand/immer entegrasyonu çağıran tarafın işi, bkz. store.js).
export function groupBlocksIntoContainer(blocksById, parentOrder, selectedIds, pxSizes) {
  const selectedSet = new Set(selectedIds);
  const selected = parentOrder.filter((id) => selectedSet.has(id)).map((id) => blocksById[id]).filter(Boolean);
  if (selected.length < 2) return null;

  const parentId = selected[0].parentId ?? null;
  const boxes = selected.map((b) => b.layout.base);
  const minX = Math.min(...boxes.map((box) => box.x));
  const minY = Math.min(...boxes.map((box) => box.y));
  const maxX = Math.max(...boxes.map((box) => box.x + box.w));

  const container = createEmptyBlock('CONTAINER', null, null);
  container.parentId = parentId;
  container.layout.base = { x: minX, y: minY, w: Math.min(maxX - minX, 100 - minX), h: null };
  container.childOrder = selected
    .slice()
    .sort((a, b) => a.layout.base.y - b.layout.base.y)
    .map((b) => b.id);

  const nextBlocksById = { ...blocksById, [container.id]: container };
  for (const b of selected) {
    nextBlocksById[b.id] = applyPreservedPxSize({ ...b, parentId: container.id }, container.flow.direction, pxSizes?.[b.id]);
  }

  const firstIndex = parentOrder.findIndex((id) => selectedSet.has(id));
  const nextParentOrder = [
    ...parentOrder.slice(0, firstIndex).filter((id) => !selectedSet.has(id)),
    container.id,
    ...parentOrder.slice(firstIndex).filter((id) => !selectedSet.has(id)),
  ];

  return { blocksById: nextBlocksById, parentOrder: nextParentOrder, containerId: container.id };
}

// Tek bir bloğu (alt-ağacıyla birlikte, çocukları taşımıyoruz — sadece
// bloğun kendisi) başka bir yere taşır: yeni bir ebeveyne (CONTAINER,
// `newParentId`) ya da köke (`newParentId: null`). Layers panelindeki
// sürükle-bırak nested gruplama BUNU çağırır — `groupBlocksIntoContainer`
// YENİ bir container YARATIR, bu fonksiyon VAR OLAN bir container'a (ya da
// köke) taşır, ikisi TAMAMLAYICI. `insertIndex` hedef sıradaki (yeni
// ebeveynin childOrder'ı ya da kökün blockOrder'ı) konum — null ise sona
// eklenir. Kendi alt-ağacına taşınmaya çalışılırsa (döngü) null döner.
// `pxSize` (opsiyonel, {w,h} piksel — sadece newParentId set'se, yani
// bir CONTAINER'a girerken anlamlı): verilirse bloğun görünümü donar
// (bkz. applyPreservedPxSize, kullanıcı kararı 2026-08-19). Köke
// çıkarken (newParentId:null) YOKSAYıLıR — kök blok zaten kendi x/y/w/h'sini
// taşımaya devam eder, fixed/fixed'e gerek yok.
export function reparentBlock(blocksById, rootOrder, blockId, newParentId, insertIndex, pxSize) {
  const block = blocksById[blockId];
  if (!block || blockId === newParentId) return null;
  if (newParentId && isDescendant(blocksById, newParentId, blockId)) return null;

  const oldParentId = block.parentId ?? null;
  const nextBlocksById = { ...blocksById };
  let nextRootOrder = rootOrder;

  if (oldParentId) {
    const oldParent = nextBlocksById[oldParentId];
    nextBlocksById[oldParentId] = { ...oldParent, childOrder: (oldParent.childOrder ?? []).filter((id) => id !== blockId) };
  } else {
    nextRootOrder = rootOrder.filter((id) => id !== blockId);
  }

  nextBlocksById[blockId] = { ...block, parentId: newParentId };
  if (newParentId && pxSize) {
    const direction = nextBlocksById[newParentId]?.flow?.direction ?? 'column';
    nextBlocksById[blockId] = applyPreservedPxSize(nextBlocksById[blockId], direction, pxSize);
  }

  if (newParentId) {
    const newParent = nextBlocksById[newParentId];
    const childOrder = newParent.childOrder ?? [];
    const idx = insertIndex == null ? childOrder.length : Math.min(Math.max(insertIndex, 0), childOrder.length);
    nextBlocksById[newParentId] = { ...newParent, childOrder: [...childOrder.slice(0, idx), blockId, ...childOrder.slice(idx)] };
  } else {
    const idx = insertIndex == null ? nextRootOrder.length : Math.min(Math.max(insertIndex, 0), nextRootOrder.length);
    nextRootOrder = [...nextRootOrder.slice(0, idx), blockId, ...nextRootOrder.slice(idx)];
  }

  return { blocksById: nextBlocksById, rootOrder: nextRootOrder };
}

function isDescendant(blocksById, candidateId, ancestorId) {
  let current = blocksById[candidateId];
  while (current?.parentId) {
    if (current.parentId === ancestorId) return true;
    current = blocksById[current.parentId];
  }
  return false;
}

// groupBlocksIntoContainer'ın tersi — container'ı çözer, çocuklarını
// KENDİ ebeveynine (container'ın parentId'sine — köke ya da bir üst
// container'a) geri taşır, container silinir (cascade DEĞİL — çocuklar
// yaşamaya devam eder, sadece bir seviye yukarı çıkar). Kök seviyeye
// çıkan çocuklar için `layout.base.x/y` container'ın son konumundan
// (dikey ofsetle) yeniden hesaplanır; bir container'ın içine çıkıyorsa
// x/y zaten okunmuyor (sizing flow'dan geliyor), dokunulmaz.
export function ungroupContainer(blocksById, parentOrder, containerId) {
  const container = blocksById[containerId];
  if (!container || container.componentType !== 'CONTAINER') return null;

  const childIds = container.childOrder ?? [];
  const targetParentId = container.parentId ?? null;
  const containerBase = container.layout.base;

  const nextBlocksById = { ...blocksById };
  delete nextBlocksById[containerId];
  childIds.forEach((id, i) => {
    const child = nextBlocksById[id];
    if (!child) return;
    nextBlocksById[id] = {
      ...child,
      parentId: targetParentId,
      layout: targetParentId
        ? child.layout
        : { ...child.layout, base: { ...child.layout.base, x: containerBase.x, y: containerBase.y + i * 10 } },
    };
  });

  const index = parentOrder.indexOf(containerId);
  const nextParentOrder = index === -1 ? parentOrder : [...parentOrder.slice(0, index), ...childIds, ...parentOrder.slice(index + 1)];

  return { blocksById: nextBlocksById, parentOrder: nextParentOrder };
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
