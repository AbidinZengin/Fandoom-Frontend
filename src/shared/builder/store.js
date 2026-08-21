import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { temporal } from 'zundo';
import { makeBlockId, reparentBlock as reparentBlockPure, groupBlocksIntoContainer as groupBlocksIntoContainerPure, ungroupContainer as ungroupContainerPure } from './schema';

// Bir CONTAINER'ın TÜM alt-ağacının id'lerini toplar (recursive) —
// removeBlock'un cascade silmesi için. `blocks` immer draft'ı ya da düz
// obje olabilir, ikisi de aynı okuma arayüzünü sağlar.
function collectDescendantIds(blocks, id) {
  const block = blocks[id];
  if (!block || !block.childOrder) return [];
  return block.childOrder.flatMap((childId) => [childId, ...collectDescendantIds(blocks, childId)]);
}

// saveToAdapter VE publishBuild'in PAYLAŞTIĞI serileştirme: blockOrder
// sadece kök blokları listeler — container çocukları da kaybolmadan
// kaydedilsin diye `blocks` map'inin TÜMÜ yazılır (önce kök sırası, sonra
// kalan çocuk bloklar eklenme sırasıyla).
function serializeBlocks(blocks, blockOrder) {
  const rootIds = new Set(blockOrder);
  return [...blockOrder.map((id) => blocks[id]), ...Object.values(blocks).filter((b) => !rootIds.has(b.id))];
}

// Hızlı ardışık değişiklikleri (yazarken her tuş vuruşu, slider/sürükleme
// her tick'i) TEK undo kaydına toplar — zundo'nun kendi resmi önerdiği
// "Cool-off period" deseni (README: handleSet + debounce/throttle).
// pause()/resume() bunun YERİNE geçmez (bkz. beginGesture/commitGesture
// yorumu) — o ayrı, daha KESKİN bir bastırma aracı; bu ise VARSAYILAN,
// her yazma/sürükleme etkileşiminde otomatik devrede olan güvenlik ağı.
// 600ms değeri projenin kendi `BlogEditor/useHistory.js`'indeki KANITLANMIŞ
// auto-seal debounce süresiyle birebir aynı — yeni bir değer icat edilmedi.
const HISTORY_DEBOUNCE_MS = 600;

// KRİTİK — manuel testte yakalanan çökme kökeni: bu debounce penceresi
// (600ms) açıkken kullanıcı Undo/Redo'ya basarsa, zamanlayıcı GEÇ ateşlenip
// pastStates'e BAYAT bir kayıt ekleyip futureStates'i sıfırlıyor — undo/redo
// yığınını undo/redo'nun kendi anlık müdahalesiyle çakışacak şekilde
// bozuyor. Bozulan yığında bir slot zustand'ın kendi setState'inin
// `undefined` partial'ı REPLACE sanma tuhaflığıyla birleşince tüm store
// state'i `undefined` oluyor → "<PageBuilder>" render'ı çöküyor (React
// kökü unmount edip siyah ekran bırakıyor). Çözüm: Undo/Redo çağrılmadan
// HEMEN önce bekleyen debounce'u İPTAL et (geç ateşlemesin) — cancel()
// bunun için dışa açılıyor, kullanımı aşağıda `undo`/`redo` yardımcılarında.
function createDebouncedHandleSet(wait) {
  let timer = null;
  let firstPastState;
  const factory = (handleSet) => (pastState, replace, currentState, deltaState) => {
    if (timer === null) firstPastState = pastState;
    clearTimeout(timer);
    timer = setTimeout(() => {
      handleSet(firstPastState, replace, currentState, deltaState);
      timer = null;
    }, wait);
  };
  factory.cancel = () => {
    clearTimeout(timer);
    timer = null;
  };
  return factory;
}

