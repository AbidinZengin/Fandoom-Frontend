// Composer'ın kaydettiği **kalın** / _italik_ işaretlerini React elemanına
// çevirir (biçimin diğer yarısı: htmlToRichText.js). HTML üretilmez
// (dangerouslySetInnerHTML yok), metin React tarafından kaçışlanır. İç içe
// biçim özyinelemeyle çözülür (`**_ikisi_**`, `_italik **kalın** italik_`).
// İşaretler TEK SATIR içindir: serializer çok satırlı biçimi her satıra ayrı
// uygular, böylece paragraf bölmesi (\n\n) biçimi ortadan ikiye kesemez.
// Kapanmamış işaret (ör. backend özetinin ortasından kesilmiş "**abc") düz metin
// kalır. Italik `_` yalnız kelime sınırında geçerlidir (snake_case bozulmasın);
// sınır regex'te lookbehind'le DEĞİL kodda kontrol edilir (Safari < 16.4
// lookbehind'de SyntaxError verir) ve Türkçe harfleri kapsayan \p{L} kullanılır.
// Yeni paket eklenmez (markdown kütüphanesi yok) — yalnız bu iki işaret.
const TOKEN = /\*\*(.+?)\*\*|_(\S(?:.*?\S)?)_|\[(.+?)\]\((.+?)\)/gu;
const WORD_CHAR = /[\p{L}\p{N}_]/u;

function parse(text) {
  const nodes = [];
  let last = 0;
  for (const match of text.matchAll(TOKEN)) {
    const [whole, bold, italic, linkText, linkUrl] = match;
    const end = match.index + whole.length;
    // Kelimenin içindeki alt çizgi (snake_case) italik değildir; düz metin kalır.
    if (italic !== undefined && (WORD_CHAR.test(text[match.index - 1] ?? '') || WORD_CHAR.test(text[end] ?? ''))) {
      continue;
    }
    if (match.index > last) nodes.push(text.slice(last, match.index));
    nodes.push(
      bold !== undefined ? (
        <strong key={match.index}>{parse(bold)}</strong>
      ) : italic !== undefined ? (
        <em key={match.index}>{parse(italic)}</em>
      ) : (
        <a key={match.index} href={/^(https?|mailto|tel):/i.test(linkUrl) ? linkUrl : '#'} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>
          {parse(linkText)}
        </a>
      ),
    );
    last = end;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function RichText({ text }) {
  return parse(text);
}
