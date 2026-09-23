import { fetchLoreCategories, fetchLoreGroups } from '../../../../../../shared/api/lore';

export { fetchProductionDetail } from '../../../../../../shared/api/productions';

// 9 Büyük Hane artık backend'de gerçek Group kaydı (lore modülü,
// "Houses" TaxonomyCategory'si — bkz. lore-module-backend-endpoints hafıza
// notu). Eski sabit HOUSES mock'u kaldırıldı. Group.customFields:
// { motto, sigil, primaryColor, secondaryColor, bannerFit? } — bannerFit
// hâlâ customFields içinde (salt render kararı olsa da backend'e taşındı,
// FE-only istisna listesine ayrılmadı).
export async function fetchHouseGroups(seriesId) {
  const categories = await fetchLoreCategories('series', seriesId);
  const housesCategory = categories.find((c) => c.slug === 'houses');
  if (!housesCategory) return [];
  return fetchLoreGroups('series', seriesId, housesCategory.id);
}
