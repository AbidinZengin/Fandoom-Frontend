import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { temporal } from 'zundo';
import { makeBlockId } from './schema';

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
                (data ?? []).forEach((block) => {
                  draft.blocks[block.id] = block;
                  draft.blockOrder.push(block.id);
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
            const data = blockOrder.map((id) => blocks[id]);
            await adapter.save(data);
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

        addBlock: (block) =>
          set((draft) => {
            draft.blocks[block.id] = block;
            draft.blockOrder.push(block.id);
            draft.selectedId = block.id;
          }),

        updateBlock: (id, patch) =>
          set((draft) => {
            if (!draft.blocks[id]) return;
            Object.assign(draft.blocks[id], patch);
          }),

        removeBlock: (id) =>
          set((draft) => {
            delete draft.blocks[id];
            draft.blockOrder = draft.blockOrder.filter((x) => x !== id);
            if (draft.selectedId === id) draft.selectedId = null;
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
