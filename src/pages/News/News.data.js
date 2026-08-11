// News sayfasının veri erişim katmanı — ileride GET /api/community/threads?
// surface=NEWS servis çağrısına dönüşecek seam (bkz. learned-rules "Topluluk"
// bölümü — Community mimari planı, backend'de bu modül henüz açılmadı).
// Kalıcı mock: shared/data/community.js'teki NEWS yüzeyi — Home'daki
// "Latest News" ContentSection'ıyla AYNI kaynak.
import { threads } from '../../shared/data/community';

export const news = threads.filter((t) => t.surface === 'NEWS');
export { resolveProductionBySlug } from '../../shared/api/productions';
export { getProductionAccent } from '../../shared/theme/productionAccent';
