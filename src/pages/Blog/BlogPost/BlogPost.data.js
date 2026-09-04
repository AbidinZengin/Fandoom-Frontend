// "Blog" yüzeyinin veri kaynağı — backend'in blog modülüne
// (GET /api/blogs/slug/:slug) bağlanır. Kart hangi görselle (imageUrlLarge)
// büyüdüyse sayfa AYNI görselle devralır, aksi hâlde devir anında kare
// değişir ve geçiş "kesme" olarak görünür.
import { fetchBlogBySlug, fetchBlogs } from '../../../shared/api/blogs';
import { resolveProductionById } from '../../../shared/api/productions';
import i18n from '../../../shared/i18n/i18n';

// Backend base alanı (title/kicker/axis/content/imageAlt) İngilizce, *Tr
// ikizi Türkçe çeviridir — bkz. entitySchemas.js "titleTr ikizi" notu ve
// canlı GET /api/blogs/{id} (title===titleTr sadece henüz çevrilmemiş
// blog'larda). Önceden HİÇBİR yerde okunmuyordu (kullanıcı raporu: "TR/EN
// ayrımı bozuk") — dil route'tan LangGate ile i18next'e yazılıyor, o yüzden
// çağrı anında i18n.language okumak yeterli (LangGate dil değişince alt
// ağacı key={lang} ile remount ediyor, bu fonksiyon zaten yeniden çalışır).
function pickLocale(base, tr) {
  return i18n.language === 'tr' ? (tr ?? base) : base;
}

// Gövde artık serbest x/y canvas DEĞİL — BreakingBad SeasonStory'nin
// ("sezon incelemesi") blok şemasıyla BİREBİR aynı desen (kullanıcı kararı,
// 2026-08): backend blocks[] düz bir liste döner, ardışık aynı sceneKey'li
// bloklar TEK "section" oluşturur (bkz. SeasonStory.jsx parseSeasonBlocks).
// KASITLI FARKLAR (backend kontratı netleşti, 2026-08): görsel blockType'ı
// SeasonBlock'un MEDIA'sı değil IMAGE — alanlar da mediaUrl/mediaAlt değil
// imageUrl/imageAlt (blog her zaman bir bölüme bağlı olmadığı için episode
// still referansı genellenemez, editör doğrudan görsel yükler); mediaCredit
// YOK — blog'da fotoğraf kredisi gösterilmiyor.
function parseBlogBlocks(blocks) {
  if (!blocks?.length) return null;
  const sorted = [...blocks].sort((a, b) => a.orderIndex - b.orderIndex);
  const lede = [];
  const verdict = [];
  const sectionsByKey = new Map();

  for (const block of sorted) {
    const content = pickLocale(block.content, block.contentTr);
    const imageAlt = pickLocale(block.imageAlt, block.imageAltTr);

    if (block.blockType === 'LEDE_TEXT') {
      lede.push(...content.split('\n\n'));
      continue;
    }
    if (block.blockType === 'VERDICT_TEXT') {
      verdict.push(...content.split('\n\n'));
      continue;
    }

    let section = sectionsByKey.get(block.sceneKey);
    if (!section) {
      section = { id: block.sceneKey, heading: '', photo: null, paragraphs: [], pullQuote: null };
      sectionsByKey.set(block.sceneKey, section);
    }

    switch (block.blockType) {
      case 'SECTION_HEADING':
        section.heading = content;
        break;
      case 'IMAGE':
        section.photo = { url: block.imageUrl, alt: imageAlt };
        break;
      case 'SECTION_LEAD_TEXT':
        section.paragraphs.push(content);
        break;
      case 'SECTION_TEXT':
        section.paragraphs.push(...content.split('\n\n'));
        break;
      case 'QUOTE':
        section.pullQuote = content;
        break;
      default:
        break;
    }
  }

  return { lede, sections: [...sectionsByKey.values()], verdict };
}

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
  const story = parseBlogBlocks(detail.blocks);

  return {
    id: detail.id,
    slug: detail.slug,
    title: pickLocale(detail.title, detail.titleTr),
    // Editörün serbest yazdığı çerçeveleme metni — tag/sezon/bölüm verisine
    // bağımlı DEĞİL, bölümden bağımsız içerikte de anlamlı kalır (kullanıcı
    // sorusu: "tag'siz içerik ne başlığı altında çıkar" → cevap: kicker).
    kicker: pickLocale(detail.kicker, detail.kickerTr),
    axis: pickLocale(detail.axis, detail.axisTr),
    // Kart w780 ile büyüdü; sayfada kutu daha büyük olduğu için imageUrlLarge
    // kullanılır — aynı görselin daha yüksek çözünürlüklü sürümü olduğundan
    // tarayıcı çoğu durumda kareyi değiştirmeden üstüne biner.
    imageUrl: detail.imageUrlLarge ?? detail.imageUrl,
    imageAlt: pickLocale(detail.imageAlt, detail.imageAltTr),
    publishedAt: detail.publishedAt,
    readingTimeMinutes: detail.readingTimeMinutes,
    // { lede[], sections[{id,heading,photo,paragraphs[],pullQuote}], verdict[] }
    // — içerik yoksa (blocks boş/henüz yazılmadıysa) null, BlogPost.jsx gövdeyi
    // hiç render etmez.
    story,
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
