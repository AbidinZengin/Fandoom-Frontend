// Eski bloglar (backend'in col/row → x/y/width/height/canvasHeight geçişinden
// ÖNCE kaydedilmiş) bu yeni alanlara sahip değil — backend'de backfill
// migration YOK, sadece yeni nullable kolonlar eklendi (kullanıcı sorusu:
// "var olan blogların bozulmasını nasıl düzelteceğiz" → cevap: bu dosya).
// canvasHeight null ise blog "eski format" sayılır ve TÜM blokları burada
// hesaplanan bir dikey dizilime göre otomatik yerleştirilir — eski 12
// sütunlu grid'in varsayılan kolonlarıyla AYNI oranları taklit eder
// (metin ~3/11 ≈ %67 genişlik, alıntı ~3/10 ≈ %58, görsel ~%85). Editörde
// biri bu bloğu AÇIP KAYDETTİĞİNDE gerçek x/y/width/height backend'e
// yazılır — böylece "tembel migration" gerçekleşir, ayrı bir backfill
// script'i gerekmez. BlogPost.jsx (görüntüleme) ve BlogEditor.data.js
// (düzenleme) İKİSİ de bunu kullanır, aynı sonucu üretsinler diye.
const TYPE_LAYOUT = {
  HEADING: { x: 16.67, width: 66.67, rowPx: 140 },
  PARAGRAPH: { x: 16.67, width: 66.67, rowPx: 160 },
  QUOTE: { x: 16.67, width: 58.33, rowPx: 140 },
  IMAGE: { x: 7.5, width: 85, rowPx: 420 },
};
const ROW_GAP_PX = 48;
const TOP_PADDING_PX = 40;
const BOTTOM_PADDING_PX = 80;

export function applyFallbackCanvasLayout(blocks) {
  let cursorPx = TOP_PADDING_PX;
  const withPixelY = blocks.map((block) => {
    const layout = TYPE_LAYOUT[block.blockType] ?? TYPE_LAYOUT.PARAGRAPH;
    const yPx = cursorPx;
    cursorPx += layout.rowPx + ROW_GAP_PX;
    return { block, layout, yPx };
  });
  const canvasHeight = cursorPx + BOTTOM_PADDING_PX;

  return {
    canvasHeight,
    blocks: withPixelY.map(({ block, layout, yPx }) => ({
      ...block,
      x: block.x ?? layout.x,
      y: block.y ?? (yPx / canvasHeight) * 100,
      width: block.width ?? layout.width,
      height: block.height ?? null,
    })),
  };
}
