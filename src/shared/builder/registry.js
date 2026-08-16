// Component Registry — `src/pages/series/BreakingBad/OldHero/heroBlockRenderers.jsx`
// içindeki BLOCK_RENDERERS (type→component eşlemesi) ve ANIMATION_PRESETS.params
// (schema-driven kontrol) desenlerinin genellemesi. Bu görevde gerçek bir
// componentType KAYITLI DEĞİL — editör migration'larında her tip burada
// registerComponent() ile tanımlanacak.
//
// definition şekli:
//   {
//     name: string,                 // panelde görünen ad
//     component: React.Component,   // tuvalde çizilecek bileşen
//     defaultContent: object,       // createEmptyBlock() için başlangıç content'i
//     defaultStyles: object,        // createEmptyBlock() için başlangıç styles.base.normal'ı
//     controls: [                   // PropertyFactory'nin okuyacağı deklaratif kontrol listesi
//       { key, label, type: 'select'|'color'|'size'|'slider'|'text', options?, min?, max?, step?, default },
//     ],
//   }
const registry = new Map();

export function registerComponent(componentType, definition) {
  registry.set(componentType, definition);
}

export function getComponentDefinition(componentType) {
  return registry.get(componentType);
}

export function listComponentTypes() {
  return Array.from(registry.keys());
}

// Test/geliştirme sırasında registry'yi sıfırlamak için — örn. dev test
// route'unun her mount'ta temiz başlaması.
export function clearRegistry() {
  registry.clear();
}
