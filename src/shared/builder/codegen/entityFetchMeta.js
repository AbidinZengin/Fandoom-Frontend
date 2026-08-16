// PageBuilder'ın 9 entity tipinin HER biri için var olan fetch fonksiyonunu
// sarar — entitySchemas.js'teki `fetch` closure'larıyla AYNI eşleme, ama
// string-üretimi için (import adı/yolu/çağrı ifadesi) düz veri olarak
// burada AYRICA tutulur (closure'dan fonksiyon adı çıkarılamaz — kod
// ÜRETİMİ yapıyoruz, closure ÇALIŞTIRMIYORUZ).
export const ENTITY_FETCH_META = {
  blog: { importName: 'fetchBlogById', module: 'shared/api/blogs', call: (id) => `fetchBlogById(${id})` },
  series: { importName: 'fetchProductionById', module: 'shared/api/productions', call: (id) => `fetchProductionById('series', ${id})` },
  movie: { importName: 'fetchProductionById', module: 'shared/api/productions', call: (id) => `fetchProductionById('movie', ${id})` },
  episode: { importName: 'fetchEpisodeDetail', module: 'shared/api/productions', call: (id) => `fetchEpisodeDetail(${id})` },
  character: { importName: 'fetchCharacterById', module: 'shared/api/characters', call: (id) => `fetchCharacterById(${id})` },
  loreCategory: { importName: 'fetchLoreCategory', module: 'shared/api/lore', call: (id) => `fetchLoreCategory(${id})` },
  loreLocation: { importName: 'fetchLoreLocation', module: 'shared/api/lore', call: (id) => `fetchLoreLocation(${id})` },
  loreGroup: { importName: 'fetchLoreGroup', module: 'shared/api/lore', call: (id) => `fetchLoreGroup(${id})` },
  loreEvent: { importName: 'fetchLoreEvent', module: 'shared/api/lore', call: (id) => `fetchLoreEvent(${id})` },
};
