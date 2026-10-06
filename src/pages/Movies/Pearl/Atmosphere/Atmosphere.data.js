// Atmosphere'in veri erişim katmanı: yönetmen adı GET /api/people/:id'den
// çözülür (filmde sadece directorIds tutulur).
import { apiClient } from '../../../../shared/api/client';

export async function fetchDirectorNames(directorIds) {
  if (!directorIds?.length) return [];
  const people = await Promise.all(directorIds.map((id) => apiClient.get(`/people/${id}`)));
  return people.map((p) => p.name);
}