// createBuilderStore FACTORY'dir, global singleton DEĞİL — motoru kullanan
// her editör kendi store instance'ını açar (SeriesHeroEditor'ün her mount'ta
// kendi useHistory'sini açması gibi). Normalize state: {[id]: Block} dict +
// sıralı blockOrder dizisi — tekil blok güncellemesi immer ile O(1) mutasyon
// olur, dizi taraması gerekmez.
//
// partialize sadece {blocks, blockOrder}'ı history'ye alır — selectedId/
// loading/saving gibi UI-only state undo'ya karışmaz.
export function createBuilderStore(adapter) {
  // React 19 StrictMode dev'de mount effect'ini iki kez tetikler —
  // loadFromAdapter() üst üste iki kez çağrılırsa iki pause()/resume()
  // penceresi çakışır (ikinci çağrının set()'i ilkinin resume()'undan SONRA
  // gelip yanlışlıkla history'ye girebilir — manuel testte yakalandı). Aynı
  // anda tek yükleme in-flight olsun diye promise burada saklanır.
  let loadPromise = null;
  const debouncedHandleSet = createDebouncedHandleSet(HISTORY_DEBOUNCE_MS);

  const store = create(
    temporal(
      immer((set, get, api) => ({
        blocks: {},
        blockOrder: [],
        selectedId: null,
        loading: false,
        saving: false,
        error: null,
        // "Yayınla" ile oluşan build geçmişi — mevcut Kaydet/taslak akışından
        // BAĞIMSIZ (bkz. adapter.publish), bu yüzden zundo'nun partialize'ına
        // (blocks/blockOrder) DAHİL DEĞİL: bir build'i geri yüklemek TEK bir
        // updateBlock gibi normal bir undo adımı sayılır, builds listesinin
        // kendisi undo/redo'ya karışmaz.
        builds: [],
        loadingBuilds: false,

        // Yükleme (boş bile olsa) blocks/blockOrder'ı YENİDEN ATAR — bu her
        // seferinde yeni referans üretir, equality kontrolü bunu "gerçek
        // değişiklik" sayar. Ama bu bir KULLANICI eylemi değil, sayfanın
        // taban durumunu kurmak — Undo'nun kullanıcıyı "yüklenmeden önceki
        // boş sayfa"ya götürmesi anlamsız/tehlikeli olurdu. pause()/resume()
        // ile SARILARAK (dış çağırana bir şey hatırlatmaya gerek kalmadan)
        // bu iki set() çağrısı tamamen history dışı bırakılıyor.
        loadFromAdapter: () => {
          if (loadPromise) return loadPromise;
          loadPromise = (async () => {
            api.temporal.getState().pause();
            set((draft) => {
              draft.loading = true;
              draft.error = null;
            });
            try {
              const data = await adapter.load();
              set((draft) => {
                draft.blocks = {};
                draft.blockOrder = [];
                draft.selectedId = null;
                // blockOrder SADECE kök seviye (parentId yok) bloklar —
                // CONTAINER çocukları kendi ebeveyninin childOrder'ında
                // yaşar, blockOrder'a girerse hem düz sayfada tekrar
                // render edilir hem codegen'de yinelenir (bkz.
                // docs/plans/2026-08-18-pagebuilder-nested-blocks-design.md).
                (data ?? []).forEach((block) => {
                  draft.blocks[block.id] = block;
                  if (!block.parentId) draft.blockOrder.push(block.id);
                });
                draft.loading = false;
              });
            } catch (err) {
              set((draft) => {
                draft.loading = false;
                draft.error = err;
              });
              api.temporal.getState().resume();
              loadPromise = null;
              throw err;
            }
            api.temporal.getState().resume();
            loadPromise = null;
          })();
          return loadPromise;
        },

        saveToAdapter: async () => {
          const { blocks, blockOrder } = get();
          set((draft) => {
            draft.saving = true;
            draft.error = null;
          });
          try {
            await adapter.save(serializeBlocks(blocks, blockOrder));
            set((draft) => {
              draft.saving = false;
            });
          } catch (err) {
            set((draft) => {
              draft.saving = false;
              draft.error = err;
            });
            throw err;
          }
        },

        // LeftPanel'in "Geçmiş" sekmesindeki Build Geçmişi listesini doldurur
        // — PageBuilder mount'ta loadFromAdapter'ın yanında çağrılır.
        loadBuilds: async () => {
          set((draft) => {
            draft.loadingBuilds = true;
          });
          try {
            const list = await adapter.listBuilds();
            set((draft) => {
              draft.builds = list;
              draft.loadingBuilds = false;
            });
          } catch (err) {
            set((draft) => {
              draft.loadingBuilds = false;
              draft.error = err;
            });
          }
        },

        // TopBar'ın "Yayınla" butonu — taslağı (saveToAdapter'la AYNI
        // serileştirme) hem taslak dosyasına yazar (draft güncel kalsın)
        // hem de adapter.publish ile YENİ, adı-konulmuş bir build olarak
        // geçmişe EKLER (üzerine yazmaz — bkz. design-server.mjs).
        publishBuild: async () => {
          const { blocks, blockOrder } = get();
          set((draft) => {
            draft.saving = true;
            draft.error = null;
          });
          try {
            const data = serializeBlocks(blocks, blockOrder);
            await adapter.save(data);
            const list = await adapter.publish(data);
            set((draft) => {
              draft.saving = false;
              draft.builds = list;
            });
          } catch (err) {
            set((draft) => {
              draft.saving = false;
              draft.error = err;
            });
            throw err;
          }
        },

        // Build Geçmişi panelindeki "Taslağa Yükle" — seçilen build'i hem
        // canvas'a (mevcut taslağın ÜZERİNE yazar, normal undo adımı olarak
        // — yanlışlıkla tıklanırsa Ctrl+Z ile geri alınabilir) hem de taslak
        // dosyasına uygular (sayfa yenilenince build kaybolmasın).
        restoreBuild: async (buildId) => {
          const build = get().builds.find((b) => b.id === buildId);
          if (!build) return;
          set((draft) => {
            draft.blocks = {};
            draft.blockOrder = [];
            draft.selectedId = null;
            build.blocks.forEach((block) => {
              draft.blocks[block.id] = block;
              if (!block.parentId) draft.blockOrder.push(block.id);
            });
          });
          await adapter.save(build.blocks);
        },

        addBlock: (block) =>
          set((draft) => {
            draft.blocks[block.id] = block;
            draft.blockOrder.push(block.id);
            draft.selectedId = block.id;
          }),

        // Kütüphaneden (blockLibrary.js) bir CONTAINER + tüm alt-ağacını
        // TEK seferde ekler — addBlock'un tersine, dizideki İLK blok
        // (kök) DIŞINDAKİLER blockOrder'a GİRMEZ (kendi ebeveyninin
        // childOrder'ında zaten referanslı gelirler, bkz.
        // blockLibrary.js instantiateBody). Kökün seçilmesi addBlock'la
        // AYNI (yeni yerleştirilen şey her zaman seçili olur).
        addBlockTree: (blocksArray) =>
          set((draft) => {
            blocksArray.forEach((b) => {
              draft.blocks[b.id] = b;
            });
            const root = blocksArray[0];
            draft.blockOrder.push(root.id);
            draft.selectedId = root.id;
          }),

        updateBlock: (id, patch) =>
          set((draft) => {
            if (!draft.blocks[id]) return;
            Object.assign(draft.blocks[id], patch);
          }),

        // CONTAINER silinince çocukları da silinir (cascade) — Figma'nın
        // "grup sil" davranışı, bkz.
        // docs/plans/2026-08-18-pagebuilder-nested-blocks-design.md. Düz
        // bloklarda (childOrder yok) mevcut davranış AYNEN korunur.
        removeBlock: (id) =>
          set((draft) => {
            const block = draft.blocks[id];
            if (!block) return;
            const parentId = block.parentId ?? null;
            const idsToRemove = [id, ...collectDescendantIds(draft.blocks, id)];
            idsToRemove.forEach((removedId) => delete draft.blocks[removedId]);
            if (parentId && draft.blocks[parentId]) {
              draft.blocks[parentId].childOrder = (draft.blocks[parentId].childOrder ?? []).filter((x) => x !== id);
            } else {
              draft.blockOrder = draft.blockOrder.filter((x) => x !== id);
            }
            if (idsToRemove.includes(draft.selectedId)) draft.selectedId = null;
          }),

        // Layers panelinde sürükle-bırak nested gruplama/taşıma —
        // schema.js'teki reparentBlock'un saf sonucunu store'a uygular.
        reparentBlock: (blockId, newParentId, insertIndex, pxSize) =>
          set((draft) => {
            const result = reparentBlockPure(draft.blocks, draft.blockOrder, blockId, newParentId, insertIndex, pxSize);
            if (!result) return;
            draft.blocks = result.blocksById;
            draft.blockOrder = result.rootOrder;
          }),

        // Layers'ta (ya da FloatingToolbar'da, Faz 4) bir bloğu başka bir
        // bloğun ÜSTÜNE bırakınca (o CONTAINER değilse) otomatik yeni bir
        // container'a sarma — ebeveyn, seçili bloklardan OKUNUR (hepsi
        // aynı ebeveyne sahip olmalı, çağıran taraf garanti eder).
        groupIntoNewContainer: (selectedIds, pxSizes) =>
          set((draft) => {
            const first = draft.blocks[selectedIds[0]];
            if (!first) return;
            const parentId = first.parentId ?? null;
            const parentOrder = parentId ? (draft.blocks[parentId]?.childOrder ?? []) : draft.blockOrder;
            const result = groupBlocksIntoContainerPure(draft.blocks, parentOrder, selectedIds, pxSizes);
            if (!result) return;
            draft.blocks = result.blocksById;
            if (parentId) {
              draft.blocks[parentId].childOrder = result.parentOrder;
            } else {
              draft.blockOrder = result.parentOrder;
            }
            draft.selectedId = result.containerId;
          }),

        // FloatingToolbar/ContextPanel'in "Gruptan Çıkar" aksiyonu —
        // groupIntoNewContainer'ın tersi. Container silinir, çocukları
        // bir seviye yukarı (kendi ebeveynine ya da köke) çıkar. Seçim
        // ilk çocuğa geçer (container'ın kendisi artık yok). Container'ın
        // KENDİSİ nested olabilir (bir üst container'ın çocuğu) — bu
        // durumda çocuklar KÖK blockOrder'a değil, o üst container'ın
        // childOrder'ına geri eklenmeli (groupIntoNewContainer'daki AYNI
        // "hangi sıra dizisi" seçimi).
        ungroupContainer: (containerId) =>
          set((draft) => {
            const container = draft.blocks[containerId];
            if (!container) return;
            const firstChildId = container.childOrder?.[0] ?? null;
            const grandParentId = container.parentId ?? null;
            const parentOrder = grandParentId ? draft.blocks[grandParentId]?.childOrder ?? [] : draft.blockOrder;
            const result = ungroupContainerPure(draft.blocks, parentOrder, containerId);
            if (!result) return;
            draft.blocks = result.blocksById;
            if (grandParentId) {
              draft.blocks[grandParentId].childOrder = result.parentOrder;
            } else {
              draft.blockOrder = result.parentOrder;
            }
            draft.selectedId = firstChildId;
          }),

        duplicateBlock: (id) =>
          set((draft) => {
            const source = draft.blocks[id];
            if (!source) return;
            const newId = makeBlockId();
            draft.blocks[newId] = { ...structuredClone(source), id: newId };
            draft.blockOrder.push(newId);
            draft.selectedId = newId;
          }),

        reorderBlocks: (order) =>
          set((draft) => {
            draft.blockOrder = order;
          }),

        selectBlock: (id) =>
          set((draft) => {
            draft.selectedId = id;
          }),
      })),
      {
        partialize: (state) => ({ blocks: state.blocks, blockOrder: state.blockOrder }),
        limit: 100,
        // ÖNEMLİ: partialize sadece HER kaydın NEYİ tuttuğunu belirler,
        // set() her çağrıldığında (loading/saving/error gibi partialize
        // DIŞI alanlar değişse bile) zundo bir history girişi PUSH'lar —
        // bunu manuel doğrulamada yakaladık (sayfa hiç etkileşim almadan
        // birden fazla undo adımı birikti). immer, dokunulmayan draft
        // alanlarının referansını KORUR (structural sharing) — bu yüzden
        // blocks/blockOrder referans eşitliğiyle "gerçekten değişti mi"
        // sorusu ucuza cevaplanabiliyor, JSON derin karşılaştırmasına
        // gerek yok.
        equality: (pastState, currentState) => pastState.blocks === currentState.blocks && pastState.blockOrder === currentState.blockOrder,
        handleSet: debouncedHandleSet,
      }
    )
  );

  store.cancelPendingHistory = debouncedHandleSet.cancel;
  return store;
}

