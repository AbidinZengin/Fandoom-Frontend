// Breaking Bad "Trivia" bölümünün veri kaynağı, GET /api/trivia (public).
// Yapımın varlığını doğrulamaz: kayıt yoksa boş dizi döner ve bölüm basılmaz.
import { fetchTrivia, fetchTriviaTags } from '../../../../shared/api/trivia';

export function getSeriesTrivia(seriesId) {
  return fetchTrivia({ itemId: seriesId, itemType: 'series' });
}

// Etiket kodu → görünen ad (GET /api/trivia/tags, dile göre çözülmüş `label`).
export async function getTriviaTagLabels() {
  const tags = await fetchTriviaTags();
  return Object.fromEntries(tags.map((tag) => [tag.code, tag.label]));
}
