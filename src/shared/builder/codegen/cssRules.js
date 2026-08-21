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

// KRİTİK — kullanıcı raporu (2026-08-19): "generate edeceğim
// component'lerin tam olarak koyduğum yerlerde olması deterministic,
// her zaman birebir tahmin edilebilir olması" gerekiyor. Kök neden:
// `left`/`width` (%) her zaman container'ın GENİŞLİĞİNE göre çözülür —
// bu CSS'te KESİN/güvenilir bir referans (container-type:inline-size
// zaten cqw için bunu garanti ediyor, fontSize de aynı genişliğe göre
// ölçekleniyor, bkz. fontSizeValue). Ama `top`/`height` (%) container'ın
// YÜKSEKLİĞİNE göre çözülür — `.page`'in yüksekliği `aspect-ratio`'dan
// TÜRETİLMİŞ (dolaylı) bir değer, ve absolute pozisyonlu çocuklarda bu
// yüzdenin editördeki (sabit piksel yükseklikli tuval) karşılığıyla
// BİREBİR aynı sonucu vermediği gözlemlendi (üretilen sayfada dikey
// pozisyonlar editörle uyuşmuyordu). Çözüm: dikey değerleri de GENİŞLİĞE
// göre (cqw) ifade etmek — tasarımın kendi sabit en-boy oranını (canvasWidth/
// canvasHeight) kullanarak "yükseklik yüzdesi"ni "genişlik yüzdesi"ne
// çeviririz: aynı oran (aspect-ratio) korunduğu sürece bu İKİ İFADE
// MATEMATİKSEL OLARAK EŞDEĞERDİR, ama cqw'nin dayandığı genişlik referansı
// kesin olduğu için sonuç HER ZAMAN editördekiyle birebir eşleşir.
function verticalToCqw(percentOfHeight, canvasWidth, canvasHeight) {
  if (!canvasWidth || !canvasHeight) return `${percentOfHeight}%`;
  const cqw = percentOfHeight * (canvasHeight / canvasWidth);
  return `${Math.round(cqw * 1000) / 1000}cqw`;
}

function layoutDeclarations(bucket, canvasWidth, canvasHeight) {
  if (!bucket) return [];
  // Sürükle/resize hesapları uzun kayan-nokta artıkları bırakır (ör.
  // 16.937714679018438) — üretilen CSS'te okunabilir kalsın diye 2 ondalığa
  // yuvarlanır (ContextPanel'in X/Y/W/H alanlarını GÖSTERİRKEN yaptığı
  // yuvarlamayla aynı fikir, burada gerçek değere uygulanıyor).
  const round = (n) => Math.round(n * 100) / 100;
  const lines = [];
  if (bucket.x != null) lines.push(`left: ${round(bucket.x)}%;`);
  if (bucket.y != null) lines.push(`top: ${verticalToCqw(round(bucket.y), canvasWidth, canvasHeight)};`);
  if (bucket.w != null) lines.push(`width: ${round(bucket.w)}%;`);
  if ('h' in bucket) lines.push(`height: ${bucket.h != null ? verticalToCqw(round(bucket.h), canvasWidth, canvasHeight) : 'auto'};`);
  return lines;
}

// CONTAINER'ın kendi kutusu için flex akış kuralları — root'ta ya da bir
// üst container'ın çocuğunda AYNI şekilde uygulanır (nesting'i mümkün kılan
// budur: bir CONTAINER hem kendi çocuklarını flex ile dizer hem de KENDİSİ
// bir üst container'da sıradan bir "child" gibi davranabilir). Kullanıcı
// kararı: flow breakpoint'e göre DEĞİŞMEZ (sadece container'ın kendi x/y/w
// konumu breakpoint'e göre değişir) — bu yüzden burada tek, base-benzeri
// tek bir bucket var, md/lg tekrarı yok.
function flowDeclarations(flow) {
  if (!flow) return [];
  const lines = ['display: flex;', `flex-direction: ${flow.direction === 'row' ? 'row' : 'column'};`];
  if (flow.gap != null) lines.push(`gap: ${flow.gap}px;`);
  if (flow.padding != null) lines.push(`padding: ${flow.padding}px;`);
  if (flow.align) lines.push(`align-items: ${flow.align};`);
  if (flow.justify) lines.push(`justify-content: ${flow.justify};`);
  return lines;
}

