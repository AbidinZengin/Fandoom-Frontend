import { apiClient } from '../../shared/api/client';

// Admin varlık kayıt defteri — her varlık TEK tanım: API yolu, istek gövdesinde
// gönderilen anahtarlar, yeni kayıt varsayılanları, gruplu form alanları ve
// liste satırı eşlemesi. Liste ve form bu tanımdan çizilir.
//
// Alanlar:
//   topLevel   : /admin/{key} altında kendi listesi var (series, movies)
//   nested     : ebeveyn altı URL parçası ({parent.path}/{id}/{nested})
//   children   : düzenleme sayfasında sekme olarak açılan alt varlıklar
//   deletable  : silme butonu (yapımlarda KAPALI: dizi/film silmek sezon,
//                bölüm, karakter vb. her şeyi siler; Faz C'de taslak akışı gelecek)
//   requestKeys: PUT/POST gövdesine giren TÜM alanlar (backend *Request DTO'su).
//     Formda düzenlenmeyenler (genreIds, externalRating…) yüklenen kayıttan
//     AYNEN geri gönderilir, gönderilmezse backend'de silinebilirler. İç içe
//     blok listeleri (seasonBlocks/episodeBlocks) bilerek BURADA YOK: bunlar
//     `type: 'blocks'` alanıdır ve gövdeye YALNIZ değiştiyse girer (backend
//     null/eksik listeyi "mevcut blokları koru" sayar, dolu listeyi yeniden yazar).
//   api        : standart dışı uçlar için ezme (bkz. entities.api.js)
//
// Alan tipleri: text | textarea | number | date | select | image | boolean |
// multiselect (`loadOptions()`, `maxItems`) | blocks (`types`, `itemFields`) | relation (`loadOptions(parent)`,
// ebeveynin kayıtlarından seçim) | json (ham JSON string, kaydetmeden önce doğrulanır).

const t = (key, label, extra = {}) => ({ key, label, type: 'text', ...extra });

const SERIES_STATUS_LABEL = { ONGOING: 'Devam ediyor', ENDED: 'Bitti', CANCELLED: 'İptal' };
const MOVIE_STATUS_LABEL = {
  ANNOUNCED: 'Duyuruldu',
  FILMING: 'Çekimde',
  POST_PRODUCTION: 'Post prodüksiyon',
  RELEASED: 'Gösterimde',
  CANCELLED: 'İptal',
};

const imageFields = [
  { key: 'posterUrl', label: 'Poster', type: 'image', max: 500 },
  { key: 'coverImageUrl', label: 'Kapak görseli', type: 'image', max: 500 },
];

const identityFields = [
  t('title', 'Başlık (EN)', { required: true, max: 255 }),
  t('titleTr', 'Başlık (TR)', { max: 255 }),
  t('originalTitle', 'Orijinal başlık', { max: 255 }),
];

const synopsisFields = [
  { key: 'synopsis', label: 'Özet (EN)', type: 'textarea', max: 5000, wide: true },
  { key: 'synopsisTr', label: 'Özet (TR)', type: 'textarea', max: 5000, wide: true },
];

const metaFields = [
  t('contentRating', 'Yaş sınırı', { max: 10 }),
  t('originCountry', 'Ülke kodu', { max: 2, hint: 'ör. US' }),
  t('originalLanguage', 'Dil kodu', { max: 2, hint: 'ör. en' }),
];

const linkFields = [
  t('trailerUrl', 'Fragman URL', { max: 500 }),
  t('imdbId', 'IMDb ID', { max: 15 }),
  { key: 'tmdbId', label: 'TMDb ID', type: 'number' },
  { key: 'franchiseId', label: 'Franchise ID', type: 'number' },
];

const sharedRequestKeys = [
  'titleTr', 'title', 'originalTitle', 'synopsisTr', 'synopsis', 'posterUrl',
  'coverImageUrl', 'trailerUrl', 'contentRating', 'originCountry',
  'originalLanguage', 'externalRating', 'externalVoteCount',
  'externalRatingUpdatedAt', 'imdbId', 'tmdbId', 'franchiseId', 'genreIds',
  'producerIds',
];

