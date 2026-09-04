import { createBlog, fetchBlogById, updateBlog } from '../../../shared/api/blogs';

export const BLOCK_TYPES = [
  'LEDE_TEXT',
  'SECTION_HEADING',
  'SECTION_TEXT',
  'SECTION_LEAD_TEXT',
  'IMAGE',
  'QUOTE',
  'VERDICT_TEXT'
];

export const BLOCK_TYPE_LABELS = {
  LEDE_TEXT: 'Lede Text',
  SECTION_HEADING: 'Section Heading',
  SECTION_TEXT: 'Section Text',
  SECTION_LEAD_TEXT: 'Section Lead Text',
  IMAGE: 'Image',
  QUOTE: 'Quote',
  VERDICT_TEXT: 'Verdict Text'
};

export const STATUS_OPTIONS = ['DRAFT', 'PUBLISHED'];

export const FORMAT_OPTIONS = [
  'REVIEW',
  'RECAP',
  'ANALYSIS',
  'RANKING',
  'INTERVIEW',
  'BEHIND_THE_SCENES',
  'CHARACTER',
];

export function makeBlockKey() {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `k${Math.random()}`;
}

export function createEmptyBlock(blockType = 'SECTION_TEXT') {
  return {
    _key: makeBlockKey(),
    blockType,
    sceneKey: `scene-${Math.floor(Math.random() * 10000)}`,
    content: '',
    contentTr: '',
    imageUrl: null,
    imageAlt: '',
    imageAltTr: '',
  };
}

export function emptyDraft() {
  return {
    title: '',
    titleTr: '',
    kicker: '',
    kickerTr: '',
    axis: '',
    axisTr: '',
    imageUrl: null,
    imageUrlLarge: null,
    imageAlt: '',
    imageAltTr: '',
    status: 'DRAFT',
    format: null,
    spoilerThroughSeasonNumber: null,
    spoilerThroughEpisodeNumber: null,
    recommendedRank: null,
    tags: [],
    blocks: [],
  };
}

export function toEditableState(detail) {
  const sortedBlocks = (detail.blocks ?? []).slice().sort((a, b) => a.orderIndex - b.orderIndex);

  return {
    title: detail.title ?? '',
    titleTr: detail.titleTr ?? '',
    kicker: detail.kicker ?? '',
    kickerTr: detail.kickerTr ?? '',
    axis: detail.axis ?? '',
    axisTr: detail.axisTr ?? '',
    imageUrl: detail.imageUrl ?? null,
    imageUrlLarge: detail.imageUrlLarge ?? null,
    imageAlt: detail.imageAlt ?? '',
    imageAltTr: detail.imageAltTr ?? '',
    status: detail.status ?? 'DRAFT',
    format: detail.format ?? null,
    spoilerThroughSeasonNumber: detail.spoilerThrough?.seasonNumber ?? null,
    spoilerThroughEpisodeNumber: detail.spoilerThrough?.episodeNumber ?? null,
    recommendedRank: detail.recommendedRank ?? null,
    tags: detail.tags ?? [],
    blocks: sortedBlocks.map((block) => ({
      _key: makeBlockKey(),
      blockType: block.blockType ?? 'SECTION_TEXT',
      sceneKey: block.sceneKey ?? `scene-${Math.floor(Math.random() * 10000)}`,
      content: block.content ?? '',
      contentTr: block.contentTr ?? '',
      imageUrl: block.imageUrl ?? null,
      imageAlt: block.imageAlt ?? '',
      imageAltTr: block.imageAltTr ?? '',
    })),
  };
}

export function toBlogRequest(draft) {
  return {
    title: draft.title,
    titleTr: draft.titleTr,
    kicker: draft.kicker,
    kickerTr: draft.kickerTr,
    axis: draft.axis,
    axisTr: draft.axisTr,
    imageUrl: draft.imageUrl,
    imageUrlLarge: draft.imageUrlLarge || draft.imageUrl,
    imageAlt: draft.imageAlt,
    imageAltTr: draft.imageAltTr,
    spoilerThroughSeasonNumber: draft.spoilerThroughSeasonNumber,
    spoilerThroughEpisodeNumber: draft.spoilerThroughEpisodeNumber,
    recommendedRank: draft.recommendedRank,
    spoilerFree: draft.spoilerThroughSeasonNumber == null,
    status: draft.status,
    format: draft.format,
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
