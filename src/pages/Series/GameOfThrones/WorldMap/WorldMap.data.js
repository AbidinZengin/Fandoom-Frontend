import { fetchGroupAssignments, fetchLoreLocations } from '../../../../shared/api/lore';

export { fetchProductionDetail } from '../../../../shared/api/productions';
export { theme } from '../GameOfThrones.data';

// Lokasyonlar artık backend'de gerçek Location kaydı (lore modülü, bkz.
// lore-module-backend-endpoints hafıza notu). Eski sabit fetchWorldMapStops
// mock'u kaldırıldı.
// customFields: { x, y, scale } — WorldMap.jsx'in kamera hedefiyle (fraksiyonel
// 0-1 + zoom scale) birebir aynı, dönüşümsüz kullanılır.
// description: backend'de tek TEXT (2 paragraf '\n\n' ile birleştirilmiş
// seed edildi) — burada tekrar diziye bölünür (WorldMap.jsx paragraf paragraf basar).
// house: GroupAssignment (taggableType=LOCATION) üzerinden çözümlenir. Castle
// Black (Night's Watch) ve The Twins (House Frey) "Houses" kategorisinde
// Group olarak seed edilmedi (sadece 9 Great House var) — bu ikisi için
// GroupAssignment yok, FE-only sabit bir etiketle karşılanır.
const UNASSIGNED_HOUSE_LABEL = {
  'castle-black': "Night's Watch",
  'the-twins': 'House Frey',
};

export async function fetchWorldMapStops(seriesId) {
  const locations = await fetchLoreLocations('series', seriesId);

  return Promise.all(
    locations.map(async (location) => {
      const assignments = await fetchGroupAssignments('LOCATION', location.id);
      const house = assignments[0]
        ? `House ${assignments[0].groupName}`
        : (UNASSIGNED_HOUSE_LABEL[location.slug] ?? '');

      return {
        id: location.slug,
        title: location.name,
        house,
        description: location.description.split('\n\n'),
        image: location.imageUrl,
        camera: location.customFields,
      };
    })
  );
}
