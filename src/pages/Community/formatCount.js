// Sayaçları kompakt gösterir (120000 → "120K", 1200 → "1.2K"). Dil, açık
// sayfa diline (html lang / tarayıcı) göre Intl tarafından seçilir.
const compact = new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 });

export function formatCount(value) {
  return compact.format(value ?? 0);
}
