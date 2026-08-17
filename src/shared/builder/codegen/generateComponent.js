import { makeClassNamer } from './naming';
import { createBindingRegistry } from './bindings';
import { relativeImportPrefix } from './paths';
import { cssRulesForBlock } from './cssRules';
import { jsxForBlock } from './jsxForBlock';

// PageBuilder'ın "Kodu Üret" motoru — tuvaldeki block'ları (layout/styles/
// content/bindings) gerçek `<Ad>.jsx` + `<Ad>.module.css` string'lerine
// çevirir. TEK YÖNLÜ: üretilen kod normal proje kodu olur, bu motor bir
// daha o dosyayla ilgilenmez (round-trip yok — bkz.
// docs/plans/2026-08-15-pagebuilder-codegen-design.md). Alt-parçalar
// (className, binding→fetch, CSS satırları, JSX satırı) ayrı dosyalarda —
// bu dosya sadece onları sırayla çağırıp iki string'i (jsx, css) birleştirir.
// orderedBlocks: PageBuilder.jsx'in zaten hesapladığı `blockOrder.map(id =>
// blocks[id])` — katman sırasıyla (alttan üste) dizili block objeleri.
export function generateComponent({ orderedBlocks, componentName, targetDir, canvasWidths, canvasHeights }) {
  // Katman sırası (z-index/DOM order) — kullanıcı uyarısı: block'lar
  // GELDİKLERİ SIRAYLA emit edilir (DOM'da sonra gelen üstte durur),
  // hidden block'lar hiç üretilmez.
  const visibleBlocks = orderedBlocks.filter((b) => b && !b.hidden);
  const nextClassName = makeClassNamer();
  const bindingRegistry = createBindingRegistry();
  const importPrefix = relativeImportPrefix(targetDir);

  const cssRules = [];
  const jsxLines = [];

  for (const block of visibleBlocks) {
    const className = nextClassName(block.componentType);
    cssRules.push(...cssRulesForBlock(block, className, canvasWidths));
    jsxLines.push(jsxForBlock(block, className, bindingRegistry));
  }

  const jsx = renderJsx({ componentName, importPrefix, bindingRegistry, jsxLines });
  const css = renderCss({ canvasWidths, canvasHeights, cssRules });
  return { jsx, css };
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
  return `.page {
  position: relative;
  width: 100%;
  aspect-ratio: ${canvasWidths.base} / ${canvasHeights.base};
  /* fontSize'lar cqw (container-width yüzdesi) ile üretiliyor — bkz.
     cssRules.js fontSizeValue. container-type olmadan cqw çözülmez. */
  container-type: inline-size;
}

${cssRules.join('\n\n')}
`;
}
