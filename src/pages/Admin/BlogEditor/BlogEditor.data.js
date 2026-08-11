import { createBlog, fetchBlogById, updateBlog } from '../../../shared/api/blogs';
import { applyFallbackCanvasLayout } from '../../../shared/blogBlockLayout';

export const BLOCK_TYPES = ['HEADING', 'QUOTE', 'PARAGRAPH', 'IMAGE'];

export const BLOCK_TYPE_LABELS = {
  HEADING: 'Heading',
  QUOTE: 'Quote',
  PARAGRAPH: 'Paragraph',
  IMAGE: 'Image',
};

export const STATUS_OPTIONS = ['DRAFT', 'PUBLISHED'];

// Backend'in BlogFormat enum'u (fetchBlogHubFacets.js açıklamasından).
export const FORMAT_OPTIONS = [
  'REVIEW',
  'RECAP',
  'ANALYSIS',
  'RANKING',
  'INTERVIEW',
  'BEHIND_THE_SCENES',
  'CHARACTER',
];

// Marka bütünlüğü için AÇIK bir font seçici değil, projede zaten var olan
// üç fontla sınırlı liste (learned-rules: "Fandoom marka fontu Montserrat
// KALIR"). null = bloğun kendi varsayılanı (HEADING→GoT, diğerleri→Montserrat).
export const FONT_OPTIONS = [
  { value: 'MONTSERRAT', label: 'Montserrat' },
  { value: 'GOT', label: 'Game of Thrones' },
  { value: 'FRAUNCES', label: 'Fraunces' },
];

// PINNED: blok kendi dikey aralığı boyunca scroll'da sabit kalır
// (position:sticky yaklaşımı) — tam Figma-tarzı serbest canvas'ta
// ScrollTrigger pin:true viewport'a göre çalıştığı için karmaşık olurdu,
// sticky pragmatik/yeterli bir yaklaşım.
export const ANIMATION_OPTIONS = [
  { value: 'FADE_UP', label: 'Fade up' },
  { value: 'FADE_LEFT', label: 'Slide from left' },
  { value: 'FADE_RIGHT', label: 'Slide from right' },
  { value: 'PINNED', label: 'Pinned' },
  { value: 'NONE', label: 'No animation' },
];

export function makeBlockKey() {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `k${Math.random()}`;
}

// Yeni blok varsayılan konumu — canvas'ın sol-üst bölgesinde başlar,
// z-sırası (dizi sırası) gereği en üstte durur; yazar sürükleyerek
// yerleştirir. height null = içeriğe göre otomatik (metin blokları için
// önerilen), IMAGE biraz daha yüksek bir kutuyla başlar.
export function createEmptyBlock(blockType, position) {
  const width = blockType === 'IMAGE' ? 60 : 70;
  return {
    _key: makeBlockKey(),
    blockType,
    text: '',
    imageUrl: null,
    imageAlt: '',
    x: position ? Math.min(Math.max(position.x - width / 2, 0), 100 - width) : 10,
    y: position ? Math.max(position.y, 0) : 10,
    width,
    height: blockType === 'IMAGE' ? 40 : null,
    animation: 'FADE_UP',
    fontFamily: null,
    fontScale: 1,
    dropCap: false,
  };
}

export function emptyDraft() {
  return {
    title: '',
    kicker: '',
    axis: '',
    imageUrl: null,
    imageAlt: '',
    status: 'DRAFT',
    format: null,
    spoilerFree: false,
    spoilerThroughSeasonNumber: null,
    spoilerThroughEpisodeNumber: null,
    recommendedRank: null,
    canvasHeight: 1200,
    tags: [],
    blocks: [],
  };
}

