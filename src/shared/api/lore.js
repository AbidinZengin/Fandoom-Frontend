import { apiClient } from './client';

// type: 'movie' | 'series' — productions.js'teki fetchProductionDetail
// deseninin aynısı, route segmentinden geldiği haliyle (tekil) alınır,
// path'e yazılırken çoğula çevrilir.
function parentPath(type) {
  return type === 'movie' ? 'movies' : 'series';
}

// Group/Location.customFields backend'de STRINGIFY EDİLMİŞ JSON kolonu
// (bkz. lore-module-backend-endpoints notu) — bu dosyanın dışına asla ham
// string olarak sızmaz: okurken parse edilir, yazarken stringify edilir.
function withParsedCustomFields(entity) {
  return { ...entity, customFields: entity.customFields ? JSON.parse(entity.customFields) : {} };
}

// ---- TaxonomyCategory ----

export async function fetchLoreCategories(type, parentId) {
  return apiClient.get(`/${parentPath(type)}/${parentId}/lore/categories`);
}

// fields: en azından { name } — PageBuilder'ın generic yazma akışı
// (entitySchemas.js) daha geniş bir obje de gönderebilir, bu sarmalayıcı
// artık şekle karışmaz (eskiden hardcoded tek-alan {name} idi).
export async function createLoreCategory(type, parentId, fields) {
  return apiClient.post(`/${parentPath(type)}/${parentId}/lore/categories`, fields);
}

export async function fetchLoreCategory(id) {
  return apiClient.get(`/lore/categories/${id}`);
}

export async function fetchLoreCategoryBySlug(slug) {
  return apiClient.get(`/lore/categories/slug/${slug}`);
}

export async function updateLoreCategory(id, fields) {
  return apiClient.put(`/lore/categories/${id}`, fields);
}

// Production-nested olmayan GENERIC create — backend'e PageBuilder yazma
// akışı için eklendi (2026-08-16), gövdede subjectType/subjectId taşıyarak
// hangi production'a ait olduğunu belirtir (createLoreCategory'nin
// nested-path versiyonundan FARKLI, ikisi de var — Lore admin UI ileride
// hangisini kullanacağına göre seçer).
export async function createLoreCategoryGeneric(fields) {
  return apiClient.post('/lore/categories', fields);
}

export async function deleteLoreCategory(id) {
  return apiClient.delete(`/lore/categories/${id}`);
}

// ---- Group ----

export async function fetchLoreGroups(type, parentId, categoryId) {
  const query = categoryId != null ? `?categoryId=${categoryId}` : '';
  const groups = await apiClient.get(`/${parentPath(type)}/${parentId}/lore/groups${query}`);
  return groups.map(withParsedCustomFields);
}

export async function createLoreGroup(type, parentId, { customFields, ...rest }) {
  const group = await apiClient.post(`/${parentPath(type)}/${parentId}/lore/groups`, {
    ...rest,
    customFields: JSON.stringify(customFields ?? {}),
  });
  return withParsedCustomFields(group);
}

export async function fetchLoreGroup(id) {
  const group = await apiClient.get(`/lore/groups/${id}`);
  return withParsedCustomFields(group);
}

export async function fetchLoreGroupBySlug(slug) {
  const group = await apiClient.get(`/lore/groups/slug/${slug}`);
  return withParsedCustomFields(group);
}

export async function updateLoreGroup(id, { customFields, ...rest }) {
  const group = await apiClient.put(`/lore/groups/${id}`, {
    ...rest,
    customFields: JSON.stringify(customFields ?? {}),
  });
  return withParsedCustomFields(group);
}

export async function deleteLoreGroup(id) {
  return apiClient.delete(`/lore/groups/${id}`);
}

// Generic create (bkz. createLoreCategoryGeneric yorumu) — categoryId
// zaten subject'i belirlediği için ekstra subjectType/subjectId gerekmiyor.
export async function createLoreGroupGeneric({ customFields, ...rest }) {
  const group = await apiClient.post('/lore/groups', { ...rest, customFields: JSON.stringify(customFields ?? {}) });
  return withParsedCustomFields(group);
}

