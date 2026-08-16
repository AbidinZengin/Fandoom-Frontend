// Kritik tasarım kararı: block.layout/styles matrisindeki (base/md/lg) her
// bucket'ı OLDUĞU GİBİ (resolve/merge ETMEDEN) kendi CSS kuralına yazar —
// md/lg bucket'ı sadece DOKUNULAN alanları taşıdığı için (bkz. schema.js)
// tarayıcının kendi CSS cascade'i editördeki resolveEffectiveStyle/Layout'un
// yaptığı kademeli merge'ü otomatik tekrarlar. Ayrı bir "effective" hesap
// gerekmez — bu dosya sadece her bucket'ı düz CSS satırına çevirir.
const camelToKebab = (key) => key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

// blur+filter kompozisyonu — PageBuilder.blockRenderers.jsx'teki
// composeFilter ile AYNI mantık (blur ayrı bir CSS özelliği DEĞİL, filter'ın
// bir fonksiyonu).
function composeFilterValue(bucket) {
  return [bucket.blur ? `blur(${bucket.blur}px)` : null, bucket.filter || null].filter(Boolean).join(' ') || null;
}

// Bir stil bucket'ını (ör. styles.base.normal) CSS deklarasyon satırlarına
// çevirir. rotate/scale modern CSS'te bağımsız özellikler (transform
// fonksiyonu DEĞİL) — runtime renderer'la AYNI birim kuralı: rotate deg
// alır, scale çıplak sayı.
function styleDeclarations(bucket) {
  if (!bucket) return [];
  const lines = [];
  const filterValue = composeFilterValue(bucket);
  if (filterValue) lines.push(`filter: ${filterValue};`);
  for (const [key, value] of Object.entries(bucket)) {
    if (key === 'blur' || key === 'filter') continue;
    if (value == null || value === '') continue;
    if (key === 'rotate') {
      lines.push(`rotate: ${value}deg;`);
      continue;
    }
    lines.push(`${camelToKebab(key)}: ${value};`);
  }
  return lines;
}

function layoutDeclarations(bucket) {
  if (!bucket) return [];
  // Sürükle/resize hesapları uzun kayan-nokta artıkları bırakır (ör.
  // 16.937714679018438) — üretilen CSS'te okunabilir kalsın diye 2 ondalığa
  // yuvarlanır (ContextPanel'in X/Y/W/H alanlarını GÖSTERİRKEN yaptığı
  // yuvarlamayla aynı fikir, burada gerçek değere uygulanıyor).
  const round = (n) => Math.round(n * 100) / 100;
  const lines = [];
  if (bucket.x != null) lines.push(`left: ${round(bucket.x)}%;`);
  if (bucket.y != null) lines.push(`top: ${round(bucket.y)}%;`);
  if (bucket.w != null) lines.push(`width: ${round(bucket.w)}%;`);
  if ('h' in bucket) lines.push(`height: ${bucket.h != null ? `${round(bucket.h)}%` : 'auto'};`);
  return lines;
}

// PageBuilder.data.js'teki parseCustomCss ile AYNI mantık — BİLİNÇLİ kopya,
// motor (bu klasör) hiçbir editöre/sayfaya bağımlı olmamalı (proje
// konvansiyonu, bkz. PageBuilder.data.js'in kendi parseCustomCss yorumu).
function customCssDeclarations(customCss) {
  if (!customCss) return [];
  const lines = [];
  customCss.split(';').forEach((decl) => {
    const idx = decl.indexOf(':');
    if (idx === -1) return;
    const key = decl.slice(0, idx).trim();
    const value = decl.slice(idx + 1).trim();
    if (key && value) lines.push(`${camelToKebab(key)}: ${value};`);
  });
  return lines;
}

// Renderer'ın kendi shapeCircle/shapeDiamond CSS'iyle AYNI sabit değerler
// (bkz. PageBuilder.blockRenderers.jsx ShapeRenderer) — kullanıcı stil
// matrisinden bağımsız, tipin kendi geometrisi.
const SHAPE_DECLARATIONS = {
  CIRCLE: ['border-radius: 50%;'],
  DIAMOND: ['clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);'],
};

const indent = (lines, spaces) => lines.map((l) => ' '.repeat(spaces) + l);

// Bir block için TÜM CSS kural string'lerini (base, :hover, md/lg @media +
// @media:hover) üretir — boş bucket'lar hiçbir kural üretmez (opt-in
// responsive, bkz. codegen tasarım kararı).
export function cssRulesForBlock(block, className, canvasWidths) {
  const layout = block.layout ?? {};
  const styles = block.styles ?? {};
  const rules = [];

  const baseLines = [
    'position: absolute;',
    ...layoutDeclarations(layout.base),
    ...styleDeclarations(styles.base?.normal),
    ...customCssDeclarations(block.customCss),
    ...(SHAPE_DECLARATIONS[block.componentType] ?? []),
  ];
  rules.push(`.${className} {\n${indent(baseLines, 2).join('\n')}\n}`);

  const hoverLines = styleDeclarations(styles.base?.hover);
  if (hoverLines.length > 0) rules.push(`.${className}:hover {\n${indent(hoverLines, 2).join('\n')}\n}`);

  for (const bp of ['md', 'lg']) {
    const bpLines = [...layoutDeclarations(layout[bp]), ...styleDeclarations(styles[bp]?.normal)];
    if (bpLines.length > 0) {
      rules.push(`@media (max-width: ${canvasWidths[bp]}px) {\n  .${className} {\n${indent(bpLines, 4).join('\n')}\n  }\n}`);
    }
    const bpHoverLines = styleDeclarations(styles[bp]?.hover);
    if (bpHoverLines.length > 0) {
      rules.push(`@media (max-width: ${canvasWidths[bp]}px) {\n  .${className}:hover {\n${indent(bpHoverLines, 4).join('\n')}\n  }\n}`);
    }
  }

  return rules;
}