// Trivia backend'de ebeveyne query ile bağlanır (itemId + itemType), id ile
// tek kayıt GET'i yok, yalnız liste. itemType küçük harf ('series' | 'movie').
const TRIVIA_ITEM_TYPE = { series: 'series', movies: 'movie' };
const triviaList = async (parent) => {
  const type = TRIVIA_ITEM_TYPE[parent.entity.key];
  const res = await apiClient.get(`/trivia?itemId=${parent.id}&itemType=${type}`);
  return res?.data ?? [];
};

let triviaTagOptions = null;
const loadTriviaTags = () => {
  triviaTagOptions ??= apiClient.get('/trivia/tags').then((res) =>
    (res?.data ?? []).map((tag) => ({ value: tag.code, label: tag.labelTr || tag.label })),
  );
  return triviaTagOptions;
};

// Lore kayıtları ebeveyne (dizi/film) bağlı; ilişki alanları (grup → kategori,
// olay → mekan) aynı ebeveynin kayıtlarından seçenek yükler.
const loreOptions = (kind) => async (parent) => {
  const list = await apiClient.get(`${parent.entity.path}/${parent.id}/lore/${kind}`);
  return (Array.isArray(list) ? list : []).map((item) => ({ value: item.id, label: item.name }));
};

// İç içe blok alanı tanımları (sezon/bölüm blokları). `types`: blok türleri,
// `newItem(type)`: yeni blok varsayılanı, `itemFields`: blokta düzenlenenler.
const isMedia = (item) => item.blockType === 'MEDIA';
const notMedia = (item) => item.blockType !== 'MEDIA';
const sceneKeyField = { key: 'sceneKey', label: 'Scene key', type: 'text', required: true, max: 100 };
const newSceneKey = () => `scene-${Math.floor(Math.random() * 10000)}`;

const seasonBlocksField = {
  key: 'seasonBlocks',
  label: 'Sezon blokları',
  type: 'blocks',
  typeKey: 'blockType',
  types: [
    { value: 'LEDE_TEXT', label: 'Giriş metni' },
    { value: 'SECTION_HEADING', label: 'Bölüm başlığı' },
    { value: 'SECTION_TEXT', label: 'Bölüm metni' },
    { value: 'SECTION_LEAD_TEXT', label: 'Bölüm giriş metni' },
    { value: 'MEDIA', label: 'Görsel' },
    { value: 'QUOTE', label: 'Alıntı' },
    { value: 'VERDICT_TEXT', label: 'Karar metni' },
  ],
  newItem: () => ({ sceneKey: newSceneKey(), content: '', contentTr: '' }),
  itemFields: [
    sceneKeyField,
    { key: 'content', label: 'İçerik (EN)', type: 'textarea', wide: true, when: notMedia },
    { key: 'contentTr', label: 'İçerik (TR)', type: 'textarea', wide: true, when: notMedia },
    { key: 'mediaEpisodeRef', label: 'Bölüm no (görsel için)', type: 'number', when: isMedia },
    { key: 'mediaCaption', label: 'Alt yazı (EN)', type: 'text', max: 255, when: isMedia },
    { key: 'mediaCaptionTr', label: 'Alt yazı (TR)', type: 'text', max: 255, when: isMedia },
    { key: 'mediaCredit', label: 'Kaynak', type: 'text', max: 255, when: isMedia },
  ],
};

