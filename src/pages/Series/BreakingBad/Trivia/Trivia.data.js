// Breaking Bad "Trivia" bölümünün veri kaynağı — GET /api/trivia (public).
// Yapımın varlığını doğrulamaz: kayıt yoksa boş dizi döner ve bölüm basılmaz.
import { fetchTrivia } from '../../../../shared/api/trivia';

export function getSeriesTrivia(seriesId) {
  return fetchTrivia({ itemId: seriesId, itemType: 'series' });
}
