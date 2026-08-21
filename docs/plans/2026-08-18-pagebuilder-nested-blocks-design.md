# PageBuilder — Nested/Auto-Layout Bloklar

## Context

Mevcut motor (`src/shared/builder/`) her bloğu birbirinden bağımsız
`position: absolute` ile TEK ortak `.page` tuvaline yerleştiriyor
(`schema.js` — `layout {x,y,w,h}` sayfaya göre global %). Kardeş bloklar
arasında hiçbir itme/kaçınma ilişkisi yok — `height: auto` olan text
blokları (özellikle uzun içerik) farklı sarınca komşu bloklarla çakışıyor.

Kök neden iki mekanizmanın birleşimi:

1. **Ölçek sadakati eksikliği** — sadece `fontSize` container genişliğine
   göre `cqw`'ye çevriliyor (`cssRules.js` `fontSizeValue`); `padding`
   (`var(--space-*)`, rem) ve `borderWidth` (px) container'a göre
   ölçeklenmiyor. Editör canvas'ı (1360px referans) ile gerçek sayfadaki
   `.page` render genişliği birebir örtüşmezse metin kutularının efektif
   iç genişliği kayar, `height:auto` blokları farklı satır sayısına sarar.
2. **Yapısal neden** — TÜM bloklar birbirinden bağımsız mutlak
   konumlandığı için, bir bloğun gerçek boyutu tahminden saparsa
   komşusuyla çakışması bu modelde HER ZAMAN mümkün.

