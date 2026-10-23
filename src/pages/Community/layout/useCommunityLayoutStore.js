import { create } from 'zustand';
import { getStoredAuth } from '../../../shared/api/authStorage';
import { getMyLayoutPrefs, putMyLayoutPrefs } from '../../../shared/api/account';

// Community 3 kolon düzeninin kullanıcı tercihi: kolon genişlikleri ve
// açık/kapalı durumu. İlk boyama tarayıcıdan (localStorage, senkron okunur —
// kayma olmasın) gelir; oturum açıksa hesapla eşitlenir
// (docs/plans/2026-10-23-community-layout-preferences-api-contract.md).
//
// Eşitleme kuralı (sözleşme: son yazan kazanır):
//  - `dirty`: yerelde henüz sunucuya yazılmamış değişiklik var.
//  - `updatedAt`: son gördüğümüz sunucu zaman damgası.
//  - Açılışta dirty ise yerel PUT edilir, değilse sunucu kaydı yereli ezer.
const STORAGE_KEY = 'fandoom_community_layout';
const SYNC_DEBOUNCE_MS = 1000;

// Sınırlar backend sözleşmesindeki doğrulama aralıklarıyla aynıdır.
export const LAYOUT_LIMITS = {
  leftWidth: { min: 200, max: 420, fallback: 260 },
  rightWidth: { min: 240, max: 420, fallback: 280 },
};

// Sol kolon ray (yalnız logolar) genişliği FE sabitidir, backend'e yazılmaz.
// Sürükleme bu eşiğin altına inince kolon raya oturur (Spotify gibi snap).
export const RAIL_WIDTH = 72;
export const RAIL_SNAP_WIDTH = 150;

const DEFAULTS = {
  leftWidth: LAYOUT_LIMITS.leftWidth.fallback,
  rightWidth: LAYOUT_LIMITS.rightWidth.fallback,
  leftMode: 'full',
  rightMode: 'full',
};

const LEFT_MODES = ['full', 'rail', 'hidden'];
const RIGHT_MODES = ['full', 'hidden'];

function clampWidth(key, value) {
  const { min, max, fallback } = LAYOUT_LIMITS[key];
  return Number.isFinite(value) ? Math.min(max, Math.max(min, Math.round(value))) : fallback;
}

// Bozuk/eski/elle değiştirilmiş kayıt (ya da sunucu yanıtı) düzeni bozmasın:
// her alan doğrulanır, geçersiz olan varsayılana düşer.
function sanitize(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  return {
    leftWidth: clampWidth('leftWidth', source.leftWidth),
    rightWidth: clampWidth('rightWidth', source.rightWidth),
    leftMode: LEFT_MODES.includes(source.leftMode) ? source.leftMode : DEFAULTS.leftMode,
    rightMode: RIGHT_MODES.includes(source.rightMode) ? source.rightMode : DEFAULTS.rightMode,
  };
}

function readStored() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return {
      ...sanitize(raw),
      updatedAt: typeof raw?.updatedAt === 'string' ? raw.updatedAt : null,
      dirty: raw?.dirty === true,
    };
  } catch {
    return { ...DEFAULTS, updatedAt: null, dirty: false };
  }
}

function persist(state) {
  const { leftWidth, rightWidth, leftMode, rightMode, updatedAt, dirty } = state;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ leftWidth, rightWidth, leftMode, rightMode, updatedAt, dirty }),
    );
  } catch {
    // localStorage kapalıysa düzen yalnız oturum boyunca bellekte kalır.
  }
}

const hasSession = () => Boolean(getStoredAuth()?.token);
const pickPrefs = ({ leftWidth, rightWidth, leftMode, rightMode }) => ({ leftWidth, rightWidth, leftMode, rightMode });
const samePrefs = (a, b) => Object.keys(DEFAULTS).every((key) => a[key] === b[key]);

let syncTimer = null;
let syncInFlight = null;

export const useCommunityLayoutStore = create((set, get) => {
  // Yerel tercihi sunucuya yazar. İstek sürerken kullanıcı yeniden değiştirdiyse
  // dirty açık kalır ve bir tur daha planlanır. Hata (uç yok/ağ/doğrulama)
  // sessizdir: düzen yerelde çalışmaya devam eder, dirty kalır, sonraki
  // açılışta yeniden denenir.
  const push = async () => {
    if (!hasSession()) return;
    const sent = pickPrefs(get());
    try {
      const saved = await putMyLayoutPrefs(sent);
      const changedMeanwhile = !samePrefs(sent, pickPrefs(get()));
      set({ updatedAt: saved?.updatedAt ?? get().updatedAt, dirty: changedMeanwhile });
      persist(get());
      if (changedMeanwhile) scheduleSync();
    } catch {
      // bkz. yukarıdaki not
    }
  };

  const scheduleSync = () => {
    if (!hasSession()) return;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(push, SYNC_DEBOUNCE_MS);
  };

  const commit = (next) => {
    set({ ...next, dirty: true });
    persist(get());
    scheduleSync();
  };

  return {
    ...readStored(),
    // Sürükleme bırakılınca / klavye / kapat-aç: tek giriş noktası, hep doğrulanır.
    update: (partial) => commit(sanitize({ ...get(), ...partial })),
    reset: () => commit(DEFAULTS),

    // Community açılışında bir kez: oturum yoksa hiçbir istek atılmaz.
    syncWithAccount: () => {
      if (!hasSession()) return Promise.resolve();
      if (syncInFlight) return syncInFlight;
      syncInFlight = (async () => {
        try {
          const remote = await getMyLayoutPrefs();
          const local = get();
          if (!remote) {
            // Sunucuda kayıt yok: yalnız kullanıcı bir şey değiştirdiyse yaz.
            if (local.dirty) await push();
          } else if (local.dirty) {
            await push();
          } else if (remote.updatedAt !== local.updatedAt) {
            set({ ...sanitize(remote), updatedAt: remote.updatedAt ?? null, dirty: false });
            persist(get());
          }
        } catch {
          // Uç yok (404) / ağ hatası: yerel kayıtla devam.
        } finally {
          syncInFlight = null;
        }
      })();
      return syncInFlight;
    },
  };
});