// TopBar'ın Undo/Redo butonları ve Ctrl+Z/Ctrl+Shift+Z kısayolu bunları
// çağırır — çıplak `store.temporal.getState().undo()/redo()` DEĞİL, çünkü
// bekleyen debounce'u iptal etmeden çağrılırsa yukarıdaki çökme riski
// geri döner.
export function undo(useStore) {
  useStore.cancelPendingHistory();
  useStore.temporal.getState().undo();
}

export function redo(useStore) {
  useStore.cancelPendingHistory();
  useStore.temporal.getState().redo();
}

// Sürükleme/resize gibi yüksek-frekans gesture'lar için.
//
// KRİTİK — zundo kaynağına bakılarak doğrulandı (README'nin de resmi
// önerisi budur, "Cool-off period" bölümü): pause()/resume() bir "birden
// çok set()'i TEK kayda birleştirme" mekanizması DEĞİLDİR. pause() sırasında
// yapılan set() çağrıları history'den TAMAMEN DÜŞER (geri getirilemez,
// resume() bunları "flush" ETMEZ) — zundo her set()'te pastState'i O ANKİ
// çağrıdan hemen önceki state olarak hesaplar, pause öncesi durumu hatırlamaz.
// İlk tasarımda "resume() + trivial setState({})" ile tek kayıt açılacağı
// varsayılmıştı — manuel testte bu YANLIŞ çıktı (gesture tamamen kayboldu).
//
// Doğru kullanım: gesture SIRASINDA ara değerleri TRACKED store'a
// (updateBlock) YAZMAYIN — canlı görsel geri bildirim için yerel component
// state'inde tutun. commitGesture()'dan SONRA, nihai değeri TEK bir gerçek
// updateBlock() çağrısıyla store'a yazın — o tek çağrı history'ye giren
// kayıttır. beginGesture/commitGesture, ara adımların yanlışlıkla tracked
// store'a sızması ihtimaline karşı bir güvenlik ağıdır, "toplu birleştirme"
// yapmaz.
export function beginGesture(useStore) {
  useStore.temporal.getState().pause();
}

export function commitGesture(useStore) {
  useStore.temporal.getState().resume();
}
