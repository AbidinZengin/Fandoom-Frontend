import { fetchProductionDetail, resolveProductionById, fetchAllProductions } from '../../shared/api/productions';
import { fetchCharactersForSeries } from '../../shared/api/characters';
import { fetchBlogById, fetchBlogs } from '../../shared/api/blogs';
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

// DashboardView'ın İçeriklerim/Karakterler alt-bölümleri bu tek çağrının
// sonucunu paylaşır — DashboardView bir kere çeker, prop'la dağıtır.
// "Kaydettiklerim" (saved) bağımsız Bookmark'tan (GET /me/bookmarks) okunur
// — "Kaydet" butonu (ContentActions) Watchlist/Watched/okuma ilerlemesinden
// TAMAMEN ayrı bu varlığa yazıyor (kullanıcı kararı, 2026-08-29).
export async function getAccountContent() {
  const [lists, followsPage, likesPage, bookmarksPage, series] = await Promise.all([
    getMyLists(),
    getMyFollows({ size: 20 }),
    getMyLikes({ size: 20 }),
    getMyBookmarks({ size: 20 }),
    fetchProductionDetail('series', 'game-of-thrones'),
  ]);

  const [watchlist, saved, following, liked, characters] = await Promise.all([
    getSystemListItems(lists, 'WATCHLIST'),
    enrichRawItems(bookmarksPage.content),
    enrichRawItems(followsPage.content),
    enrichRawItems(likesPage.content),
    fetchCharactersForSeries(series.id),
  ]);

  return {
    watchlist,
    saved,
    following,
    liked,
    topCharacters: characters.slice(0, 3),
  };
}

// Community kütüphane sekmeleri (Liked/Saved/Watchlist/Following) yalnız AÇILAN
// sekmeyi çeker — getAccountContent karakter detaylarını da getirdiği için
// Community'de gereksiz ağır. Aynı kaynaklar, aynı enrichment.
export async function getLibraryItems(tab) {
  if (tab === 'watchlist') return getSystemListItems(await getMyLists(), 'WATCHLIST');
  if (tab === 'saved') return enrichRawItems((await getMyBookmarks({ size: 20 })).content);
  if (tab === 'following') return enrichRawItems((await getMyFollows({ size: 20 })).content);
  if (tab === 'liked') return enrichRawItems((await getMyLikes({ size: 20 })).content);
  return [];
}

// "Okumaya Devam Et" (Community/ProfileView) AYRI bir kaynak: READLIST
// sistem listesi, kullanıcı bir şeye tıklamadan BlogPost.jsx'in scroll
// takibiyle otomatik doldurulur/güncellenir (gerçek progressPercentage).
// Bitmiş (%100) yazılar "devam et" listesinde anlamsız olduğu için elenir.
// getAccountContent'ten AYRI tutulur — Profile Community'ye taşındıktan
// sonra (2026-09-23) Account'un ağır toplu çağrısını (watchlist/follows/
// likes/bookmarks/characters) tetiklemeden sadece bu listeyi çeker.
export async function getContinueReading() {
  const lists = await getMyLists();
  const items = await getSystemListItems(lists, 'READLIST');
  return items.filter((item) => (item.progressPercentage ?? 0) < 100);
}

// Custom Lists — CustomListsSection kendi fetch/refetch döngüsünü buradan
// yürütür (getAccountContent'in paylaşılan demetinden bağımsız, çünkü
// oluşturma/silme sonrası sadece bu listenin yenilenmesi gerekir).
//
// `dominantType`: backend'de listenin türünü tutan bir alan YOK (kullanıcı
// kararı, 2026-08-31: liste homojen olmalı — filmler kendi içinde, diziler
// kendi içinde, bloglar kendi içinde) — şema'ya sahte bir alan eklemek
// yerine tür, listenin İLK öğesinin itemType'ından TÜRETİLİR (N+1 istek,
// liste sayısı az olduğu için kabul edilebilir — enrichRawItems'taki aynı
// desen). Boş liste için `null` döner (henüz tür seçilmemiş demektir,
// ListEditorModal ilk öğe eklenene kadar seçim sorar).
export async function getCustomLists() {
  const lists = await getMyLists();
  const customLists = lists.filter((l) => l.listType === 'CUSTOM');
  const withType = await Promise.all(
    customLists.map(async (list) => {
      try {
        const detail = await getMyListDetail(list.id, { size: 1 });
        return { ...list, dominantType: detail.items?.content?.[0]?.itemType ?? null };
      } catch {
        return { ...list, dominantType: null };
      }
    })
  );
  return withType;
}

// Profil playlist kartındaki poster yığını: listenin ilk `count` öğesinin görseli
// (üretim → posterUrl, blog → imageUrl). Hata/boş liste → []. Backend liste
// özetinde önizleme alanı gelene kadar kart başına tek ek istek.
export async function getListPreviewImages(id, count = 4) {
  try {
    const detail = await getMyListDetail(id, { size: count });
    const items = await enrichRawItems(detail.items?.content);
    return items.map((item) => (item.itemType === 'BLOG' ? item.imageUrl : item.posterUrl)).filter(Boolean);
  } catch {
    return [];
  }
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

// Tek bir CUSTOM listenin detay sayfası (ListDetail) için: meta (title/
// description/coverImageUrl/isPublic) getMyLists()'in ilgili satırından
// (getMyListDetail'in meta alanları döndürüp döndürmediği doğrulanmadı,
// ListEditorModal de aynı nedenle meta'yı `list` prop'undan alır, sadece
// içerikler için getMyListDetail'i çağırır — aynı desen tekrarlanıyor),
// sıralı içerik listesi getMyListDetail + enrichRawItems'tan gelir.
export async function getCustomListDetail(id) {
  const [lists, detail] = await Promise.all([getCustomLists(), getMyListDetail(id, { size: 200 })]);
  const meta = lists.find((l) => String(l.id) === String(id));
  const items = await enrichRawItems(detail.items?.content);
  return { ...meta, items };
}

// Bir listeye eklenebilecek TAM katalog, tek türe daraltılmış — ListEditorModal
// ve AddItemsPanel'in arama kutusu bunu kullanır (kullanıcı kararı, 2026-08-31:
// "search ile ekleme kısmı gelmeli", eski "sadece kaydedilenlerden/
// beğenilerden seç" havuzu kaldırıldı, gerçek arama ucu YOK ama fetchAllProductions
// zaten tüm katalogu önbellekte tutuyor — blog için de aynı desen, size:100
// ile tek seferde çekilip client-side filtrelenir; fetchProductions/fetchBlogs
// gibi bu da katalog tamamını garanti ETMİYOR, çok büyürse backend'e gerçek
// arama ucu istenmeli). Sonuç şekli candidate: { id, itemType, title,
// posterUrl|imageUrl } — toggleItem'ın beklediği şekille birebir aynı.
export async function fetchCatalogForType(itemType) {
  if (itemType === 'BLOG') {
    const page = await fetchBlogs({ size: 100 });
    return (page.content ?? []).map((b) => ({ id: b.id, itemType: 'BLOG', title: b.title, imageUrl: b.imageUrl }));
  }
  const all = await fetchAllProductions();
  return all
    .filter((p) => p.type === itemType)
    .map((p) => ({ id: p.id, itemType: p.type, title: p.title, posterUrl: p.posterUrl }));
}
