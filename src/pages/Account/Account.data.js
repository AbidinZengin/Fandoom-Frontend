import { fetchProductionDetail, resolveProductionById } from '../../shared/api/productions';
import { fetchCharactersForSeries } from '../../shared/api/characters';
import { fetchBlogById } from '../../shared/api/blogs';
import {
  getMyLists,
  getMyListDetail,
  getMyFollows,
  getMyLikes,
  getMyBookmarks,
  createMyList,
  updateMyList,
  deleteMyList,
} from '../../shared/api/account';

// Rozetler ve "Favori Karakterler" kürsüsü decorative kalır — backend'de
// rozet modeli yok (bkz. docs/plans/2026-08-29-account-page-design.md
// "Ertelenen"). Top Characters kullanıcıya özgü değil, genel GoT karakter
// listesinden sabit bir örnek (önceki mock davranışın aynısı).
export const BADGES = [
  { key: 'bingeWatcher', unlocked: true },
  { key: 'firstTheory', unlocked: true },
  { key: 'loreMaster', unlocked: false, hintCount: 3 },
  { key: 'spoilerFree', unlocked: false, hintCount: 5 },
];

// Watchlist/Following/Liked/Saved backend'de itemId+itemType HAM döner
// (bkz. 14b/14d/14e) — production ise resolveProductionById (tek toplu
// fetch üstünde bellekte arama), blog ise fetchBlogById (gerçek ağ çağrısı,
// N+1) ile zenginleştirilir. Bulunamayan/silinmiş öğe listeden düşer.
async function enrichRawItems(rawItems) {
  const enriched = await Promise.all(
    (rawItems ?? []).map(async (raw) => {
      try {
        const detail =
          raw.itemType === 'BLOG'
            ? await fetchBlogById(raw.itemId)
            : await resolveProductionById(raw.itemId, raw.itemType);
        if (!detail) return null;
        return {
          ...detail,
          itemType: raw.itemType,
          savedItemId: raw.id,
          progressPercentage: raw.progressPercentage ?? null,
        };
      } catch {
        return null;
      }
    })
  );
  return enriched.filter(Boolean);
}

async function getSystemListItems(lists, listType) {
  const list = lists.find((l) => l.listType === listType);
  if (!list) return [];
  const detail = await getMyListDetail(list.id);
  return enrichRawItems(detail.items?.content);
}

// DashboardView'ın Profil/İçeriklerim/Karakterler alt-bölümleri bu tek
// çağrının sonucunu paylaşır — DashboardView bir kere çeker, prop'la dağıtır.
// "Kaydettiklerim" (saved) bağımsız Bookmark'tan (GET /me/bookmarks) okunur
// — "Kaydet" butonu (ContentActions) Watchlist/Watched/okuma ilerlemesinden
// TAMAMEN ayrı bu varlığa yazıyor (kullanıcı kararı, 2026-08-29).
// "Okumaya Devam Et" (continueReading) AYRI bir kaynak: READLIST sistem
// listesi, kullanıcı bir şeye tıklamadan BlogPost.jsx'in scroll takibiyle
// otomatik doldurulur/güncellenir (gerçek progressPercentage). Bitmiş
// (%100) yazılar "devam et" listesinde anlamsız olduğu için elenir.
export async function getAccountContent() {
  const [lists, followsPage, likesPage, bookmarksPage, series] = await Promise.all([
    getMyLists(),
    getMyFollows({ size: 20 }),
    getMyLikes({ size: 20 }),
    getMyBookmarks({ size: 20 }),
    fetchProductionDetail('series', 'game-of-thrones'),
  ]);

  const [watchlist, continueReading, saved, following, liked, characters] = await Promise.all([
    getSystemListItems(lists, 'WATCHLIST'),
    getSystemListItems(lists, 'READLIST'),
    enrichRawItems(bookmarksPage.content),
    enrichRawItems(followsPage.content),
    enrichRawItems(likesPage.content),
    fetchCharactersForSeries(series.id),
  ]);

  return {
    watchlist,
    continueReading: continueReading.filter((item) => (item.progressPercentage ?? 0) < 100),
    saved,
    following,
    liked,
    topCharacters: characters.slice(0, 3),
  };
}

// Custom Lists — CustomListsSection kendi fetch/refetch döngüsünü buradan
// yürütür (getAccountContent'in paylaşılan demetinden bağımsız, çünkü
// oluşturma/silme sonrası sadece bu listenin yenilenmesi gerekir).
export async function getCustomLists() {
  const lists = await getMyLists();
  return lists.filter((l) => l.listType === 'CUSTOM');
}

export async function createCustomList(fields) {
  return createMyList(fields);
}

export async function editCustomList(id, fields) {
  return updateMyList(id, fields);
}

export async function removeCustomList(id) {
  return deleteMyList(id);
}