const episodeBlocksField = {
  key: 'episodeBlocks',
  label: 'Bölüm blokları',
  type: 'blocks',
  typeKey: 'blockType',
  types: [
    { value: 'TITLE', label: 'Başlık' },
    { value: 'LEAD_TEXT', label: 'Giriş metni' },
    { value: 'TEXT', label: 'Metin' },
    { value: 'QUOTE', label: 'Alıntı' },
    { value: 'MEDIA', label: 'Görsel' },
  ],
  newItem: () => ({ sceneKey: newSceneKey(), pinned: false, tone: null, content: '', contentTr: '' }),
  itemFields: [
    sceneKeyField,
    {
      key: 'tone',
      label: 'Ton',
      type: 'select',
      options: [
        { value: 'DEEP', label: 'Koyu' },
        { value: 'SOFT', label: 'Yumuşak' },
      ],
    },
    { key: 'pinned', label: 'Sabitle', type: 'boolean' },
    { key: 'sceneKicker', label: 'Sahne üst başlığı (EN)', type: 'text', max: 255 },
    { key: 'sceneKickerTr', label: 'Sahne üst başlığı (TR)', type: 'text', max: 255 },
    { key: 'content', label: 'İçerik (EN)', type: 'textarea', wide: true, when: notMedia },
    { key: 'contentTr', label: 'İçerik (TR)', type: 'textarea', wide: true, when: notMedia },
    { key: 'mediaUrl', label: 'Görsel', type: 'image', max: 500, when: isMedia },
    { key: 'mediaAlt', label: 'Alt metin (EN)', type: 'text', max: 255, when: isMedia },
    { key: 'mediaAltTr', label: 'Alt metin (TR)', type: 'text', max: 255, when: isMedia },
    { key: 'mediaRatio', label: 'Görsel oranı', type: 'text', max: 20, hint: 'ör. 16/9', when: isMedia },
  ],
};

