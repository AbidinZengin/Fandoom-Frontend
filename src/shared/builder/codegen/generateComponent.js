import { makeClassNamer } from './naming';
import { createBindingRegistry } from './bindings';
import { relativeImportPrefix } from './paths';
import { cssRulesForBlock } from './cssRules';
import { jsxForBlock, jsxForContainerOpen, jsxForContainerClose } from './jsxForBlock';

const ROOT_INDENT = '      '; // 6 boşluk — .page'in bir seviye altı
const INDENT_STEP = '  '; // her CONTAINER seviyesi +2 boşluk

// PageBuilder'ın "Kodu Üret" motoru — tuvaldeki block'ları (layout/styles/
// content/bindings) gerçek `<Ad>.jsx` + `<Ad>.module.css` string'lerine
// çevirir. TEK YÖNLÜ: üretilen kod normal proje kodu olur, bu motor bir
// daha o dosyayla ilgilenmez (round-trip yok — bkz.
// docs/plans/2026-08-15-pagebuilder-codegen-design.md). Alt-parçalar
// (className, binding→fetch, CSS satırları, JSX satırı) ayrı dosyalarda —
// bu dosya sadece onları sırayla çağırıp iki string'i (jsx, css) birleştirir.
//
// orderedBlocks: PageBuilder.jsx'in `blockOrder.map(id => blocks[id])` ile
// hesapladığı KÖK SEVİYE bloklar (katman sırasıyla, alttan üste) — bkz.
// docs/plans/2026-08-18-pagebuilder-nested-blocks-design.md. CONTAINER
// çocukları blockOrder'da YER ALMAZ, `blocksById` üzerinden `childOrder`
// takip edilerek recursive bulunur (flat map + pointer deseni).
export function generateComponent({ orderedBlocks, blocksById, componentName, targetDir, canvasWidths, canvasHeights }) {
  const nextClassName = makeClassNamer();
  const bindingRegistry = createBindingRegistry();
  const importPrefix = relativeImportPrefix(targetDir);

  const cssRules = [];
  const jsxLines = [];

  // Katman sırası (z-index/DOM order) — kullanıcı uyarısı: block'lar
  // GELDİKLERİ SIRAYLA emit edilir (DOM'da sonra gelen üstte durur),
  // hidden block'lar (ve onların TÜM alt-ağacı) hiç üretilmez.
  const visibleRoots = (orderedBlocks ?? []).filter((b) => b && !b.hidden);
  for (const block of visibleRoots) {
    emitBlock({ block, parentFlow: undefined, depth: 0, blocksById, nextClassName, bindingRegistry, canvasWidths, canvasHeights, cssRules, jsxLines });
  }

  const jsx = renderJsx({ componentName, importPrefix, bindingRegistry, jsxLines });
  const css = renderCss({ canvasWidths, canvasHeights, cssRules });
  return { jsx, css };
}

// Tek bir bloğu (ve CONTAINER ise recursive olarak tüm alt-ağacını) JSX/CSS
// satırlarına çevirip `jsxLines`/`cssRules`'a push eder. `parentFlow`:
// ebeveyn CONTAINER'ın `flow`'u (kök blok için undefined) — cssRulesForBlock
// çapraz eksen hesabı için buna ihtiyaç duyar (bkz. cssRules.js
// childSizingDeclarations).
function emitBlock({ block, parentFlow, depth, blocksById, nextClassName, bindingRegistry, canvasWidths, canvasHeights, cssRules, jsxLines }) {
  const className = nextClassName(block.componentType);
  const indent = ROOT_INDENT + INDENT_STEP.repeat(depth);
  cssRules.push(...cssRulesForBlock(block, className, canvasWidths, canvasHeights, parentFlow));

  if (block.componentType === 'CONTAINER') {
    jsxLines.push(jsxForContainerOpen(className, indent));
    const children = (block.childOrder ?? [])
      .map((id) => blocksById?.[id])
      .filter((child) => child && !child.hidden);
    for (const child of children) {
      emitBlock({ block: child, parentFlow: block.flow, depth: depth + 1, blocksById, nextClassName, bindingRegistry, canvasWidths, canvasHeights, cssRules, jsxLines });
    }
    jsxLines.push(jsxForContainerClose(indent));
    return;
  }

  jsxLines.push(jsxForBlock(block, className, bindingRegistry, indent));
}

