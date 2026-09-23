import { fetchLoreEvents } from '../../../../shared/api/lore';

export { fetchProductionDetail } from '../../../../shared/api/productions';
export { theme } from '../GameOfThrones.data';

// Backend Event.customFields (stringify edilmiş JSON) — lore.js'teki
// Group/Location'ın withParsedCustomFields'ı Event için henüz yok, burada
// yerel olarak parse edilir (bkz. lore-module-backend-endpoints notu:
// Event şeması Group/Location'dan daha basit, houses/tone alanı YOK).
export async function fetchHistoryScenes(seriesId) {
  const events = await fetchLoreEvents('series', seriesId);

  return events.map((event) => {
    const fields = event.customFields ? JSON.parse(event.customFields) : {};
    return {
      id: event.id,
      title: event.name,
      date: fields.date ?? '',
      quote: fields.quote ?? '',
      locations: fields.locations ?? [],
      body: event.description.split('\n\n'),
      image: event.imageUrl,
      pinned: event.pinned,
    };
  });
}
