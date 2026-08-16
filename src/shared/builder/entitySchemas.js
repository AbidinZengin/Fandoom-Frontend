import { fetchBlogById, createBlog, updateBlog } from '../api/blogs';
import { fetchProductionById, fetchEpisodeDetail, createProduction, updateProduction, updateEpisode } from '../api/productions';
import { fetchCharacterById, createCharacter, updateCharacter } from '../api/characters';
import {
  fetchLoreCategory,
  fetchLoreLocation,
  fetchLoreGroup,
  fetchLoreEvent,
  updateLoreCategory,
  updateLoreLocation,
  updateLoreGroup,
  updateLoreEvent,
  createLoreCategoryGeneric,
  createLoreLocationGeneric,
  createLoreGroupGeneric,
  createLoreEventGeneric,
} from '../api/lore';

// Sabit şema haritası — PageBuilder Data sekmesinin "Değişken Bağlama"
// listesini besler. Canlı API introspection YAPILMAZ (kullanıcı kararı):
// her alan burada elle listelenir, gerçek backend yanıtlarına curl ile
// bakılarak doğrulandı (bkz. docs/plans PageBuilder binding planı).
//
// Sadece SKALER (string/number/boolean) alanlar bindable — dizi/nested
// obje döndüren alanlar (seasons[], episodeBlocks[], blocks[], genreIds[],
// producerIds[], Lore*'daki customFields — production'a göre şekli değişen
// stringify JSON) tek bir text/image DEĞİLDİR, buraya alınmadı.
const textFields = (...keys) => Object.fromEntries(keys.map((k) => [k, 'text']));
const imageFields = (...keys) => Object.fromEntries(keys.map((k) => [k, 'image']));

// series/movie response şekli neredeyse birebir aynı (ProductionResponse) —
// sadece tarih/süre alanları farklılaşır (series: firstAirDate/lastAirDate/
// status, movie: releaseDate/runtimeMinutes), ortak kısım burada paylaşılır.
// DİKKAT — *En ikiz kolonları YOK (canlı GET ile doğrulandı, 2026-08-16:
// i18n refactor'u henüz series/movie'ye uygulanmamış, sadece TR twin var —
// bkz. [[i18n-tr-en-mimari-karari]]).
const productionTextFields = [
  'title',
  'titleTr',
  'originalTitle',
  'slug',
  'synopsis',
  'synopsisTr',
  'trailerUrl',
  'contentRating',
  'originCountry',
  'originalLanguage',
  'externalRating',
  'externalVoteCount',
  'externalRatingUpdatedAt',
  'imdbId',
  'tmdbId',
  'franchiseId',
  'createdAt',
  'updatedAt',
];
const productionImageFields = ['posterUrl', 'coverImageUrl'];

