// Characters sayfasının veri erişim katmanı — dizinin id'si (SeasonEpisodes
// ile aynı desen) GET /api/series/slug/:slug'dan çözülür, karakter listesi
// GET /api/series/:id/characters'a bağlıdır (billingOrder sıralı).
export { fetchProductionDetail } from '../../../../shared/api/productions';
export { fetchCharactersForSeries } from '../../../../shared/api/characters';
export { theme } from '../GameOfThrones.data';

import { fetchBlogHub } from '../../../../shared/api/blogs';

// Sayfanın altındaki "Character Analysis" şeridi — format=CHARACTER,
// franchise=a-song-of-ice-and-fire ile filtrelenmiş blog hub sonucu
// (kullanıcı kararı: karakter odaklı derin-analiz yazıları burada).
export function getCharacterAnalysisBlogs() {
  return fetchBlogHub({ format: 'CHARACTER', franchise: 'a-song-of-ice-and-fire', size: 20 }).then(
    (res) => res.content
  );
}
