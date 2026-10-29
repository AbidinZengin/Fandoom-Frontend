// Blog hub'ın veri erişim katmanı — Editor's Pick (spotlight) ve Top 10
// Blogs şeridi gerçek backend verisiyle beslenir (GET /api/blogs).
// FEATURED/LATEST rayları kapsam dışı bırakıldı (kullanıcı isteği: sadece
// ana bölüm + top 10) — placeholder olarak kalıyor.
import { fetchBlogHub, fetchBlogHubFacets, fetchBlogs } from '../../shared/api/blogs';
import { fetchAllGenres } from '../../shared/api/genres';

// MOCK dağıtım: Editor's Pick carousel'i ilk 5 blog, Top Blogs kalanı.
// FEATURED/LATEST için backend'de alan/sıralama yok — şimdilik aynı listeden
// sabit dilimler (Latest = listenin başı, Featured = sonu). Tasarım
// netleşip backend gelince sadece bu fonksiyon değişir.
const SPOTLIGHT_COUNT = 5;
const RAIL_COUNT = 3;

export async function getBlogHub() {
  const { content } = await fetchBlogs({ size: 20 });
  return {
    spotlights: content.slice(0, SPOTLIGHT_COUNT),
    topBlogs: content.slice(SPOTLIGHT_COUNT),
    featured: content.slice(-RAIL_COUNT),
    latest: content.slice(0, RAIL_COUNT),
  };
}

// Filter panelinin taxonomy kaynağı — hub facets (tek çağrı, oturum boyunca
// değişmeyecek kadar sık değişmiyor ama count'lar güncel kalsın diye
// memoize EDİLMİYOR, panel her açılışta taze çeker) + sitenin mevcut genre
// taksonomisi (fetchAllGenres, kendi içinde memoize — genres.js). Genre
// blog'a özel bir facet DEĞİL, kullanıcı kararıyla mevcut kataloğun ödünç
// alınmış hâli — bkz. fetchBlogHub yorumu.
export async function getBlogFacets() {
  // allSettled: iki kaynak birbirinden bağımsız — biri (ör. hub facets
  // backend'de henüz yoksa) başarısız olsa da diğeri (genres, ayrı ve
  // stabil bir uç) panelde kullanılabilir kalsın.
  const [hubResult, genresResult] = await Promise.allSettled([fetchBlogHubFacets(), fetchAllGenres()]);
  const hubFacets = hubResult.status === 'fulfilled' ? hubResult.value : {};
  const genres = genresResult.status === 'fulfilled' ? genresResult.value : [];
  return { ...hubFacets, genres: genres.map((g) => ({ id: g.id, name: g.name, slug: String(g.id) })) };
}

// Filtrelenmiş/browse modu sonuç sayfası. `filters` FilterPanel'in değer
// şeklini birebir taşır (format: sabit enum slug, franchise: tekil slug;
// genre, mood: slug dizisi; spoilerFree: boolean; sort: latest|oldest|
// trending|recommended).
export async function getBlogFilterResults(filters, page = 0) {
  return fetchBlogHub({ ...filters, page, size: 20 });
}
