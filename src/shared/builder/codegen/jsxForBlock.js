import { jsStringLiteral } from './bindings';
import { CONTENT_ICONS } from '../contentIcons';
import { LOGO_VARIANTS } from '../logoVariants';

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
  if (block.componentType === 'BUTTON') {
    const label = valueExpr(block, 'text', bindingRegistry);
    const to = block.content?.to;
    if (to) {
      bindingRegistry.registerStaticImport('Link', 'react-router-dom');
      return `      <Link to=${jsStringLiteral(to)} className={styles.${className}}>${label}</Link>`;
    }
    return `      <button type="button" className={styles.${className}}>${label}</button>`;
  }
  if (block.componentType === 'LOGO') {
    const variant = LOGO_VARIANTS[block.content?.variant];
    let logo;
    if (variant) {
      logo = `<img src="${variant.src}" alt="${variant.alt}" />`;
    } else {
      bindingRegistry.registerStaticImport('FandoomLogo', 'components/FandoomLogo/FandoomLogo');
      logo = '<FandoomLogo showTagline={false} />';
    }
    const to = block.content?.to;
    if (to) {
      bindingRegistry.registerStaticImport('Link', 'react-router-dom');
      return `      <Link to=${jsStringLiteral(to)} className={styles.${className}}>${logo}</Link>`;
    }
    return `      <div className={styles.${className}}>${logo}</div>`;
  }
  if (block.componentType === 'ICON') {
    const icon = CONTENT_ICONS[block.content?.icon] ?? CONTENT_ICONS.star;
    const fill = icon.filled ? 'currentColor' : 'none';
    const stroke = icon.filled ? 'none' : 'currentColor';
    const svg = `<svg className={styles.${className}} viewBox="${icon.viewBox}" fill="${fill}" stroke="${stroke}" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="${icon.path}" /></svg>`;
    const to = block.content?.to;
    if (to) {
      bindingRegistry.registerStaticImport('Link', 'react-router-dom');
      return `      <Link to=${jsStringLiteral(to)}>${svg}</Link>`;
    }
    return `      ${svg}`;
  }
  return `      <div className={styles.${className}} />`;
}
