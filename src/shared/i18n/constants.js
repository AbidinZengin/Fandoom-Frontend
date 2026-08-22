export const SUPPORTED_LANGS = ['en', 'tr'];
export const DEFAULT_LANG = 'en';

// Mutlak path'e dil prefix'i ekler — path zaten prefixli (ör. depolanmış bir
// returnPath yeniden navigate'e verildiğinde) ise TEKRAR eklemez; aksi halde
// "/tr/tr/..." gibi hiçbir route'a eşleşmeyen ve LegacyRedirect'i sonsuz
// döngüye sokan path'ler oluşurdu.
export function withLangPrefix(to, lang) {
  if (typeof to !== 'string' || !to.startsWith('/') || to.startsWith('/admin')) return to;
  const firstSegment = to.split('/')[1];
  if (SUPPORTED_LANGS.includes(firstSegment)) return to;
  return `/${lang}${to}`;
}
