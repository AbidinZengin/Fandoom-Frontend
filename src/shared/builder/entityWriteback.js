import { ENTITY_SCHEMAS } from './entitySchemas';
import { fetchEntityData, updateEntityCache } from './entityDataCache';
import { applyBinding, resolveBinding } from './schema';
import { useWritebackHistoryStore } from './writebackHistoryStore';

// PageBuilder'ın bağlı-block geri yazma akışı — ContextPanel'in Data
// sekmesindeki "Backend'e Kaydet" butonu bunu çağırır (brainstorming
// diyaloğuyla netleşen karar: block bazında ayrı buton, canvas'ta in-place
// düzenleme, cache'ten last-write-wins merge — bkz. plan dosyası).
//
// Gönderilen PUT gövdesi cache'teki TAM kayıt değil — SADECE entitySchemas'ta
// tanımlı bilinen skaler alanlarla sınırlanır — cache'deki id/ilişki/dizi
// alanlarının (seasons, genreIds vb.) yanlışlıkla backend'e sızmasını önler.
// `nonWritableFields` (categoryName/locationName gibi backend'de resolve
// edilen türetilmiş alanlar) da hariç tutulur.
//
// blockList (blog.blocks[]/episode.episodeBlocks[]) SADECE düzenlenen alan
// o dizinin İÇİNDEYSE gövdeye eklenir — canlı test (2026-08-16) bir üst
// alan (episode.title) düzenlenirken bile TÜM episodeBlocks[] dizisinin
// gönderildiğini, backend'in bunu 400 ile reddettiğini gösterdi. Backend
// artık null/eksik dizi alanını "mevcudu koru" sayıyor (rapor edilen bug
// düzeltmesi) — o yüzden ilgisiz bir düzenlemede diziyi HİÇ göndermemek
// hem daha güvenli hem backend'in kendi semantiğiyle tutarlı.
//
// saveBoundField VE revertWritebackEntry (geçmiş paneli) AYNI gövde
// filtreleme mantığını kullanır — burada tek yerde toplanır.
async function putEntityField(entityType, entityId, field, value) {
  const schema = ENTITY_SCHEMAS[entityType];
  if (!schema?.put) throw new Error('Bu entity tipi için henüz backend yazma desteği yok.');

  const cached = await fetchEntityData(entityType, entityId);
  const merged = applyBinding(cached, field, value);

  const nonWritable = new Set(schema.nonWritableFields ?? []);
  const allowedKeys = new Set(Object.keys(schema.fields).filter((key) => !nonWritable.has(key)));
  if (schema.blockList && field.startsWith(`${schema.blockList.arrayField}.`)) {
    allowedKeys.add(schema.blockList.arrayField);
  }

  const body = {};
  allowedKeys.forEach((key) => {
    body[key] = merged[key];
  });

  const updated = await schema.put(entityId, body);
  const nextCached = updated ?? merged;
  updateEntityCache(entityType, entityId, nextCached);
  return nextCached;
}

export async function saveBoundField(block, bindableField) {
  const { entityType, entityId, field } = block.bindings;
  const cachedBefore = await fetchEntityData(entityType, entityId);
  const previousValue = resolveBinding(cachedBefore, field);
  const newValue = block.content[bindableField.key];

  const nextCached = await putEntityField(entityType, entityId, field, newValue);

  useWritebackHistoryStore.getState().addEntry({
    entityType,
    entityId,
    field,
    blockId: block.id,
    previousValue,
    newValue,
  });

  return nextCached;
}

// Geçmiş panelindeki "Geri Al" — entry'nin `previousValue`'sunu AYNI
// filtreleme yoluyla geri yazar. `block` (varsa, ContextPanel/LeftPanel'in
// `blocks[entry.blockId]` ile bulduğu güncel block) hâlâ aynı
// (entityType,entityId,field)'a bağlıysa true döner — çağıran bu durumda
// kendi `updateBlock`'uyla canvas içeriğini senkronlar (bindableField.key
// registry'den geldiği için burada değil, çağıranda bilinir). Blok
// silinmiş/rebind edilmişse backend yine düzelir, false döner.
export async function revertWritebackEntry(entry, block) {
  await putEntityField(entry.entityType, entry.entityId, entry.field, entry.previousValue);
  useWritebackHistoryStore.getState().markReverted(entry.id);

  return Boolean(
    block?.bindings &&
      block.bindings.entityType === entry.entityType &&
      block.bindings.entityId === entry.entityId &&
      block.bindings.field === entry.field
  );
}
