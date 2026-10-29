import { apiClient } from '../../shared/api/client';
import { searchByType } from '../../shared/api/search';

// Varlık-bağımsız REST çağrıları. Varsayılan: backend'in standart CRUD şekli
//   by-id   : {entity.path}/{id}            (GET, PUT, DELETE)
//   üst-liste: {parent.path}/{parent.id}/{entity.nested}  (GET liste, POST)
// Standart dışı uçlar için varlık tanımında `api: { list, get, create, update,
// remove }` ile bu çağrılar tek tek ezilir (ör. trivia, lore).
//
// `parent`: { entity, id } — bir üst halka (yoksa null).

const nestedPath = (entity, parent) => `${parent.entity.path}/${parent.id}/${entity.nested}`;

// Üst-seviye varlık listesi (series, movies): PageResponse
// { content, page, size, totalElements, totalPages, last }.
// `sort=id,desc`: en yeni kayıt üstte (Spring Pageable alan adı bekler).
// Arama varken ortak /api/search/{tür} ucuna gider (eski `?search=` dalı
// backend'den kalkıyor); orada sıralama sabit alaka sırasıdır, sort yok
// sayılır. Tür adı varlığın `key`'iyle aynı (series, movies). 2 karakterden
// kısa sorgu backend'de boş sonuç döndüğü için düz listede kalınır.
export function listEntities(entity, { page = 0, size = 20, search = '' } = {}) {
  const q = search.trim();
  if (q.length >= 2) return searchByType(entity.key, { q, page, size });
  const params = new URLSearchParams({ page, size, sort: 'id,desc' });
  return apiClient.get(`${entity.path}?${params}`);
}

// Bir ebeveynin altındaki alt kayıtlar. Backend liste yanıtı dizi, sayfa
// ({ content }) veya zarf ({ data }) olabilir, hepsi diziye indirgenir.
export async function listChildren(entity, parent) {
  const res = entity.api?.list ? await entity.api.list(parent) : await apiClient.get(nestedPath(entity, parent));
  if (Array.isArray(res)) return res;
  return res?.content ?? res?.data ?? [];
}

export const getEntity = (entity, id, parent) =>
  entity.api?.get ? entity.api.get(id, parent) : apiClient.get(`${entity.path}/${id}`);

// Alt varlıkta oluşturma ebeveynin altına yapılır; üst-seviyede kendi path'ine.
export const createEntity = (entity, body, parent) => {
  if (entity.api?.create) return entity.api.create(body, parent);
  return apiClient.post(parent ? nestedPath(entity, parent) : entity.path, body);
};

export const updateEntity = (entity, id, body, parent) =>
  entity.api?.update ? entity.api.update(id, body, parent) : apiClient.put(`${entity.path}/${id}`, body);

export const deleteEntity = (entity, id, parent) =>
  entity.api?.remove ? entity.api.remove(id, parent) : apiClient.delete(`${entity.path}/${id}`);
