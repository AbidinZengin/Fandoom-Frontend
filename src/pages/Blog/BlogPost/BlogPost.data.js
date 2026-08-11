// "Blog" yüzeyinin veri kaynağı — backend'in blog modülüne
// (GET /api/blogs/slug/:slug) bağlanır. Kart hangi görselle (imageUrlLarge)
// büyüdüyse sayfa AYNI görselle devralır, aksi hâlde devir anında kare
// değişir ve geçiş "kesme" olarak görünür.
import { fetchBlogBySlug, fetchBlogs } from '../../../shared/api/blogs';
import { resolveProductionById } from '../../../shared/api/productions';

// tags[] sayısal subjectId taşır (BlogTagResponse), TagChips ise
// productionSlug bekler (learned-rules: yalnız game-of-thrones bölüm
// derinliğinde link üretir) — burada productions API'sinden id→slug çözülüp
// TagChips'in beklediği şekle eşlenir; TagChips'e DOKUNULMADI. subjectId
// çözülemeyen (silinmiş/bilinmeyen yapım) tag'ler sessizce atlanır.
async function resolveTags(tags) {
  const resolved = await Promise.all(
    (tags ?? []).map(async (tag) => {
      if (!tag.subjectType || tag.subjectId == null) return null;
      const production = await resolveProductionById(tag.subjectId, tag.subjectType);
      if (!production) return null;
      return {
        productionSlug: production.slug,
        seasonNumber: tag.seasonNumber,
        episodeNumber: tag.episodeNumber,
      };
    })
  );
  return resolved.filter(Boolean);
}

export async function getBlogDetail(slug) {
  const detail = await fetchBlogBySlug(slug);
  const tags = await resolveTags(detail.tags);
  const sortedBlocks = (detail.blocks ?? []).slice().sort((a, b) => a.orderIndex - b.orderIndex);

  // canvasHeight null = x/y/width/height geçişinden ÖNCE kaydedilmiş eski
  // blog (backend'de backfill migration YOK, sadece yeni nullable kolonlar
  // eklendi). Serbest canvas konumu TAHMİNİ olacağından (gerçek içerik
  // yüksekliği bilinmeden hesaplanamaz — kullanıcı raporu: "imagelerin
  // üstüne çakışıyorlar") burada TAHMİN YAPILMAZ: isLegacyLayout=true ile
  // BlogPost.jsx bu blogu NORMAL AKIŞTA (üst üste, gerçek içerik boyuna
  // göre otomatik, çakışma İMKANSIZ) render eder — eski görünümüne en
  // yakın, riske en az açık seçenek. Editör tarafında (BlogEditor.data.js)
  // hâlâ tahmini bir başlangıç konumu veriliyor — orada admin sürükleyerek
  // düzeltebilir, yayınlanan sayfada okuyucu düzeltemez.
  const isLegacyLayout = detail.canvasHeight == null;

  return {
    id: detail.id,
    slug: detail.slug,
    title: detail.title,
    // Editörün serbest yazdığı çerçeveleme metni — tag/sezon/bölüm verisine
    // bağımlı DEĞİL, bölümden bağımsız içerikte de anlamlı kalır (kullanıcı
    // sorusu: "tag'siz içerik ne başlığı altında çıkar" → cevap: kicker).
    kicker: detail.kicker,
    axis: detail.axis,
    // Kart w780 ile büyüdü; sayfada kutu daha büyük olduğu için imageUrlLarge
    // kullanılır — aynı görselin daha yüksek çözünürlüklü sürümü olduğundan
    // tarayıcı çoğu durumda kareyi değiştirmeden üstüne biner.
    imageUrl: detail.imageUrlLarge ?? detail.imageUrl,
    imageAlt: detail.imageAlt,
    publishedAt: detail.publishedAt,
    readingTimeMinutes: detail.readingTimeMinutes,
    // orderIndex'e göre sıralanır — backend zaten sıralı dönüyor olsa da
    // render sırası burada garanti edilir (savunmacı, tek satır); aynı
    // sıra DOM'daki z-sırasını da belirler (bkz. BlogPost.jsx, learned-rules
    // [blog-blok-pozisyon]).
    blocks: sortedBlocks,
    isLegacyLayout,
    // Serbest canvas'ın toplam yüksekliği (piksel, genişlik referansı sabit
    // 1360px) — blok x/y/width/height yüzdeleri buna göre çözülür.
    // isLegacyLayout true iken kullanılmaz (normal akış otomatik yükseklik).
    canvasHeight: detail.canvasHeight,
    tags,
    spoilerThrough:
      detail.spoilerThroughSeasonNumber != null
        ? {
            seasonNumber: detail.spoilerThroughSeasonNumber,
            episodeNumber: detail.spoilerThroughEpisodeNumber,
          }
        : null,
    // Backend zaten aynı kaynağın filtrelenmiş vitrinini gömülü döner (max 6)
    // — ayrı bir "diğerlerini getir" çağrısına gerek yok. Kaynak alan adı
    // backend'de relatedContentDrops'tan relatedBlogs'a yeniden adlandırıldı
    // (doğrulandı: canlı backend'de relatedContentDrops artık undefined) —
    // burada da güncellendi.
    relatedBlogs: detail.relatedBlogs ?? [],
  };
}

// Önceki/sonraki yazı navigasyonu — backend'in bunun için ayrı bir ucu yok,
// tam listeden (varsayılan sırayla) mevcut slug'ın komşuları çıkarılır.
// productions.js'teki fetchAllProductions ile AYNI gerekçe: katalog şimdilik
// tek sayfaya sığacak kadar küçük. Blog sayısı büyüyünce (yüzlerce kayıt) bu
// tek-sayfalık yaklaşım ölçeklenmez — backend'e "önceki/sonraki slug" döner
// ayrı bir uç eklemek gerekir; kapsam dışı, burada raporlanır.
export async function getAdjacentBlogs(slug) {
  const { content } = await fetchBlogs({ size: 100 });
  const index = content.findIndex((entry) => entry.slug === slug);
  if (index === -1) return { previous: null, next: null };
  return {
    previous: index > 0 ? content[index - 1] : null,
    next: index < content.length - 1 ? content[index + 1] : null,
  };
}
