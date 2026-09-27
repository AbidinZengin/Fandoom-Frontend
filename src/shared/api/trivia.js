import { apiClient } from './client';

// GET /api/trivia?itemId=&itemType= — public. Yanıt { data: [...] } zarfıdır;
// kayıt yoksa (ya da yapım id'si olmayan bir id ise) boş dizi döner, hata değil.
// Öğe: { id, itemId, itemType, title, content, imageUrl, tag, tags[],
// isSpoiler, sourceUrl }. title/content Accept-Language'e göre çözülür.
// tags[] değerleri trivia_tag tablosundaki KODLARdır (kapalı küme); hazır
// kodlar: BEHIND_THE_SCENES, EASTER_EGG, CASTING, GOOF, LORE. Tanımadığın kod
// için varsayılan ikon göster.
export async function fetchTrivia({ itemId, itemType, limit } = {}) {
  const params = new URLSearchParams({ itemId, itemType });
  if (limit) params.set('limit', limit);
  const res = await apiClient.get(`/trivia?${params}`);
  return res?.data ?? [];
}

// GET /api/trivia/tags — public, etiket tablosu. Yanıt { data: [...] } zarfı;
// öğe: { id, code, label, labelEn, labelTr }. `label` Accept-Language'e göre
// çözülür; kayıtlardaki tags[] bu code'lara eşlenir.
export async function fetchTriviaTags() {
  const res = await apiClient.get('/trivia/tags');
  return res?.data ?? [];
}
