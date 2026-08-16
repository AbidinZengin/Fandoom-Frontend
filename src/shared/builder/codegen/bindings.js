import { ENTITY_FETCH_META } from './entityFetchMeta';
import { capitalize } from './naming';

// "blocks.8.imageUrl" → "blog21?.blocks?.[8]?.imageUrl" — sayısal parçalar
// dizi erişimi, geri kalanı property erişimi olur (bkz. schema.js
// resolveBinding'in dot-path kuralı, aynı path formatı).
export function fieldToOptionalChain(varName, field) {
  return field.split('.').reduce((acc, part) => (/^\d+$/.test(part) ? `${acc}?.[${part}]` : `${acc}?.${part}`), varName);
}

function sanitizeIdForIdentifier(id) {
  return String(id).replace(/[^a-zA-Z0-9]/g, '');
}

// entityId, tarayıcıdan gelen bir input değeri olduğu için hep string'dir
// (ör. "3") — ama backend ID'leri sayısal, üretilen kodda `"3"` gibi
// tırnaklı görünmesi yanıltıcı olurdu (işlevsel olarak zararsız, template
// literal ikisini de aynı URL'ye çevirir, ama okunabilirlik için sayısal
// görünen değerler çıplak sayı literal'i olarak gömülür).
function idLiteral(id) {
  return /^\d+$/.test(String(id)) ? String(id) : JSON.stringify(id);
}

// Sayfadaki tüm block'lar taranırken distinct (entityType,entityId) çiftini
// TEK bir değişkene/fetch'e indirger (aynı kayda bağlı birden çok block
// tekrar fetch üretmesin) — kullanılan `src/shared/api/*` fonksiyonlarının
// import listesini de aynı anda toplar.
export function createBindingRegistry() {
  const vars = new Map(); // `${type}:${id}` -> { varName, call }
  const importsByModule = new Map(); // module -> Set(importName)

  const registerImport = (importName, module) => {
    if (!importsByModule.has(module)) importsByModule.set(module, new Set());
    importsByModule.get(module).add(importName);
  };

  return {
    // Block'un binding'ini kaydeder, JSX'te kullanılacak optional-chain
    // ifadesini döner (`{...}` OLMADAN — çağıran sarmalar).
    resolve(binding) {
      const key = `${binding.entityType}:${binding.entityId}`;
      if (!vars.has(key)) {
        const meta = ENTITY_FETCH_META[binding.entityType];
        registerImport(meta.importName, meta.module);
        vars.set(key, { varName: `${binding.entityType}${sanitizeIdForIdentifier(binding.entityId)}`, call: meta.call(idLiteral(binding.entityId)) });
      }
      return fieldToOptionalChain(vars.get(key).varName, binding.field);
    },
    list() {
      return [...vars.values()];
    },
    stateLines() {
      return this.list().map((b) => `  const [${b.varName}, set${capitalize(b.varName)}] = useState(null);`);
    },
    effectLines() {
      return this.list().map((b) => `  useEffect(() => {\n    ${b.call}.then(set${capitalize(b.varName)});\n  }, []);`);
    },
    guardCondition() {
      return this.list()
        .map((b) => `${b.varName} == null`)
        .join(' || ');
    },
    importLines(importPrefix) {
      return [...importsByModule.entries()].map(([module, names]) => `import { ${[...names].join(', ')} } from '${importPrefix}${module}';`).join('\n');
    },
  };
}

export function jsStringLiteral(value) {
  return JSON.stringify(value ?? '');
}