// Bir container'ın ÇOCUĞU olan bloğun (leaf ya da iç içe CONTAINER fark
// etmez) konumlandırması artık `position:absolute` DEĞİL — ebeveynin flex
// akışındaki yeri `sizing`in belirlediği bir "niyet" ile ifade edilir
// (bkz. schema.js `sizing`/`fixedCross`, Figma auto-layout'un hug/fill/
// fixed eksenleriyle AYNI model). `parentDirection` çapraz eksenin
// width mi height mi olduğunu belirler (column'da çapraz=yatay/width,
// row'da çapraz=dikey/height).
function childSizingDeclarations(block, parentDirection) {
  const sizing = block.sizing ?? { primary: 'hug', cross: 'hug' };
  const lines = [];
  if (sizing.primary === 'fill') {
    lines.push('flex: 1 1 0;');
  } else if (sizing.primary === 'fixed' && block.fixedPrimary != null) {
    // VAR OLAN bir blok container'a girerken görünümü donduran mod
    // (kullanıcı kararı 2026-08-19) — flex-grow/shrink KAPALI, tarayıcı
    // bu boyutu büyütüp küçültmesin.
    lines.push('flex: 0 0 auto;');
    lines.push(`${parentDirection === 'row' ? 'width' : 'height'}: ${block.fixedPrimary}px;`);
  }
  if (sizing.cross === 'fill') {
    lines.push('align-self: stretch;');
  } else if (sizing.cross === 'fixed' && block.fixedCross != null) {
    lines.push('align-self: flex-start;');
    const prop = parentDirection === 'row' ? 'height' : 'width';
    lines.push(`${prop}: ${block.fixedCross}px;`);
  } else {
    lines.push('align-self: flex-start;');
  }
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

// KRİTİK — kullanıcı raporu (2026-08-19): "generate edilen kod hiç
// göründüğü gibi değil". Kök neden: Canvas.module.css'teki editör-only
// class'lar (ör. `.imageImg { object-fit: cover; }`) sadece EDİTÖRDE
// doğru görünmeyi sağlıyordu — codegen SADECE block.styles VERİSİNİ okur,
// o CSS class'ını hiç bilmez. `objectFit` veride yoksa (registry.js'in
// `defaultStyles`'ı sonradan eklendi — ESKİ/var olan bloklarda hâlâ yok)
// üretilen CSS'te satır hiç çıkmıyor, tarayıcı object-fit'in CSS-initial
// değeri 'fill'e düşüp posteri (2:3) şeride (ör. 10:1) niteliksiz
// uzatıyordu. Burası, VERİDE eksik olsa bile codegen'in editörle AYNI
// görünümü üretmesini garanti eden son çare — `styles.base.normal` bunun
// ÜSTÜNE yazılır (kullanıcı elle 'fill'/'contain' seçtiyse o kazanır).
//
// TEXT için AYNI sınıftan bir boşluk: editördeki TextRenderer metni bir
// `<div className={styles.textWrap}>` içine sarar (margin YOK), ama
// codegen (jsxForBlock) çıplak bir `<p>` üretir — tarayıcının user-agent
// stylesheet'i `<p>`'ye varsayılan `margin: 1em 0` verir. Bu margin
// `position:absolute` kutunun `top`'unu OLDUĞU GİBİ bırakır ama içeriği
// 1em (=fontSize) kadar aşağı iter — kullanıcı raporu "yazılar hala
// kayıyor" (2026-08-19) BUNUN yüzündendi, top/height'ın %/cqw birimiyle
// HİÇBİR ilgisi yoktu (canlı ölçüm: SEASONS başlığı 7.00pp, "01" 12.00pp
// kaymış — ikisi de tam olarak kendi font-size'ının 1em'i, container
// yüksekliğine oranlanmış hâli). object-fit'teki gibi, veri modeli bunu
// hiç bilmediği için son çare burada garanti edilir.
const COMPONENT_STYLE_DEFAULTS = {
  IMAGE: { objectFit: 'cover' },
  TEXT: { margin: 0 },
};

const indent = (lines, spaces) => lines.map((l) => ' '.repeat(spaces) + l);

// Bir block için TÜM CSS kural string'lerini (base, :hover, md/lg @media +
// @media:hover) üretir — boş bucket'lar hiçbir kural üretmez (opt-in
// responsive, bkz. codegen tasarım kararı).
//
// `parentFlow`: block bir CONTAINER'ın çocuğuysa o container'ın `flow`
// objesi (yoksa undefined — kök seviyede ya da eski/flat sayfalarda hep
// bu durum, mevcut davranış AYNEN korunur). Varlığı `block.parentId` ile
// tutarlı olmalı — generateComponent.js recursion'da bunu garanti eder.
export function cssRulesForBlock(block, className, canvasWidths, canvasHeights, parentFlow) {
  const layout = block.layout ?? {};
  const styles = block.styles ?? {};
  const isChild = !!block.parentId;
  const rules = [];

  const baseLines = isChild
    ? childSizingDeclarations(block, parentFlow?.direction)
    : ['position: absolute;', ...layoutDeclarations(layout.base, canvasWidths.base, canvasHeights.base)];
  if (block.componentType === 'CONTAINER') baseLines.push(...flowDeclarations(block.flow));
  baseLines.push(
    ...styleDeclarations({ ...COMPONENT_STYLE_DEFAULTS[block.componentType], ...styles.base?.normal }, canvasWidths.base),
    ...customCssDeclarations(block.customCss),
    ...(SHAPE_DECLARATIONS[block.componentType] ?? [])
  );
  rules.push(`.${className} {\n${indent(baseLines, 2).join('\n')}\n}`);

  const hoverLines = styleDeclarations(styles.base?.hover, canvasWidths.base);
  if (hoverLines.length > 0) rules.push(`.${className}:hover {\n${indent(hoverLines, 2).join('\n')}\n}`);

  // Çocuk bloklarda md/lg SADECE stil (renk/efekt) taşır — sizing/flow
  // breakpoint'e göre değişmez (kullanıcı kararı, bkz. tasarım dokümanı
  // "Flow breakpoint" bölümü). Kök bloklarda mevcut davranış (layout da
  // breakpoint'e göre değişebilir) AYNEN korunur.
  for (const bp of ['md', 'lg']) {
    const bpLayoutLines = isChild ? [] : layoutDeclarations(layout[bp], canvasWidths[bp], canvasHeights[bp]);
    const bpLines = [...bpLayoutLines, ...styleDeclarations(styles[bp]?.normal, canvasWidths[bp])];
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
