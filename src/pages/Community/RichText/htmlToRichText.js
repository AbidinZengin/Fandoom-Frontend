// Composer'ın contenteditable editörünü backend'in sakladığı düz metne çevirir:
// kalın → **x**, italik → _x_, satır sonu → \n (RichText.jsx ters yönü okur).
// Editör HTML'i yalnız <b>/<strong>, <i>/<em>, <br> ve tarayıcının açtığı
// <div>/<p> satırlarıdır; diğer her şey (ör. altı çizili) düz metne iner.
// Boşluk işaretin DIŞINA taşınır: "_x _" italik olarak okunmaz. İşaret her
// SATIRA ayrı uygulanır (RichText tek satırlık işaret okur; çok satırlı biçim
// tek işaretle sarılırsa kart/detay bölmesinde yarım işaret görünürdü).
function wrapLine(mark, line) {
  const [, lead, core, tail] = line.match(/^(\s*)([\s\S]*?)(\s*)$/);
  return core ? `${lead}${mark}${core}${mark}${tail}` : line;
}

function wrap(mark, inner) {
  return inner
    .split('\n')
    .map((line) => wrapLine(mark, line))
    .join('\n');
}

export function htmlToRichText(root) {
  let out = '';
  root.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      out += node.textContent;
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    if (node.nodeName === 'BR') {
      out += '\n';
      return;
    }
    let inner = htmlToRichText(node);
    const { fontWeight, fontStyle } = node.style;
    if (['B', 'STRONG'].includes(node.nodeName) || fontWeight === 'bold' || Number(fontWeight) >= 600) {
      inner = wrap('**', inner);
    }
    if (['I', 'EM'].includes(node.nodeName) || fontStyle === 'italic') inner = wrap('_', inner);
    if (node.nodeName === 'A') {
      const href = node.getAttribute('href');
      // Replace formatting inside links with just text, or keep it.
      // Usually keeping it simple is best, but inner contains formatted text.
      if (href) {
        inner = `[${inner}](${href})`;
      }
    }
    // Blok satırlar (Enter/yapıştırma) önceki satırdan yeni satırla ayrılır.
    if (['DIV', 'P'].includes(node.nodeName) && out && !out.endsWith('\n')) out += '\n';
    out += inner;
  });
  return out;
}