export const ENTITIES = {
  series: {
    key: 'series',
    path: '/series',
    topLevel: true,
    label: 'Diziler',
    singular: 'Dizi',
    children: ['seasons', 'characters', 'trivia', 'lore-categories', 'lore-groups', 'lore-locations', 'lore-events'],
    requestKeys: [...sharedRequestKeys, 'firstAirDate', 'lastAirDate', 'status'],
    defaults: { status: 'ONGOING', genreIds: [], producerIds: [] },
    row: (item) => ({
      image: item.posterUrl,
      title: item.title,
      meta: [item.firstAirDate?.slice(0, 4), SERIES_STATUS_LABEL[item.status]].filter(Boolean).join(' · '),
    }),
    groups: [
      { title: 'Kimlik', fields: identityFields },
      { title: 'Görseller', fields: imageFields },
      { title: 'Özet', fields: synopsisFields, wide: true },
      {
        title: 'Yayın bilgisi',
        fields: [
          {
            key: 'status',
            label: 'Durum',
            type: 'select',
            required: true,
            options: [
              { value: 'ONGOING', label: 'Devam ediyor' },
              { value: 'ENDED', label: 'Bitti' },
              { value: 'CANCELLED', label: 'İptal edildi' },
            ],
          },
          { key: 'firstAirDate', label: 'İlk yayın', type: 'date' },
          { key: 'lastAirDate', label: 'Son yayın', type: 'date' },
          ...metaFields,
        ],
      },
      { title: 'Bağlantılar', fields: linkFields },
    ],
  },

  movies: {
    key: 'movies',
    path: '/movies',
    topLevel: true,
    label: 'Filmler',
    singular: 'Film',
    children: ['characters', 'trivia', 'lore-categories', 'lore-groups', 'lore-locations', 'lore-events'],
    requestKeys: [
      ...sharedRequestKeys, 'taglineTr', 'tagline', 'status', 'budget', 'boxOffice',
      'releaseDate', 'runtimeMinutes', 'directorIds', 'writerIds',
    ],
    defaults: { genreIds: [], producerIds: [], directorIds: [], writerIds: [] },
    row: (item) => ({
      image: item.posterUrl,
      title: item.title,
      meta: [item.releaseDate?.slice(0, 4), MOVIE_STATUS_LABEL[item.status]].filter(Boolean).join(' · '),
    }),
    groups: [
      { title: 'Kimlik', fields: [...identityFields, t('tagline', 'Slogan (EN)', { max: 500 }), t('taglineTr', 'Slogan (TR)', { max: 500 })] },
      { title: 'Görseller', fields: imageFields },
      { title: 'Özet', fields: synopsisFields, wide: true },
      {
        title: 'Yayın bilgisi',
        fields: [
          {
            key: 'status',
            label: 'Durum',
            type: 'select',
            options: [
              { value: 'ANNOUNCED', label: 'Duyuruldu' },
              { value: 'FILMING', label: 'Çekimde' },
              { value: 'POST_PRODUCTION', label: 'Post prodüksiyon' },
              { value: 'RELEASED', label: 'Gösterimde' },
              { value: 'CANCELLED', label: 'İptal edildi' },
            ],
          },
          { key: 'releaseDate', label: 'Çıkış tarihi', type: 'date' },
          { key: 'runtimeMinutes', label: 'Süre (dk)', type: 'number' },
          { key: 'budget', label: 'Bütçe', type: 'number' },
          { key: 'boxOffice', label: 'Hasılat', type: 'number' },
          ...metaFields,
        ],
      },
      { title: 'Bağlantılar', fields: linkFields },
    ],
  },

  seasons: {
    key: 'seasons',
    path: '/seasons',
    nested: 'seasons',
    label: 'Sezonlar',
    singular: 'Sezon',
    deletable: true,
    children: ['episodes'],
    requestKeys: [
      'seasonNumber', 'titleTr', 'title', 'airDate', 'posterUrl', 'storyKickerTr',
      'storyKicker', 'storyTitleTr', 'storyTitle', 'storyDekTr', 'storyDek',
    ],
    defaults: {},
    titleOf: (d) => d.title || (d.seasonNumber ? `Sezon ${d.seasonNumber}` : ''),
    row: (item) => ({
      image: item.posterUrl,
      title: item.title || `Sezon ${item.seasonNumber}`,
      meta: item.airDate?.slice(0, 4),
    }),
    groups: [
      {
        title: 'Kimlik',
        fields: [
          { key: 'seasonNumber', label: 'Sezon no', type: 'number', required: true },
          t('title', 'Başlık (EN)', { max: 255 }),
          t('titleTr', 'Başlık (TR)', { max: 255 }),
          { key: 'airDate', label: 'Yayın tarihi', type: 'date' },
        ],
      },
      { title: 'Görsel', fields: [{ key: 'posterUrl', label: 'Poster', type: 'image', max: 500 }] },
      {
        title: 'Hikâye (sezon sayfası başlığı)',
        wide: true,
        fields: [
          t('storyKicker', 'Üst başlık (EN)', { max: 255 }),
          t('storyKickerTr', 'Üst başlık (TR)', { max: 255 }),
          t('storyTitle', 'Başlık (EN)', { max: 255 }),
          t('storyTitleTr', 'Başlık (TR)', { max: 255 }),
          { key: 'storyDek', label: 'Açıklama (EN)', type: 'textarea', wide: true },
          { key: 'storyDekTr', label: 'Açıklama (TR)', type: 'textarea', wide: true },
        ],
      },
      { title: 'Sezon blokları', wide: true, fields: [seasonBlocksField] },
    ],
  },

  episodes: {
    key: 'episodes',
    path: '/episodes',
    nested: 'episodes',
    label: 'Bölümler',
    singular: 'Bölüm',
    deletable: true,
    requestKeys: [
      'episodeNumber', 'titleTr', 'title', 'synopsisTr', 'synopsis', 'airDate',
      'durationMinutes', 'stillImageUrl', 'externalRating', 'externalVoteCount',
      'externalRatingUpdatedAt', 'imdbId', 'tmdbId', 'storyTitleTr', 'storyTitle',
    ],
    defaults: {},
    titleOf: (d) => d.title || (d.episodeNumber ? `Bölüm ${d.episodeNumber}` : ''),
    row: (item) => ({
      image: item.stillImageUrl,
      title: `${item.episodeNumber}. ${item.title}`,
      meta: item.airDate?.slice(0, 4),
    }),
    groups: [
      {
        title: 'Kimlik',
        fields: [
          { key: 'episodeNumber', label: 'Bölüm no', type: 'number', required: true },
          t('title', 'Başlık (EN)', { required: true, max: 255 }),
          t('titleTr', 'Başlık (TR)', { max: 255 }),
          { key: 'airDate', label: 'Yayın tarihi', type: 'date' },
          { key: 'durationMinutes', label: 'Süre (dk)', type: 'number' },
        ],
      },
      { title: 'Görsel', fields: [{ key: 'stillImageUrl', label: 'Sahne görseli', type: 'image', max: 500 }] },
      { title: 'Özet', wide: true, fields: synopsisFields },
      {
        title: 'Hikâye başlığı',
        fields: [t('storyTitle', 'Başlık (EN)', { max: 255 }), t('storyTitleTr', 'Başlık (TR)', { max: 255 })],
      },
      {
        title: 'Bağlantılar',
        fields: [t('imdbId', 'IMDb ID', { max: 15 }), { key: 'tmdbId', label: 'TMDb ID', type: 'number' }],
      },
      { title: 'Bölüm blokları', wide: true, fields: [episodeBlocksField] },
    ],
  },

  characters: {
    key: 'characters',
    path: '/characters',
    nested: 'characters',
    label: 'Karakterler',
    singular: 'Karakter',
    deletable: true,
    titleKey: 'name',
    requestKeys: ['name', 'descriptionTr', 'description', 'quote', 'imageUrl', 'billingOrder'],
    defaults: {},
    row: (item) => ({
      image: item.imageUrl,
      title: item.name,
      meta: item.billingOrder ? `#${item.billingOrder}` : '',
    }),
    groups: [
      {
        title: 'Kimlik',
        fields: [
          t('name', 'Ad', { required: true, max: 150 }),
          { key: 'billingOrder', label: 'Sıra', type: 'number' },
          t('quote', 'Replik', { max: 500, wide: true }),
        ],
      },
      { title: 'Görsel', fields: [{ key: 'imageUrl', label: 'Görsel', type: 'image', max: 500 }] },
      {
        title: 'Açıklama',
        wide: true,
        fields: [
          { key: 'description', label: 'Açıklama (EN)', type: 'textarea', max: 5000, wide: true },
          { key: 'descriptionTr', label: 'Açıklama (TR)', type: 'textarea', max: 5000, wide: true },
        ],
      },
    ],
  },

  trivia: {
    key: 'trivia',
    path: '/trivia',
    label: 'Trivia',
    singular: 'Trivia',
    deletable: true,
    requestKeys: [
      'itemId', 'itemType', 'title', 'titleTr', 'content', 'contentTr', 'imageUrl',
      'tags', 'isSpoiler', 'sourceUrl',
    ],
    defaults: { tags: [], isSpoiler: false },
    titleOf: (d) => d.title || d.content?.slice(0, 60) || '',
    api: {
      list: triviaList,
      get: async (id, parent) => (await triviaList(parent)).find((item) => String(item.id) === String(id)),
      create: (body, parent) =>
        apiClient.post('/trivia', {
          ...body,
          itemId: Number(parent.id),
          itemType: TRIVIA_ITEM_TYPE[parent.entity.key],
        }),
      update: (id, body) => apiClient.put(`/trivia/${id}`, body),
      remove: (id) => apiClient.delete(`/trivia/${id}`),
    },
    row: (item) => ({
      image: item.imageUrl,
      title: item.title || item.content,
      meta: (item.tags ?? []).join(' · '),
    }),
    groups: [
      {
        title: 'Başlık',
        fields: [t('title', 'Başlık (EN)', { max: 255 }), t('titleTr', 'Başlık (TR)', { max: 255 })],
      },
      { title: 'Görsel', fields: [{ key: 'imageUrl', label: 'Görsel', type: 'image', max: 500 }] },
      {
        title: 'İçerik',
        wide: true,
        fields: [
          { key: 'content', label: 'İçerik (EN)', type: 'textarea', required: true, max: 2000, wide: true },
          { key: 'contentTr', label: 'İçerik (TR)', type: 'textarea', max: 2000, wide: true },
        ],
      },
      {
        title: 'Etiketler ve kaynak',
        wide: true,
        fields: [
          {
            key: 'tags',
            label: 'Etiketler (en fazla 5)',
            type: 'multiselect',
            maxItems: 5,
            loadOptions: loadTriviaTags,
          },
          { key: 'isSpoiler', label: 'Spoiler içerir', type: 'boolean' },
          t('sourceUrl', 'Kaynak URL', { max: 500, hint: 'http(s):// ile başlamalı' }),
        ],
      },
    ],
  },

  'lore-categories': {
    key: 'lore-categories',
    path: '/lore/categories',
    nested: 'lore/categories',
    label: 'Lore kategorileri',
    singular: 'Kategori',
    deletable: true,
    titleKey: 'name',
    requestKeys: ['name'],
    defaults: {},
    row: (item) => ({ title: item.name }),
    groups: [{ title: 'Kategori', fields: [t('name', 'Ad', { required: true, max: 150 })] }],
  },

  'lore-groups': {
    key: 'lore-groups',
    path: '/lore/groups',
    nested: 'lore/groups',
    label: 'Lore grupları',
    singular: 'Grup',
    deletable: true,
    titleKey: 'name',
    requestKeys: ['name', 'imageUrl', 'categoryId', 'customFields'],
    defaults: {},
    row: (item) => ({ image: item.imageUrl, title: item.name, meta: item.categoryName }),
    groups: [
      {
        title: 'Grup',
        fields: [
          t('name', 'Ad', { required: true, max: 150 }),
          {
            key: 'categoryId',
            label: 'Kategori',
            type: 'relation',
            required: true,
            loadOptions: loreOptions('categories'),
            hint: 'Önce bir kategori oluşturulmalı',
          },
        ],
      },
      { title: 'Görsel', fields: [{ key: 'imageUrl', label: 'Görsel', type: 'image', max: 500 }] },
      {
        title: 'Özel alanlar',
        wide: true,
        fields: [{ key: 'customFields', label: 'customFields (JSON)', type: 'json', max: 10000 }],
      },
    ],
  },

  'lore-locations': {
    key: 'lore-locations',
    path: '/lore/locations',
    nested: 'lore/locations',
    label: 'Mekanlar',
    singular: 'Mekan',
    deletable: true,
    titleKey: 'name',
    requestKeys: ['name', 'imageUrl', 'description', 'customFields'],
    defaults: {},
    row: (item) => ({ image: item.imageUrl, title: item.name }),
    groups: [
      { title: 'Mekan', fields: [t('name', 'Ad', { required: true, max: 150 })] },
      { title: 'Görsel', fields: [{ key: 'imageUrl', label: 'Görsel', type: 'image', max: 500 }] },
      {
        title: 'Açıklama',
        wide: true,
        fields: [
          { key: 'description', label: 'Açıklama', type: 'textarea', max: 5000, wide: true },
          { key: 'customFields', label: 'customFields (JSON)', type: 'json', max: 10000 },
        ],
      },
    ],
  },

  'lore-events': {
    key: 'lore-events',
    path: '/lore/events',
    nested: 'lore/events',
    label: 'Olaylar',
    singular: 'Olay',
    deletable: true,
    titleKey: 'name',
    requestKeys: ['name', 'description', 'orderIndex', 'imageUrl', 'locationId', 'pinned', 'customFields'],
    defaults: { pinned: false },
    row: (item) => ({
      image: item.imageUrl,
      title: item.name,
      meta: [item.orderIndex != null ? `#${item.orderIndex}` : null, item.locationName].filter(Boolean).join(' · '),
    }),
    groups: [
      {
        title: 'Olay',
        fields: [
          t('name', 'Ad', { required: true, max: 150 }),
          { key: 'orderIndex', label: 'Sıra', type: 'number', required: true },
          { key: 'locationId', label: 'Mekan', type: 'relation', loadOptions: loreOptions('locations') },
          { key: 'pinned', label: 'Sabitle', type: 'boolean' },
        ],
      },
      { title: 'Görsel', fields: [{ key: 'imageUrl', label: 'Görsel', type: 'image', max: 500 }] },
      {
        title: 'Açıklama',
        wide: true,
        fields: [
          { key: 'description', label: 'Açıklama', type: 'textarea', wide: true },
          { key: 'customFields', label: 'customFields (JSON)', type: 'json', max: 10000 },
        ],
      },
    ],
  },
};
