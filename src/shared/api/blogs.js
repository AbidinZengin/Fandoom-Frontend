import { apiClient } from './client';

// GET /api/blogs — editöryel derin-analiz ("Dive Deeper") feed'i,
// backend'in PageResponse<T> zarfını olduğu gibi döner. content öğesi
// (BlogSummaryResponse): { id, slug, title, imageUrl, imageAlt,
// readingTimeMinutes }.
export async function fetchBlogs({ page = 0, size = 20, sort } = {}) {
  const params = new URLSearchParams({ page, size });
  if (sort) params.set('sort', sort);
  return apiClient.get(`/blogs?${params}`);
}

// GET /api/blogs/slug/:slug — yalnız PUBLISHED, her çağrı viewCount
// artırır. BlogDetailResponse blocks[]/tags[]/relatedBlogs[] (max 6) içerir
// — detay sayfası ayrıca ilişkili içerik çağrısı yapmaz.
// NOT: bu gömülü alanın adı relatedContentDrops'tan relatedBlogs'a
// yeniden adlandırıldı (canlı backend'de doğrulandı) — BlogPost.data.js
// bu alanı artık relatedBlogs olarak okuyor.
// blocks[] öğeleri serbest canvas konumu taşır: x/y/width yüzde (0-100),
// height opsiyonel yüzde (null = içeriğe göre otomatik). Blog'un kendisi
// canvasHeight (piksel, genişlik referansı sabit 1360px) taşır — bkz.
// BlogPost.jsx (görüntüleme) ve BlogEditor (düzenleme). Önceki col/row
// (CSS grid shorthand) alanlarının YERİNE geçti (2026-08).
export async function fetchBlogBySlug(slug) {
  return apiClient.get(`/blogs/slug/${slug}`);
}

// GET /api/blogs/{id} — status-agnostic (draft dahil), admin editörü için.
// Response şekli fetchBlogBySlug ile aynı (BlogDetailResponse).
export async function fetchBlogById(id) {
  return apiClient.get(`/blogs/${id}`);
}

// POST /api/blogs — BlogRequest gövdesiyle blog oluşturur, blocks[] içeride
// taşınır. EDITOR/MODERATOR/ADMIN rolü gerektirir.
export async function createBlog(payload) {
  return apiClient.post('/blogs', payload);
}

// PUT /api/blogs/{id} — aynı BlogRequest gövdesi; blocks[] REPLACE-ALL'dır,
// değişmeyenler dahil dizinin TAMAMI gönderilmelidir (backend clearBlocks
// yapıp yeniden oluşturuyor, kısmi/patch update yok).
export async function updateBlog(id, payload) {
  return apiClient.put(`/blogs/${id}`, payload);
}

// GET /api/blogs/related — bir yapım/sezon/bölüm bağlamına göre
// filtrelenmiş "Dive Deeper" şeridi. productionType: 'SERIES'|'MOVIE' ve
// productionSlug zorunlu; seasonNumber/episodeNumber opsiyonel.
export async function fetchRelatedBlogs({
  productionType,
  productionSlug,
  seasonNumber,
  episodeNumber,
  limit = 9,
} = {}) {
  const params = new URLSearchParams({ productionType, productionSlug, limit });
  if (seasonNumber != null) params.set('seasonNumber', seasonNumber);
  if (episodeNumber != null) params.set('episodeNumber', episodeNumber);
  return apiClient.get(`/blogs/related?${params}`);
}

// GET /api/blogs/hub — facet'lenebilir keşif feed'i (Filter paneli). format
// sabit enum (REVIEW|RECAP|ANALYSIS|RANKING|INTERVIEW|BEHIND_THE_SCENES|
// CHARACTER — CHARACTER 2026-08 sonrası eklendi),
// franchise tekil slug, mood virgüllü çoklu slug (facet içi OR), spoilerFree
// boolean; hepsi opsiyonel ve AND'lenir. sort: latest|oldest|trending|
// recommended (default latest). Mevcut GET /api/blogs (fetchBlogs, küratörlü
// hub) bundan bağımsız, dokunulmuyor.
//
// theme: backend kontratından (2026-08 güncelleme) TAMAMEN KALKTI — parametre
// gönderilmiyor.
//
// genre: backend kontratının (2026-08 PR) parçası DEĞİL — kullanıcı kararı:
// blog'a özel yeni bir facet yerine sitenin mevcut /api/genres taksonomisi
// kullanılıyor. Backend /blogs/hub bu parametreyi HENÜZ desteklemiyor;
// eklenene kadar bu filtre UI'da seçilebilir ama sonuçları etkilemez —
// backend istek listesine yazıldı.
export async function fetchBlogHub({
  format,
  franchise,
  mood,
  genre,
  spoilerFree,
  sort,
  page = 0,
  size = 20,
} = {}) {
  const params = new URLSearchParams({ page, size });
  if (format) params.set('format', format);
  if (franchise) params.set('franchise', franchise);
  if (mood?.length) params.set('mood', mood.join(','));
  if (genre?.length) params.set('genre', genre.join(','));
  if (spoilerFree) params.set('spoilerFree', 'true');
  if (sort) params.set('sort', sort);
  return apiClient.get(`/blogs/hub?${params}`);
}

// GET /api/blogs/hub/facets — Filter panelinin TAMAMINI tek çağrıda dolduran
// taxonomy: { formats, moods, franchises } dizileri, her öğe { id, name,
// slug, count } (franchises ayrıca logoUrl taşır). formats artık sabit enum
// (REVIEW/RECAP/ANALYSIS/RANKING/INTERVIEW/BEHIND_THE_SCENES) — FE bu değeri
// opak slug olarak facets'ten alıp aynen geri gönderdiği için ayrıca
// hardcode edilmedi. themes alanı kontrattan KALKTI. count şu an
// draft+published karışık sayıyor (backend'in bilinen basitleştirmesi).
// NOT: formats öğeleri şu an { format, count } şeklinde geliyor (id/name/slug
// YOK) — FacetDropdown'ın beklediği { id, name, slug, count } ile uyuşmuyor,
// Filter panelinde Format facet'i bu yüzden düzgün render olmuyor olabilir.
// Bu dosyanın kapsamı dışında, ayrı görev olarak bildirildi.
export async function fetchBlogHubFacets() {
  return apiClient.get('/blogs/hub/facets');
}