export const ENTITY_SCHEMAS = {
  blog: {
    label: 'Blog',
    idLabel: 'Blog ID',
    fetch: (id) => fetchBlogById(id),
    // put/post: entityWriteback.js'in tükettiği generic yazma sözleşmesi.
    // DİKKAT — Blog'un PUT'u backend'de TAM gövde/replace-all (bkz.
    // updateBlog yorumu); entityWriteback sadece burada listelenen
    // `fields`+blockList alanlarını gönderir, bu listede OLMAYAN bir
    // BlogRequest alanı varsa (ör. bir association) PUT'ta sıfırlanabilir —
    // Blog write-back'i üretime almadan önce backend'in tam DTO şekliyle
    // karşılaştırılmalı.
    put: (id, fields) => updateBlog(id, fields),
    post: (fields) => createBlog(fields),
    // "Yeni Kayıt Oluştur" mini-formunun (EntityPicker.jsx) zorunlu alanları.
    createFields: ['title'],
    // slug backend'de PROJE GENELİNDE hiçbir zaman client-yazılabilir değil
    // (backend ekibi doğruladı, 2026-08-16) — bindable kalır (okuma/sürükleme)
    // ama PUT gövdesine asla yazılmaz.
    nonWritableFields: ['slug'],
    fields: {
      // DİKKAT — *En ikiz kolonları YOK (canlı GET ile doğrulandı, 2026-08-16
      // — bkz. productionTextFields'teki aynı not).
      ...textFields(
        'title',
        'titleTr',
        'slug',
        'kicker',
        'kickerTr',
        'axis',
        'axisTr',
        'imageAlt',
        'imageAltTr',
        'spoilerThroughSeasonNumber',
        'spoilerThroughEpisodeNumber',
        'recommendedRank',
        'spoilerFree',
        'status',
        'format',
        'publishedAt',
        'viewCount',
        'readingTimeMinutes',
        'canvasHeight'
      ),
      ...imageFields('imageUrl', 'imageUrlLarge'),
    },
    // blog.blocks[] — BlogEditor'ün kendi serbest-canvas içeriği (paragraf/
    // başlık/görsel block'ları). Skaler alanlardan AYRI bir bölüm olarak
    // listelenir (bkz. EntityPicker) — dizi uzunluğu/içeriği entity'ye göre
    // değiştiği için sabit şemaya girmez, resolve edilince DİNAMİK kurulur.
    blockList: {
      arrayField: 'blocks',
      labelField: 'blockType',
      fields: {
        ...textFields('text', 'textTr', 'textEn', 'imageAlt', 'imageAltTr', 'imageAltEn'),
        ...imageFields('imageUrl'),
      },
    },
  },
  series: {
    label: 'Series',
    idLabel: 'Series ID',
    fetch: (id) => fetchProductionById('series', id),
    put: (id, fields) => updateProduction('series', id, fields),
    post: (fields) => createProduction('series', fields),
    createFields: ['title'],
    nonWritableFields: ['slug'],
    fields: {
      ...textFields(...productionTextFields, 'firstAirDate', 'lastAirDate', 'status'),
      ...imageFields(...productionImageFields),
    },
  },
  movie: {
    label: 'Movie',
    idLabel: 'Movie ID',
    fetch: (id) => fetchProductionById('movie', id),
    put: (id, fields) => updateProduction('movie', id, fields),
    post: (fields) => createProduction('movie', fields),
    createFields: ['title'],
    nonWritableFields: ['slug'],
    fields: {
      ...textFields(...productionTextFields, 'releaseDate', 'runtimeMinutes'),
      ...imageFields(...productionImageFields),
    },
  },
  episode: {
    label: 'Episode',
    idLabel: 'Episode ID',
    fetch: (id) => fetchEpisodeDetail(id),
    // post YOK — backend ekibi "Movie/Series/Episode zaten tam CRUD'a
    // sahipti" dedi (2026-08-16) ama Episode'un create path'i (muhtemelen
    // bir season'a nested) doğrulanmadı — "Yeni Kayıt Oluştur" akışı
    // (parent'sız düz entity'ler için) bu belirsizlik netleşene kadar
    // Episode'u kapsamıyor.
    put: (id, fields) => updateEpisode(id, fields),
    // DİKKAT — Episode'da Series/Movie/Blog'daki gibi TR/EN ikiz kolon YOK,
    // sadece TR twin var (canlı GET /episodes/1 ile doğrulandı, 2026-08-16:
    // gerçek alanlar title/titleTr/synopsis/synopsisTr/storyKicker/
    // storyKickerTr/storyTitle/storyTitleTr/storyThesis/storyThesisTr —
    // *En alanları YOK, backend'in i18n refactor'u Episode'a henüz
    // uygulanmamış, bkz. [[i18n-tr-en-mimari-karari]]).
    fields: {
      // episodeNumber — EpisodeRequest'te @NotNull (canlı testte 400 ile
      // yakalandı, 2026-08-16); önceki alan listesinde hiç yoktu.
      ...textFields(
        'episodeNumber',
        'title',
        'titleTr',
        'synopsis',
        'synopsisTr',
        'airDate',
        'durationMinutes',
        'externalRating',
        'externalVoteCount',
        'externalRatingUpdatedAt',
        'imdbId',
        'tmdbId',
        'storyKicker',
        'storyKickerTr',
        'storyTitle',
        'storyTitleTr',
        'storyThesis',
        'storyThesisTr'
      ),
      ...imageFields('stillImageUrl'),
    },
    // episode.episodeBlocks[] — bölüm hikaye anlatımının sahne-sahne
    // block'ları (bkz. blog.blockList yorumu, aynı gerekçe).
    blockList: {
      arrayField: 'episodeBlocks',
      labelField: 'blockType',
      fields: {
        ...textFields('content', 'contentTr', 'contentEn', 'sceneKicker', 'sceneKickerTr', 'sceneKickerEn', 'mediaAlt', 'mediaAltTr', 'mediaAltEn'),
        ...imageFields('mediaUrl'),
      },
    },
  },
  character: {
    label: 'Character',
    idLabel: 'Character ID',
    fetch: (id) => fetchCharacterById(id),
    put: (id, fields) => updateCharacter(id, fields),
    post: (fields) => createCharacter(fields),
    // POST /api/characters generic (movie/series path'i yok) — subjectType/
    // subjectId gövdede hangi yapıma ait olduğunu belirtir (backend
    // ekibi ekledi, 2026-08-16).
    createFields: ['name', 'subjectType', 'subjectId'],
    nonWritableFields: ['slug'],
    fields: {
      ...textFields('name', 'slug', 'description', 'quote', 'subjectType', 'subjectId', 'billingOrder'),
      ...imageFields('imageUrl'),
    },
  },
  loreCategory: {
    label: 'Lore Category',
    idLabel: 'Lore Category ID',
    fetch: (id) => fetchLoreCategory(id),
    // Generic (production-nested olmayan) POST /api/lore/categories —
    // backend ekibi ekledi (2026-08-16), gövdede subjectType/subjectId var.
    put: (id, fields) => updateLoreCategory(id, fields),
    post: (fields) => createLoreCategoryGeneric(fields),
    createFields: ['name', 'subjectType', 'subjectId'],
    nonWritableFields: ['slug'],
    fields: textFields('name', 'slug', 'subjectType', 'subjectId'),
  },
  loreLocation: {
    label: 'Lore Location',
    idLabel: 'Lore Location ID',
    fetch: (id) => fetchLoreLocation(id),
    put: (id, fields) => updateLoreLocation(id, fields),
    post: (fields) => createLoreLocationGeneric(fields),
    createFields: ['name', 'subjectType', 'subjectId'],
    nonWritableFields: ['slug'],
    fields: {
      ...textFields('name', 'slug', 'description', 'subjectType', 'subjectId'),
      ...imageFields('imageUrl'),
    },
  },
  loreGroup: {
    label: 'Lore Group',
    idLabel: 'Lore Group ID',
    fetch: (id) => fetchLoreGroup(id),
    put: (id, fields) => updateLoreGroup(id, fields),
    // categoryId zaten hangi subject'e ait olduğunu belirlediği için
    // create'de ayrı subjectType/subjectId gerekmiyor (backend notu).
    post: (fields) => createLoreGroupGeneric(fields),
    createFields: ['name', 'categoryId'],
    // categoryName/categorySlug categoryId'den backend'de resolve edilir —
    // okumak için bindable ama PUT gövdesine YAZILMAZ (bkz. entityWriteback.js).
    // slug de proje genelinde client-yazılabilir değil (bkz. blog notu).
    nonWritableFields: ['categoryName', 'categorySlug', 'slug'],
    fields: {
      ...textFields('name', 'slug', 'categoryId', 'categoryName', 'categorySlug', 'subjectType', 'subjectId'),
      ...imageFields('imageUrl'),
    },
  },
  loreEvent: {
    label: 'Lore Event',
    idLabel: 'Lore Event ID',
    fetch: (id) => fetchLoreEvent(id),
    put: (id, fields) => updateLoreEvent(id, fields),
    post: (fields) => createLoreEventGeneric(fields),
    createFields: ['name', 'subjectType', 'subjectId'],
    // locationName/locationSlug locationId'den resolve edilir (bkz. loreGroup notu).
    nonWritableFields: ['locationName', 'locationSlug'],
    fields: {
      ...textFields(
        'name',
        'description',
        'orderIndex',
        'subjectType',
        'subjectId',
        'locationId',
        'locationName',
        'locationSlug',
        'pinned'
      ),
      ...imageFields('imageUrl'),
    },
  },
};