// BlogDetailResponse → düzenlenebilir taslak state'i. tags[] zaten ham
// BlogTagResponse şeklinde (subjectType/subjectId/seasonNumber/episodeNumber)
// geliyor — BlogPost.data.js'teki resolveTags() gibi bir dönüşüm burada
// YAPILMAZ, çünkü BlogTagRequest'in beklediği şekil zaten bu.
export function toEditableState(detail) {
  const sortedBlocks = (detail.blocks ?? []).slice().sort((a, b) => a.orderIndex - b.orderIndex);

  // canvasHeight null = eski (x/y/width/height geçişinden önceki) blog —
  // BlogPost.jsx'teki (görüntüleme) AYNI otomatik dizilim burada da
  // uygulanır ki editör açılışta ne görüyorsan (WYSIWYG) o olsun; kaydedince
  // bu hesaplanan değerler kalıcı yazılır ("tembel migration", bkz.
  // shared/blogBlockLayout.js).
  const layout =
    detail.canvasHeight == null ? applyFallbackCanvasLayout(sortedBlocks) : { canvasHeight: detail.canvasHeight, blocks: sortedBlocks };

  return {
    title: detail.title ?? '',
    kicker: detail.kicker ?? '',
    axis: detail.axis ?? '',
    imageUrl: detail.imageUrl ?? null,
    imageAlt: detail.imageAlt ?? '',
    status: detail.status ?? 'DRAFT',
    format: detail.format ?? null,
    spoilerFree: detail.spoilerFree ?? false,
    spoilerThroughSeasonNumber: detail.spoilerThrough?.seasonNumber ?? null,
    spoilerThroughEpisodeNumber: detail.spoilerThrough?.episodeNumber ?? null,
    recommendedRank: detail.recommendedRank ?? null,
    canvasHeight: layout.canvasHeight,
    tags: detail.tags ?? [],
    blocks: layout.blocks.map((block) => ({
      _key: makeBlockKey(),
      blockType: block.blockType,
      text: block.text ?? '',
      imageUrl: block.imageUrl ?? null,
      imageAlt: block.imageAlt ?? '',
      x: block.x,
      y: block.y,
      width: block.width,
      height: block.height ?? null,
      animation: block.animation ?? 'FADE_UP',
      fontFamily: block.fontFamily ?? null,
      fontScale: block.fontScale ?? 1,
      dropCap: block.dropCap ?? false,
    })),
  };
}

// Draft state → BlogRequest payload. _key client-only'dir, backend'e gitmez;
// imageUrlLarge şimdilik imageUrl ile AYNI tutulur (ayrı bir "büyük varyant"
// yükleme akışı v1 kapsamı dışında — bilerek basitleştirildi).
export function toBlogRequest(draft) {
  return {
    title: draft.title,
    kicker: draft.kicker,
    axis: draft.axis,
    imageUrl: draft.imageUrl,
    imageUrlLarge: draft.imageUrl,
    imageAlt: draft.imageAlt,
    spoilerThroughSeasonNumber: draft.spoilerThroughSeasonNumber,
    spoilerThroughEpisodeNumber: draft.spoilerThroughEpisodeNumber,
    recommendedRank: draft.recommendedRank,
    spoilerFree: draft.spoilerFree,
    status: draft.status,
    format: draft.format,
    canvasHeight: draft.canvasHeight,
    // Backend kuralı: bir Tag YA subjectType+subjectId YA DA SADECE
    // franchiseId taşıyabilir, ikisi birden OLAMAZ (400: "Tag ya
    // subjectType+subjectId ya da yalnızca franchiseId taşımalı"). GET
    // response'u ikisini birden döndürüyor (id de öyle, response-only) —
    // editörün tag arayüzü franchiseId'den habersiz (subjectType/subjectId
    // odaklı) olduğu için burada BİLEREK ayıklanır: subjectType+subjectId
    // doluysa franchiseId/id atılır, değilse (yeni/boş satır) olduğu gibi
    // gider.
    tags: draft.tags.map(({ id: _id, franchiseId, ...tag }) =>
      tag.subjectType && tag.subjectId != null ? tag : { ...tag, franchiseId }
    ),
    blocks: draft.blocks.map(({ _key, ...block }) => block),
  };
}

export async function loadBlogForEdit(id) {
  const detail = await fetchBlogById(id);
  return toEditableState(detail);
}

export async function saveBlog(id, draft) {
  const payload = toBlogRequest(draft);
  return id ? updateBlog(id, payload) : createBlog(payload);
}
