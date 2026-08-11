import { apiClient } from './client';

// GET /api/cms/pages/:pageName — sabit sayfalarda (HOME, GLOBAL, FRANCHISE_LIST)
// entityId verilmez. Entity'ye özel sayfalarda (SERIES_DETAIL vb.) entityId o
// entity'nin id'sidir (ör. bir Series kaydının id'si) — gerçek bir FK değil,
// sadece "hangi sayfa örneği" sorusuna cevap veren bir referans.
// Her öğe: { id, page, entityId, section, contentType: 'IMAGE'|'TEXT',
//            contentValue, linkUrl, altText, active, orderIndex, col, row }
// col/row (2026-08 backend güncellemesi): opsiyonel CSS grid shorthand,
// şu an tüm kayıtlarda null. Section-bazlı sabit yerleşimli component'ler
// (Hero/Intro/ScrollStepper/Highlights) bunları henüz OKUMUYOR — burada
// tüketilen içerik serbest bir blok listesi değil, isme göre eşlenen sabit
// alanlar; genel bir grid render'ı olmadığından bağlanacak bir yer yok
// (BlogPost'taki blocks[] col/row kullanımıyla KARIŞTIRILMASIN).
export async function fetchPageContent(pageName, entityId) {
  const query = entityId != null ? `?entityId=${entityId}` : '';
  return apiClient.get(`/cms/pages/${pageName}${query}`);
}

// Bileşik kart listelerini (ör. section ailesi STEPPER_ITEM_*) orderIndex'e
// göre gruplayıp düz nesnelere çevirir — backend'deki "orderIndex = grup
// anahtarı" deseninin frontend karşılığı (bkz. fandoom-backend CLAUDE.md).
// sectionToField: { SECTION_NAME: 'alanAdı' }. Dönen dizi orderIndex sırasına
// göredir; boş/eksik alanlı gruplar da (kısmi veri) olduğu gibi döner.
export function groupBySection(items, sectionToField) {
  const byIndex = new Map();
  for (const item of items) {
    const field = sectionToField[item.section];
    if (!field) continue;
    const group = byIndex.get(item.orderIndex) ?? {};
    group[field] = item.contentValue;
    if (item.linkUrl) group[`${field}LinkUrl`] = item.linkUrl;
    byIndex.set(item.orderIndex, group);
  }
  return [...byIndex.entries()].sort(([a], [b]) => a - b).map(([, group]) => group);
}

// Tek bir section'ın contentValue'sunu döner (Hero'daki gibi tekil öğeler için).
export function findBySection(items, section) {
  return items.find((item) => item.section === section)?.contentValue ?? null;
}
