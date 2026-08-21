import { create } from 'zustand';
import { createEmptyBlock } from './schema';

const STORAGE_KEY = 'fandoom.pageBuilder.blockLibrary';

// PageBuilder'ın "Kütüphaneye ekle" özelliği — kullanıcının canvas'ta
// hazırladığı bir bloğu (TEK blok YA DA bir CONTAINER'ın TÜM alt-ağacı)
// kaydedip başka bir sayfada/oturumda tekrar yerleştirebilmesi.
// localStorage'da tutulur (kullanıcı kararı, 2026-08-19): backend'de
// karşılık gelen bir CRUD endpoint'i yok, bu yüzden SADECE bu tarayıcıda
// kalıcı — cihaz/kullanıcı arası paylaşılmaz (bu sınır kabul edilerek
// seçildi, backend endpoint'i ayrı bir görev).
//
// Düz bir blok PRESET_VARIANTS'la (PageBuilder.data.js) AYNI şekli taşır
// — {componentType, content, styles: TEK düz obje} — usePlacement.js'in
// activePreset akışı ikisini ayırt etmeden tüketir. Bir CONTAINER kaydı
// ayrıca `flow` ve `children[]` taşır (kullanıcı kararı, 2026-08-19:
// "container kütüphanesi daha mantıklı" — tek başına boş bir container
// değil, İÇİNDEKİ TÜM alt-ağaç kaydedilip geri yerleştirilebilmeli).
// Sadece base/normal stil bucket'ı kaydedilir — breakpoint/hover
// override'ları PRESET_VARIANTS'ta da desteklenmiyor, aynı sınırlama.
function readFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeToStorage(entries) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // localStorage dolu/erişilemez olabilir (gizli sekme vb.) — sessizce
    // yok say, kütüphane bu durumda sadece o oturum boyunca bellekte kalır.
  }
}

// Bir bloğun taşınabilir, id'siz "gövde"si — CONTAINER'sa `childOrder`'ını
// recursive olarak `children[]`'a çevirir (sınırsız derinlik, nested
// container'lar dahil — bkz. docs/plans/2026-08-18-pagebuilder-nested-blocks-design.md
// "Nesting derinliği" kararı). `children[]`'daki her giriş KENDİ
// sizing/fixedCross'unu (o ÇOCUĞUN kendi ebeveynine göre davranışı) taşır
// — kaydedilen bloğun KENDİSİNİNKİ taşınmaz (yeniden yerleştirildiğinde bir
// container'ın içine sürüklenirse zaten hug/hug varsayılanıyla başlar,
// düz blok yerleştirmeyle AYNI davranış). locked/hidden/bindings bilinçli
// olarak taşınmaz — kütüphaneden gelen bir blok her zaman "temiz" doğar.
function snapshotBody(block, blocksById) {
  const body = {
    componentType: block.componentType,
    content: structuredClone(block.content ?? {}),
    styles: structuredClone(block.styles?.base?.normal ?? {}),
    customCss: block.customCss ?? '',
  };
  if (block.componentType === 'CONTAINER') {
    body.flow = structuredClone(block.flow ?? {});
    body.children = (block.childOrder ?? [])
      .map((id) => blocksById[id])
      .filter(Boolean)
      .map((child) => ({
        ...snapshotBody(child, blocksById),
        sizing: structuredClone(child.sizing ?? { primary: 'hug', cross: 'hug' }),
        fixedCross: child.fixedCross ?? null,
      }));
  }
  return body;
}

// snapshotBody'nin tersi — bir gövdeyi (kütüphane entry'sinin kendisi ya da
// onun `children[]` içindeki bir alt-gövde) TAZE id'lerle gerçek blok(lar)a
// çevirir. Dönüş [kök, ...tüm-alt-ağaç] DÜZ dizisidir (store'un
// addBlockTree'si bunu bekler — CONTAINER çocukları blockOrder'a DEĞİL,
// kendi ebeveyninin childOrder'ına girer, o bağ burada `block.childOrder`
// üzerinden zaten kurulu gelir). Kökün layout'u ÇAĞIRAN tarafından
// (usePlacement.js'in çizilen dikdörtgeninden) sonradan patch'lenir,
// `position` sadece createEmptyBlock'un ilk (sonra ezilecek) tahmini için.
function instantiateBody(body, parentId, position) {
  const definition = { defaultContent: body.content, defaultStyles: body.styles };
  const block = createEmptyBlock(body.componentType, position, definition);
  block.parentId = parentId;
  if (body.customCss) block.customCss = body.customCss;

  const descendants = [];
  if (body.componentType === 'CONTAINER') {
    block.flow = structuredClone(body.flow ?? block.flow);
    block.childOrder = (body.children ?? []).map((childBody) => {
      const [childBlock, childDescendants] = instantiateBody(childBody, block.id, null);
      childBlock.sizing = structuredClone(childBody.sizing ?? { primary: 'hug', cross: 'hug' });
      childBlock.fixedCross = childBody.fixedCross ?? null;
      descendants.push(childBlock, ...childDescendants);
      return childBlock.id;
    });
  }
  return [block, descendants];
}

// Kütüphane entry'sini (kök + varsa tüm alt-ağaç) tuvale eklenecek düz bir
// blok dizisine çevirir: [kök, ...alt-ağaç]. usePlacement.js kökün
// layout.base'ini çizilen dikdörtgenle ezdikten sonra store'un
// addBlockTree'sine geçirir.
export function instantiateLibraryEntry(entry, position) {
  const [root, descendants] = instantiateBody(entry, null, position);
  return [root, ...descendants];
}

let nextId = 1;

export const useBlockLibraryStore = create((set) => ({
  entries: readFromStorage(),

  saveBlock: (block, blocksById, name) => {
    const entry = {
      id: `lib-${Date.now()}-${nextId++}`,
      name: name || block.componentType,
      savedAt: Date.now(),
      ...snapshotBody(block, blocksById),
    };
    set((state) => {
      const entries = [entry, ...state.entries];
      writeToStorage(entries);
      return { entries };
    });
    return entry;
  },

  renameBlock: (id, name) =>
    set((state) => {
      const entries = state.entries.map((e) => (e.id === id ? { ...e, name } : e));
      writeToStorage(entries);
      return { entries };
    }),

  removeBlock: (id) =>
    set((state) => {
      const entries = state.entries.filter((e) => e.id !== id);
      writeToStorage(entries);
      return { entries };
    }),
}));
