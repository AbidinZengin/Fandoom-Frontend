import { ENTITY_SCHEMAS } from './entitySchemas';

// productions.js'teki fetchAllProductions/allProductionsPromise desenini
// izleyen promise-cache — aynı (entityType,entityId) çiftine bağlı birden
// çok block, editör oturumu boyunca TEK istek paylaşır.
const cache = new Map();

export function fetchEntityData(entityType, entityId) {
  const key = `${entityType}:${entityId}`;
  if (!cache.has(key)) {
    const schema = ENTITY_SCHEMAS[entityType];
    cache.set(key, schema.fetch(entityId).catch((err) => {
      cache.delete(key);
      throw err;
    }));
  }
  return cache.get(key);
}

// Başarılı bir PUT/POST sonrası cache'i güncel kayıtla değiştirir — aynı
// (entityType,entityId) çiftine bağlı DİĞER block'lar bir sonraki render'da
// (yeniden bind/resolve olduklarında) güncel veriyi görür. Yeniden fetch
// ATMAZ (bkz. entityWriteback.js — last-write-wins kararı, kullanıcı onaylı).
export function updateEntityCache(entityType, entityId, data) {
  cache.set(`${entityType}:${entityId}`, Promise.resolve(data));
}