Bu doküman #2'yi yapısal olarak çözen **nested/auto-layout blok** sistemini
tanımlar (Figma auto-layout'a benzer: parent CONTAINER + flex akışındaki
child'lar). Kullanıcıyla brainstorming diyaloguyla netleşti, aşağıdaki
kararlar zaten teyitli — implementasyon aşamasında yeniden sorgulanmamalı.

**Kapsam dışı (bilinçli):** Ölçek sadakati onarımı (madde #1, tüm
px-tabanlı stillerin cqw'ye çevrilmesi) bu işin parçası DEĞİL — ayrı,
küçük bir görev. Nested bloklar #2'yi çözer, #1 hâlâ ayrı ele alınmalı
(container dışındaki serbest bloklarda çakışma riski #1'den kaynaklanmaya
devam eder).

## Netleşen Kararlar

| Konu | Karar |
|---|---|
| Container oluşturma | İkisi de: boş "Container" bloğu palette'ten sürüklenebilir VEYA seçili bloklar "Grupla" ile sarılabilir |
| Yön | Row + column, container bazında seçilebilir |
| Nesting derinliği | Sınırsız (container içinde container) |
| Mevcut sayfalar (Breaking Bad Hero/SeasonMenu vb.) | Dokunulmuyor — nested sistem geriye dönük uyumlu EKLENİYOR, migration yok |
| Container'ın kendi konumu | `x/y/w` absolute % (mevcut sistemle aynı), `h` HER ZAMAN `null`/auto — içeriği sarar |
| Çocuk sizing modeli | `hug`/`fill`/`fixed` (Figma auto-layout eksenleri), `fixed` MVP'de kalıyor |
| Flow özellikleri (direction/gap/padding/align/justify) breakpoint'e göre değişir mi | Hayır — sabit, sadece container'ın x/y/w'si breakpoint'e göre değişir |
| Container'dan dışarı sürükleme | MVP'de destekleniyor |
| Container silme | Cascade — içindeki tüm çocuklar da silinir (Figma "grup sil" davranışı) |

## Veri Modeli

**Flat map + pointer deseni** — mevcut `blocks: {id: block}` +
`blockOrder: [ids]` düzenini bozmadan genişletir (state'i gerçek bir ağaç
yapmak yerine düz tutar; seçim/ContextPanel/undo-redo (zundo) lookup'ları
`blocks[id]` üzerinden çalışmaya devam eder, sadece ebeveyn/çocuk ilişkisi
pointer ile çözülür):

```js
// Her blok
{
  ...mevcut alanlar,
  parentId: null | blockId,   // null = sayfa kökünde
}

// CONTAINER bloğu
{
  componentType: 'CONTAINER',
  layout: { base: { x, y, w, h: null }, md, lg },  // h HER ZAMAN null
  parentId: null | blockId,
  childOrder: [ids],          // blockOrder'ın container-içi karşılığı
  flow: { direction: 'column' | 'row', gap, padding, align, justify },
  styles: { ... },             // background/border — mevcut stil matrisi aynı
}

// parentId set olan (container'ın çocuğu) bir bloğun sizing'i
child.sizing = {
  primary: 'hug' | 'fill',                    // akış yönündeki eksen
  cross:   'hug' | 'fill' | 'fixed',           // akışa dik eksen
}
child.fixedCross: number | null                // px, sadece cross:'fixed' iken
// parentId set olduğunda layout.{x,y} ARTIK OKUNMAZ (konum flex akışından gelir)
```

**Neden `fixedCross` px, % değil:** Container kendisi "içeriği sar"
(`height:auto`) olduğu için çocuğun boyutunu container'a göre % vermek
çelişkili olur (container'ın boyutu zaten çocuklara bağlı). Sabit boyut
gerekiyorsa px kullanılır — mevcut md/lg breakpoint override mekanizmasıyla
aynı şekilde ayrı ayarlanabilir.

## Editör Etkileşimi

**Container yaratma:**
1. Palette'ten "Container" sürüklenir → boş, kesikli-çerçeveli drop-zone
   (`childOrder:[]` iken min-height ile görünür kalır).
2. Birden fazla blok seçilir (aynı ebeveyne sahip olmaları şart) →
   FloatingToolbar'a **"Grupla"** eklenir → seçili blokların bounding
   box'ı yeni container'ın x/y/w'si olur, bloklar `childOrder`'a mevcut
   y-sırasına göre eklenir, `parentId`'leri set edilir, eski serbest
   x/y'leri temizlenir.

**Sürükle-bırak ile yeniden ebeveynleme:** `useBlockGestures.js`'teki
sürükleme sırasında, imleç konumu tüm CONTAINER'ların render edilmiş
dikdörtgenleriyle (`Canvas.geometry.js` viewport/zoom dönüşümü) sürekli
hit-test edilir. Bir container üstündeyken vurgulanır; bırakılınca
`parentId` değişir, `childOrder`'a en yakın komşu ara-noktaya göre
eklenir. Aynı container İÇİNDE sürükleme sadece `childOrder`'ı yeniden
sıralar. Container'dan DIŞARI çıkarılırsa, bırakıldığı noktadan yeni bir
serbest x/y % değeri hesaplanıp absolute moda geri döner. Hit-test,
sürüklenen bloğun kendi alt-ağacını (kendi içine bırakılamaz) hariç tutar.

**Recursive render zorunluluğu:** Canvas.jsx ve codegen
(`jsxForBlock.js`/`cssRules.js`) bugün `blockOrder`'ı DÜZ dolaşıyor.
CONTAINER geldiğinde "bir CONTAINER'a rastlarsa `childOrder`'ını da
recursive işle" mantığına dönmeli — editör canvas'ı ve üretilen JSX/CSS
AYNI recursive fonksiyonu paylaşmalı (kopya mantık riskine dikkat).

**Toolbar:** Container seçiliyken **"Gruptan Çıkar"** — çocukları
ebeveynin ebeveynine/köke geri taşır, container silinir.

## Codegen (JSX/CSS Üretimi)

`jsxForBlock.js`: CONTAINER tipinde `<div className={styles.containerN}>`
üretip `childOrder`'ı recursive olarak aynı fonksiyona yollar.

`cssRules.js`: CONTAINER için `position:absolute; left/top/width` (height
YOK) + `display:flex; flex-direction; gap; padding; align-items;
justify-content`. Çocuk blokların CSS'i artık `position:absolute` DEĞİL:

- `primary:hug` → flex özelliği eklenmez
- `primary:fill` → `flex: 1 1 0;`
- `cross:hug` → `align-self: flex-start;`
- `cross:fill` → `align-self: stretch;`
- `cross:fixed` → `align-self: flex-start;` + sabit px genişlik/yükseklik (yöne göre)

`fontSize` cqw dönüşümü çocuklarda da aynen geçerli. `naming.js`'in
className sayaç mantığı global sırayla çalıştığı için recursion'da
değişmeden kullanılabilir.

`generateComponent.js`: `visibleBlocks` düz döngüsü SADECE kök-seviye
(`parentId === null`) bloklarla sınırlanır, descendant'lar recursive
helper'a devredilir.

## Etkilenen Dosyalar

- `src/shared/builder/schema.js` — `parentId`/`childOrder`/`flow`/`sizing`
  alanları, `createEmptyContainerBlock`, `groupBlocksIntoContainer`/
  `ungroupContainer` helper'ları
- `src/shared/builder/registry.js` — CONTAINER componentType kaydı
- `src/pages/Admin/PageBuilder/PageBuilder.blockRenderers.jsx` — CONTAINER
  renderer (recursive)
- `src/pages/Admin/PageBuilder/Canvas/Canvas.jsx` — recursive render, drop
  highlight, boş container placeholder
- `src/pages/Admin/PageBuilder/Canvas/useBlockGestures.js` — reparent
  hit-testing, container-içi reorder, dışarı-çıkarma koordinat hesabı
- `src/pages/Admin/PageBuilder/Canvas/Canvas.geometry.js` — bounding-box/
  hit-test helper'ları (container drop target'lar için genişletilir)
- `src/pages/Admin/PageBuilder/Canvas/usePlacement.js` — palette'ten
  container-içine bırakma
- `src/pages/Admin/PageBuilder/ContextPanel/ContextPanel.jsx`,
  `src/shared/builder/PropertyFactory/PropertyFactory.jsx` — koşullu
  sizing (hug/fill/fixed) ve flow (direction/gap/padding/align/justify)
  kontrolleri
- `src/pages/Admin/PageBuilder/FloatingToolbar/FloatingToolbar.jsx` —
  Grupla/Gruptan Çıkar
- `src/pages/Admin/PageBuilder/PageBuilder.jsx` — seçim (aynı-ebeveyn
  kısıtı), blockOrder/childOrder defter tutma (create/delete/group/ungroup)
- `src/pages/Admin/PageBuilder/LeftPanel/LeftPanel.jsx` — palette girişi
- `src/shared/builder/codegen/jsxForBlock.js`,
  `src/shared/builder/codegen/cssRules.js`,
  `src/shared/builder/codegen/generateComponent.js` — recursive emit

## Faz Planı

Her faz bağımsız doğrulanabilir, sırayla teslim edilir:

1. **Schema + registry + codegen** — editör UI'sız, `demo.blocks.json`'a
   elle CONTAINER eklenip "Kodu Üret" ile doğrulanır.
2. **Canvas render** — recursive render, boş container placeholder,
   ContextPanel sizing/flow kontrolleri.
3. **Sürükle-bırak** — palette'ten container, içine reparent, container-içi
   reorder, dışarı çıkarma.
4. **Grupla/Gruptan Çıkar** toolbar aksiyonları.
5. **Uçtan uca doğrulama** — gerçek bir düzenle "Kodu Üret" → farklı
   genişliklerde (mobil/masaüstü) screenshot ile çakışmanın bittiği
   kanıtlanır (`visual-verify`).

**Doğrulama:** proje testsiz (Vitest yok) — her faz sonunda `npm run lint`
+ `npm run build` temiz olmalı, faz 5'te görsel kanıt zorunlu.
