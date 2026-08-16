import { jsStringLiteral } from './bindings';

// Bağlı block → optional-chain ifadesi (bindingRegistry.resolve zaten
// döner), bağlı DEĞİLSE → block.content'teki düz değer, JSON.stringify ile
// güvenli kaçışlanmış bir JS string literal'ı olarak `{...}` içine gömülür
// (tırnak/curly-brace gibi karakterler JSX text'e YAZILMAZ, ifade olarak
// taşınır — kaçış sorunu kalmaz).
function valueExpr(block, contentKey, bindingRegistry) {
  if (block.bindings) return `{${bindingRegistry.resolve(block.bindings)}}`;
  return `{${jsStringLiteral(block.content?.[contentKey])}}`;
}

// Bir block'un JSX satırını üretir — component tipine göre dallanır.
// Editördeki TEXT/IMAGE renderer'ların (PageBuilder.blockRenderers.jsx)
// wrapper+iç-eleman ayrımı BURADA YOK — üretilen statik çıktı tek bir
// elemente düzleşir (editördeki ayrım sadece düzenlenebilir bir textarea
// barındırmak içindi, üretilen sayfa salt-okunur JSX'te gerek kalmaz).
export function jsxForBlock(block, className, bindingRegistry) {
  if (block.componentType === 'TEXT') {
    return `      <p className={styles.${className}}>${valueExpr(block, 'text', bindingRegistry)}</p>`;
  }
  if (block.componentType === 'IMAGE') {
    return `      <img className={styles.${className}} src=${valueExpr(block, 'imageUrl', bindingRegistry)} alt="" />`;
  }
  return `      <div className={styles.${className}} />`;
}
