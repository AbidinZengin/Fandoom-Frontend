// FeaturedCarousel'in veri erişim katmanı — GET /api/productions'a bağlı.
// posterUrl artık API'den doğrudan geliyor, ayrı bir poster eşleme
// tablosuna gerek kalmadı.
export { fetchProductions } from '../../../shared/api/productions';

// Hover'da poster kutusu neredeyse kare, poster ise dikey: object-fit:cover
// dikeyde ortadan kırpar ve postere en üstteki yüzler kesilebilir. Yapıma özel
// dikey odak (object-position); listede olmayan yapımlar varsayılan "center".
export const POSTER_POSITION = {
  'the-boys': 'center top',
};
