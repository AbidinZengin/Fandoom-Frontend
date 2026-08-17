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

// fontSize editörde SERBEST METİN (kullanıcı "86px" gibi mutlak bir değer
// yazabilir, bkz. PageBuilder.data.js TEXT_CONTROLS) — .page container'ı
// width:100% ile viewport'a göre esnediği için mutlak px, canvas'ta
// (sabit canvasWidth) görülen oranı KORUMAZ (kullanıcı raporu: "gerçek
// sayfada satırlar/yazılar devasalaşıyor"). cqw (container query width)
// canvasWidth'e göre AYNI YÜZDESEL mantığı uygular — layout'un x/y/w/h'si
// zaten % olduğu için tutarlı: 1360px canvas'ta 86px yazı → 86/1360*100
// = %6.324 → 6.324cqw, container ne kadar genişlerse genişlesin AYNI
// orana sadık kalır. var(--text-*) token'ı/rem/em/% gibi ZATEN göreli bir
// değer yazılmışsa DOKUNULMAZ (sadece düz "Npx" deseni dönüştürülür).
function fontSizeValue(raw, canvasWidth) {
  const match = /^(-?[\d.]+)px$/.exec(String(raw).trim());
  if (!match || !canvasWidth) return raw;
  const cqw = (parseFloat(match[1]) / canvasWidth) * 100;
  return `${Math.round(cqw * 1000) / 1000}cqw`;
}

// Bir stil bucket'ını (ör. styles.base.normal) CSS deklarasyon satırlarına
// çevirir. rotate/scale modern CSS'te bağımsız özellikler (transform
// fonksiyonu DEĞİL) — runtime renderer'la AYNI birim kuralı: rotate deg
// alır, scale çıplak sayı. canvasWidth bu bucket'ın ait olduğu breakpoint'in
// tuval genişliği (base/md/lg) — fontSize dönüşümü buna göre yapılır.
function styleDeclarations(bucket, canvasWidth) {
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
    if (key === 'fontSize') {
      lines.push(`font-size: ${fontSizeValue(value, canvasWidth)};`);
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
    ...styleDeclarations(styles.base?.normal, canvasWidths.base),
    ...customCssDeclarations(block.customCss),
    ...(SHAPE_DECLARATIONS[block.componentType] ?? []),
  ];
  rules.push(`.${className} {\n${indent(baseLines, 2).join('\n')}\n}`);

  const hoverLines = styleDeclarations(styles.base?.hover, canvasWidths.base);
  if (hoverLines.length > 0) rules.push(`.${className}:hover {\n${indent(hoverLines, 2).join('\n')}\n}`);

  for (const bp of ['md', 'lg']) {
    const bpLines = [...layoutDeclarations(layout[bp]), ...styleDeclarations(styles[bp]?.normal, canvasWidths[bp])];
    if (bpLines.length > 0) {
      rules.push(`@media (max-width: ${canvasWidths[bp]}px) {\n  .${className} {\n${indent(bpLines, 4).join('\n')}\n  }\n}`);
    }
    const bpHoverLines = styleDeclarations(styles[bp]?.hover, canvasWidths[bp]);
    if (bpHoverLines.length > 0) {
      rules.push(`@media (max-width: ${canvasWidths[bp]}px) {\n  .${className}:hover {\n${indent(bpHoverLines, 4).join('\n')}\n  }\n}`);
    }
  }

  return rules;
}
