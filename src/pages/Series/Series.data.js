// Series hub'ın veri erişim katmanı — gerçek backend'e bağlı: GET /api/productions
// (fetchAllProductions cache'i) üzerinden tüm katalog çekilir, type === 'SERIES'
// olanlar filtrelenir. Ayrı bir /series-hub endpoint'i yok, mevcut orkestrasyon
// feed'i yeterli.
import { fetchAllProductions } from '../../shared/api/productions';

export { getProductionAccent } from '../../shared/theme/productionAccent';

export async function getAllSeries() {
  const all = await fetchAllProductions();
  return all.filter((p) => p.type === 'SERIES');
}
