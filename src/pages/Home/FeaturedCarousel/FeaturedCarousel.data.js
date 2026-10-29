// FeaturedCarousel'in veri erişim katmanı — GET /api/productions'a bağlı.
// posterUrl artık API'den doğrudan geliyor, ayrı bir poster eşleme
// tablosuna gerek kalmadı.
import { fetchAllProductions } from '../../../shared/api/productions';
import { groupByMood } from '../../../shared/data/moodShelves';

// MOCK ruh hali rafları (raf tanımları src/shared/data/moodShelves.js'te).
export async function fetchMoodShelves() {
  return groupByMood(await fetchAllProductions());
}

// Hover'da poster kutusu neredeyse kare, poster ise dikey: object-fit:cover
// dikeyde ortadan kırpar ve postere en üstteki yüzler kesilebilir. Yapıma özel
// dikey odak (object-position); listede olmayan yapımlar varsayılan "center".
export const POSTER_POSITION = {
  'the-boys': 'center top',
  'mulholland-drive': 'center top',
};
