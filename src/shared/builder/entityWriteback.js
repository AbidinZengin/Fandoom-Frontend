import { ENTITY_SCHEMAS } from './entitySchemas';
import { fetchEntityData, updateEntityCache } from './entityDataCache';
import { applyBinding } from './schema';

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
export async function saveBoundField(block, bindableField) {
  const { entityType, entityId, field } = block.bindings;
  const schema = ENTITY_SCHEMAS[entityType];
  if (!schema?.put) throw new Error('Bu entity tipi için henüz backend yazma desteği yok.');

  const cached = await fetchEntityData(entityType, entityId);
  const editedValue = block.content[bindableField.key];
  const merged = applyBinding(cached, field, editedValue);

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