// ---- GroupAssignment ----

export async function fetchGroupAssignments(taggableType, taggableId) {
  return apiClient.get(`/lore/groups/assignments?taggableType=${taggableType}&taggableId=${taggableId}`);
}

export async function createGroupAssignment(groupId, taggableType, taggableId) {
  return apiClient.post(`/lore/groups/${groupId}/assignments`, { taggableType, taggableId });
}

export async function deleteGroupAssignment(id) {
  return apiClient.delete(`/lore/groups/assignments/${id}`);
}

// ---- Location ----

// customFields konvansiyonu yapıma göre değişir (backend doğrulamaz) —
// GoT/Westeros için { x, y, scale } (0-1 fraksiyonel, WorldMap.data.js'in
// camera.x/y'siyle hizalı, bkz. lore-module-backend-endpoints notu).

export async function fetchLoreLocations(type, parentId) {
  const locations = await apiClient.get(`/${parentPath(type)}/${parentId}/lore/locations`);
  return locations.map(withParsedCustomFields);
}

export async function createLoreLocation(type, parentId, { customFields, ...rest }) {
  const location = await apiClient.post(`/${parentPath(type)}/${parentId}/lore/locations`, {
    ...rest,
    customFields: JSON.stringify(customFields ?? {}),
  });
  return withParsedCustomFields(location);
}

export async function fetchLoreLocation(id) {
  const location = await apiClient.get(`/lore/locations/${id}`);
  return withParsedCustomFields(location);
}

export async function fetchLoreLocationBySlug(slug) {
  const location = await apiClient.get(`/lore/locations/slug/${slug}`);
  return withParsedCustomFields(location);
}

export async function updateLoreLocation(id, { customFields, ...rest }) {
  const location = await apiClient.put(`/lore/locations/${id}`, {
    ...rest,
    customFields: JSON.stringify(customFields ?? {}),
  });
  return withParsedCustomFields(location);
}

export async function deleteLoreLocation(id) {
  return apiClient.delete(`/lore/locations/${id}`);
}

// Generic create (bkz. createLoreCategoryGeneric yorumu).
export async function createLoreLocationGeneric({ customFields, ...rest }) {
  const location = await apiClient.post('/lore/locations', { ...rest, customFields: JSON.stringify(customFields ?? {}) });
  return withParsedCustomFields(location);
}

// ---- Event ----

// GET listesi backend'de orderIndex sıralı döner, burada tekrar sıralanmaz.
export async function fetchLoreEvents(type, parentId) {
  return apiClient.get(`/${parentPath(type)}/${parentId}/lore/events`);
}

// fields: eskiden hardcoded {name,description,orderIndex,imageUrl,locationId}
// idi (PageBuilder'ın generic yazma akışı için genel objeye genişletildi,
// bkz. createLoreCategory'deki aynı not).
export async function createLoreEvent(type, parentId, fields) {
  return apiClient.post(`/${parentPath(type)}/${parentId}/lore/events`, fields);
}

export async function fetchLoreEvent(id) {
  return apiClient.get(`/lore/events/${id}`);
}

export async function updateLoreEvent(id, fields) {
  return apiClient.put(`/lore/events/${id}`, fields);
}

// Generic create (bkz. createLoreCategoryGeneric yorumu).
export async function createLoreEventGeneric(fields) {
  return apiClient.post('/lore/events', fields);
}

export async function deleteLoreEvent(id) {
  return apiClient.delete(`/lore/events/${id}`);
}

// ---- EventParticipant ----

export async function fetchEventParticipants(eventId) {
  return apiClient.get(`/lore/events/${eventId}/participants`);
}

// participantType: 'CHARACTER' | 'GROUP'
export async function createEventParticipant(eventId, participantType, participantId) {
  return apiClient.post(`/lore/events/${eventId}/participants`, { participantType, participantId });
}

export async function deleteEventParticipant(id) {
  return apiClient.delete(`/lore/events/participants/${id}`);
}
