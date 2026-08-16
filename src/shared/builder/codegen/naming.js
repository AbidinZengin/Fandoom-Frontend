// Tip başına kendi sayacıyla okunabilir CSS class adı — kullanıcı
// düzeltmesi: `.block1`/`.block2` yerine `.textBlock1`, `.imageBlock2` gibi,
// sonradan elle müdahaleyi hızlandırır.
export function makeClassNamer() {
  const counters = {};
  return (componentType) => {
    const pascal = componentType.charAt(0) + componentType.slice(1).toLowerCase();
    const key = pascal.charAt(0).toLowerCase() + pascal.slice(1);
    counters[key] = (counters[key] ?? 0) + 1;
    return `${key}Block${counters[key]}`;
  };
}

export function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
