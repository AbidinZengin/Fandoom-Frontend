import { ENTITIES } from './registry';

// Admin URL dilbilgisi: /admin/{varlık}[/{id|new}[/{altVarlık}[/{id|new}…]]]
// Ör. /admin/series/7/seasons/18/episodes/162 → zincir
// [series:7, seasons:18, episodes:162]. Zincirin her halkası bir üst halkanın
// `children` listesinde olmak zorundadır.

// Zincirden URL üretir. Halka: { entity, id } veya yeni kayıt için { entity, isNew: true }.
export function pathOf(chain) {
  const parts = chain.map((c) => (c.isNew ? `${c.entity.key}/new` : `${c.entity.key}/${c.id}`));
  return `/admin/${parts.join('/')}`;
}

// `rest`: '/admin/' sonrası kısım (ör. 'series/7/seasons'). Dönüş:
// { kind: 'list' | 'edit', chain, listEntity? } veya geçersizse null.
// 'list': son segment yalnız varlık anahtarı (alt liste → ebeveyn sekmesi).
export function parseAdminPath(rest) {
  const seg = (rest ?? '').split('/').filter(Boolean);
  const chain = [];
  let i = 0;

  while (i < seg.length) {
    const entity = ENTITIES[seg[i]];
    const parentEntity = chain.at(-1)?.entity;
    if (!entity || (parentEntity && !parentEntity.children?.includes(entity.key))) return null;
    if (!parentEntity && !entity.topLevel) return null;
    i += 1;

    if (i >= seg.length) return { kind: 'list', chain, listEntity: entity };

    const idSeg = seg[i];
    i += 1;
    if (idSeg === 'new') {
      if (i < seg.length) return null;
      chain.push({ entity, isNew: true });
    } else {
      chain.push({ entity, id: idSeg });
    }
  }

  return chain.length > 0 ? { kind: 'edit', chain } : null;
}
