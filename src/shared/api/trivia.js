import { apiClient } from './client';

// GET /api/trivia?itemId=&itemType= — public. Yanıt { data: [...] } zarfıdır;
// kayıt yoksa (ya da yapım id'si olmayan bir id ise) boş dizi döner, hata değil.
// Öğe: { id, itemId, itemType, title, content, imageUrl, tag, tags[],
// isSpoiler, sourceUrl }. title/content Accept-Language'e göre çözülür.
// tags[] hazır değerler: BEHIND_THE_SCENES, EASTER_EGG, CASTING, GOOF, LORE —
// ya da serbest metin (tanımadığın etiket için varsayılan ikon göster).
export async function fetchTrivia({ itemId, itemType, limit } = {}) {
  const params = new URLSearchParams({ itemId, itemType });
  if (limit) params.set('limit', limit);
  const res = await apiClient.get(`/trivia?${params}`);
  return res?.data ?? [];
}