function renderJsx({ componentName, importPrefix, bindingRegistry, jsxLines }) {
  const stateLines = bindingRegistry.stateLines();
  const effectLines = bindingRegistry.effectLines();
  const guardCondition = bindingRegistry.guardCondition();
  const importLines = bindingRegistry.importLines(importPrefix);

  return `import { useEffect, useState } from 'react';
${importLines ? `${importLines}\n` : ''}import styles from './${componentName}.module.css';

// PageBuilder "Kodu Üret" ile oluşturuldu — bu noktadan sonra normal
// proje kodu, elle düzenlenebilir (GSAP/motion elle eklenir).
export default function ${componentName}() {
${stateLines.join('\n')}
${stateLines.length > 0 ? '\n' : ''}${effectLines.join('\n\n')}
${effectLines.length > 0 ? '\n' : ''}${guardCondition ? `  // TODO: Replace null with a Skeleton UI if needed.\n  if (${guardCondition}) return null;\n` : ''}
  return (
    <div className={styles.page}>
${jsxLines.join('\n')}
    </div>
  );
}
`;
}

function renderCss({ canvasWidths, canvasHeights, cssRules }) {
  // aspect-ratio (canvasWidth/canvasHeight) — tüm block'lar position:absolute
  // olduğu için .page normal akışta doğal bir yüksekliğe sahip DEĞİL; oranı
  // tuvalin GERÇEK (kullanıcının TopBar'dan ayarladığı) base yüksekliğiyle
  // eşleştirmek gerekir ki % tabanlı y/h değerleri tuvaldeki görünümle
  // birebir orantılı kalsın (eskiden sabit 800 hardcode'du — Faz 1.5'te
  // tuval yüksekliği ayarlanabilir olduktan sonra bu değerle senkron
  // değildi, kullanıcı raporuyla yakalandı).
  //
  // DÜZELTME (kullanıcı raporu, 2026-09-02: "hiçbir şey responsive değil") —
  // bu oran SADECE base için yazılıyordu, md/lg'de HİÇ override edilmiyordu.
  // Ama her bloğun top/height'ı kendi breakpoint'inin canvasWidths[bp]/
  // canvasHeights[bp] oranına göre cqw'a çevriliyor (bkz. cssRules.js
  // verticalToCqw) — yani blok pozisyonları "container o breakpoint'in
  // oranındaymış gibi" hesaplanıyordu ama container'ın GERÇEK yüksekliğini
  // belirleyen bu aspect-ratio hep base'de donuk kalıyordu. Sonuç: md/lg
  // canvas'ı base'den farklı bir oranda tasarlanan her sayfada gerçek
  // ekranda container yanlış yükseklikte oluşuyor, absolute bloklar üst
  // üste biniyor/taşıyordu. Çözüm: her block kuralıyla AYNI max-width
  // deseninde .page için de md/lg aspect-ratio override'ı eklemek.
  const pageAspectOverrides = ['md', 'lg']
    .map((bp) => `@media (max-width: ${canvasWidths[bp]}px) {\n  .page {\n    aspect-ratio: ${canvasWidths[bp]} / ${canvasHeights[bp]};\n  }\n}`)
    .join('\n\n');

  return `.page {
  position: relative;
  width: 100%;
  aspect-ratio: ${canvasWidths.base} / ${canvasHeights.base};
  /* fontSize'lar cqw (container-width yüzdesi) ile üretiliyor — bkz.
     cssRules.js fontSizeValue. container-type olmadan cqw çözülmez. */
  container-type: inline-size;
}

${pageAspectOverrides}

${cssRules.join('\n\n')}
`;
}
