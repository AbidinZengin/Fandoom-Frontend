import { useState } from 'react';
import { getComponentDefinition } from '../../../../shared/builder/registry';
import { createEmptyBlock } from '../../../../shared/builder/schema';
import { instantiateLibraryEntry } from '../../../../shared/builder/blockLibrary';
import { FANDOOM_VAR_MIME } from '../../../../shared/builder/EntityPicker/EntityPicker';
import { clamp, pixelEdgesOf, trackPointerGesture } from './Canvas.geometry';
import { DRAG_THRESHOLD_PX, DEFAULT_PREVIEW_WIDTH, DEFAULT_PREVIEW_HEIGHT } from './Canvas.constants';

// Tuvale YENİ içerik ekleyen ÜÇ yol — hepsi burada çünkü hepsi "boş
// tuvale bir şey düşürme" temasını paylaşıyor: (1) araç seçiliyken
// sürükle-çiz ile yeni block (handleCanvasPointerDown/handleWrapPointerDown),
// (2) boş alanda sürükleyerek çoklu seçim (startMarquee — araç YOKKEN aynı
// pointerdown'ın diğer dalı), (3) LeftPanel'in Data paletinden bir
// {tip.alan} değişkenini sürükle-bırak (handleCanvasDragOver/Drop). VAR
// OLAN block'ları taşıma/boyutlandırma useBlockGestures'ın işi.
export function usePlacement({ activeTool, activePreset, canvasRef, blocks, breakpoint, onAddBlock, onAddBlockTree, onSelectMany, onSelectBlock, onSelectReference, updateBlock }) {
  const [drawRect, setDrawRect] = useState(null);
  // Boş alanda sürükleyerek çoklu seçim (lasso/marquee) — bkz. startMarquee.
  const [marquee, setMarquee] = useState(null);

  const visibleBlocks = blocks.filter((b) => !b.hidden);

  // Tuvale bileşen ekleme SÜRÜKLEYEREK ÇİZİMDİR (kullanıcı düzeltmesi:
  // "otomatik koyuluyor, sürükleyerek koyamıyorum") — TÜM tiplerde (Rectangle/
  // Diamond/Circle/Text/Image) aynı yol izlenir, tek fonksiyon. pointerdown'da
  // gerçek blok HENÜZ yaratılmaz — önce kesikli bir HAYALET önizleme belirir
  // (kullanıcı isteği: "önce böyle şekil çıksın sonra oluşsun"); sürüklenirse
  // önizleme parmağı takip eder, sürüklenmezse (düz tık) varsayılan boyutta
  // sabit durur. Gerçek blok yalnız pointerup'ta, o an ekranda görünen
  // önizleme dikdörtgeniyle oluşturulur — önizleme ile nihai blok HER ZAMAN
  // aynı geometriden gelir, iki ayrı hesap yolu yok.
  // Boş alanda sürükle → dikdörtgen alan içine giren TÜM blokları seçer
  // (kullanıcı isteği: "sol tıka basılı tutup çoklu seçebilmeliyim").
  // Sürüklenmezse (düz tık) eskisi gibi seçimi temizler.
  const startMarquee = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const startClientX = e.clientX, startClientY = e.clientY;
    const startX = startClientX - rect.left, startY = startClientY - rect.top;
    let dragged = false;
    let finalRect = { x1: startX, y1: startY, x2: startX, y2: startY };

    const onMove = (ev) => {
      if (!dragged && Math.hypot(ev.clientX - startClientX, ev.clientY - startClientY) < DRAG_THRESHOLD_PX) return;
      dragged = true;
      finalRect = { x1: startX, y1: startY, x2: ev.clientX - rect.left, y2: ev.clientY - rect.top };
      setMarquee(finalRect);
    };

    trackPointerGesture(onMove, () => {
      setMarquee(null);
      if (!dragged) {
        onSelectMany([]);
        return;
      }
      const box = {
        left: Math.min(finalRect.x1, finalRect.x2),
        right: Math.max(finalRect.x1, finalRect.x2),
        top: Math.min(finalRect.y1, finalRect.y2),
        bottom: Math.max(finalRect.y1, finalRect.y2),
      };
      const canvasCtx = { el: canvasRef.current, rect };
      const hits = blocks.filter((b) => {
        if (b.hidden) return false;
        const edges = pixelEdgesOf(b, breakpoint, canvasCtx);
        const bottom = edges.bottom ?? edges.top;
        return edges.left < box.right && edges.right > box.left && edges.top < box.bottom && bottom > box.top;
      });
      onSelectMany(hits.map((b) => b.id));
    });
  };

  const handleCanvasPointerDown = (e) => {
    if (!activeTool) {
      // Marquee sadece BOŞ alanda başlar — bir bloğun üstündeyken bu dal
      // zaten useBlockGestures'ın handleBlockPointerDown'ı tarafından ele
      // alınmış olur.
      if (e.target !== e.currentTarget) return;
      onSelectReference(false);
      // Bkz. useBlockGestures'taki AYNI blur düzeltmesi — boş alana
      // tıklayınca da odak eski bir textarea'da kalmasın.
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      startMarquee(e);
      return;
    }
    // Araç aktifken hedef ne olursa olsun (bir bloğun üstü dahil) yeni blok
    // yerleştirilir — handleBlockPointerDown bu durumda hiçbir şey yapmadan
    // olayı buraya bırakır. Kullanıcı raporu: "componentler canvas dışında
    // bir yerde de üretilebilip sürüklenebilmeli" — tuvalin (artboard)
    // DIŞINA tıklama da kabul edilir (bkz. handleWrapPointerDown), bu yüzden
    // yüzde 0-100 ARALIĞINA ARTIK KENETLENMEZ (negatif/100+ değer = artboard
    // dışında "askıda" blok, sonra elle sürükleyip içine taşınır —
    // useBlockGestures'taki resize/move mekaniği zaten bu değerleri olduğu
    // gibi kabul ediyor).
    const rect = canvasRef.current.getBoundingClientRect();
    const startClientX = e.clientX, startClientY = e.clientY;
    const startXPct = ((startClientX - rect.left) / rect.width) * 100;
    const startYPct = ((startClientY - rect.top) / rect.height) * 100;
    let dragged = false;
    // Nihai dikdörtgen bir REF'te tutulur, setDrawRect'in updater'ında
    // DEĞİL — React 19 StrictMode dev'de setState updater'ları saflık
    // kontrolü için İKİ KEZ çalıştırır; onAddBlock gibi bir yan etki oraya
    // konursa blok İKİ KEZ eklenir (manuel testte "sürükleyince yenisi
    // oluşuyor" olarak yakalandı — aslında üst üste ikinci bir blok).
    // TEXT düz tıkla (sürüklemeden) yerleştirilince kullanıcı raporu:
    // "metin kutusu aşırı geniş" — şekillerin (RECT/DIAMOND/CIRCLE/IMAGE)
    // varsayılan önizleme genişliğinden (DEFAULT_PREVIEW_WIDTH, %30) DAHA
    // DAR bir varsayılanla başlar, tek satırlık bir etiket/başlık hissi
    // için (%15). Sürüklenirse zaten kullanıcının çizdiği boyut kullanılır.
    const initialWidth = activeTool === 'TEXT' ? DEFAULT_PREVIEW_WIDTH / 2 : DEFAULT_PREVIEW_WIDTH;
    let finalRect = { x1: startXPct - initialWidth / 2, y1: startYPct, x2: startXPct + initialWidth / 2, y2: startYPct + DEFAULT_PREVIEW_HEIGHT };
    setDrawRect(finalRect);

    const onMove = (ev) => {
      if (!dragged && Math.hypot(ev.clientX - startClientX, ev.clientY - startClientY) < DRAG_THRESHOLD_PX) return;
      dragged = true;
      const curXPct = ((ev.clientX - rect.left) / rect.width) * 100;
      const curYPct = ((ev.clientY - rect.top) / rect.height) * 100;
      finalRect = { x1: startXPct, y1: startYPct, x2: curXPct, y2: curYPct };
      setDrawRect(finalRect);
    };

    trackPointerGesture(onMove, () => {
      setDrawRect(null);
      // Yeni block HER ZAMAN base'te tanımlanır — hangi breakpoint'i
      // görüntülüyor olursan ol, taban değeri bu (md/lg sonradan elle
      // override edilir, bkz. schema.js layout yorumu). TEXT sürüklenmeden
      // (düz tık) yerleştirilince içeriğe göre otomatik büyümesi için h:null
      // kalır. Diğer tipler (Rectangle/Diamond/Circle/Image) için null
      // bırakmak, önizlemede görünen kutudan farklı (min-height'a göre
      // değişken) bir final boyuta yol açıyordu (kullanıcı raporu: "şekil
      // beliriyor sonra yok oluyor") — önizlemeyle AYNI DEFAULT_PREVIEW_HEIGHT
      // burada da kullanılıyor.
      const finalLayout = {
        x: Math.min(finalRect.x1, finalRect.x2),
        y: Math.min(finalRect.y1, finalRect.y2),
        w: Math.max(Math.abs(finalRect.x2 - finalRect.x1), 3),
        h: dragged ? Math.max(Math.abs(finalRect.y2 - finalRect.y1), 3) : activeTool === 'TEXT' ? null : DEFAULT_PREVIEW_HEIGHT,
      };

      // Kütüphaneden (blockLibrary.js) yerleştirilen bir CONTAINER preset'i
      // — TEK blok değil, kaydedilen tüm alt-ağaç (kullanıcı kararı,
      // 2026-08-19: "container kütüphanesi daha mantıklı") birlikte
      // materialize edilir. `flow` de burada (instantiateLibraryEntry
      // üzerinden) taşınır — düz tekil-blok yolu (aşağıda) sadece
      // content/styles/customCss'i bilir, flow'u YOK SAYARDI.
      if (activePreset?.componentType === 'CONTAINER') {
        const [root, ...descendants] = instantiateLibraryEntry(activePreset, { x: startXPct, y: startYPct });
        root.layout.base = { ...finalLayout, h: null };
        onAddBlockTree([root, ...descendants]);
        return;
      }

      const definition = getComponentDefinition(activeTool);
      // PRESET_VARIANTS'tan seçilmişse (bkz. LeftPanel preset tile'ları)
      // registry'nin defaultContent/defaultStyles'ı YERİNE preset'in kendi
      // demeti kullanılır — componentType/renderer/controls AYNI kalır,
      // sadece blok bu hazır içerik/stille doğar.
      const effectiveDefinition = activePreset
        ? { ...definition, defaultContent: activePreset.content, defaultStyles: activePreset.styles, defaultHoverStyles: activePreset.hoverStyles }
        : definition;
      const block = createEmptyBlock(activeTool, { x: startXPct, y: startYPct }, effectiveDefinition);
      // Kütüphaneden yerleştirilen preset'ler kendi customCss'ini de taşır —
      // createEmptyBlock bunu hiç bilmiyor (her zaman '' ile başlar),
      // PRESET_VARIANTS'ın hiçbirinde customCss olmadığı için bu satır
      // onlar için no-op.
      if (activePreset?.customCss) block.customCss = activePreset.customCss;
      block.layout.base = finalLayout;
      onAddBlock(block);
    });
  };

  // .canvas'ın (artboard) DIŞINDAKİ boş tuval alanına tıklama — SADECE
  // canvasWrap'in kendi arka planına (e.target === e.currentTarget, yani
  // hiçbir alt öğenin — artboard, blok, align/zoom bar — üstünde değilken)
  // düşer, aynı yerleştirme mantığını (handleCanvasPointerDown) delege eder.
  const handleWrapPointerDown = (e) => {
    if (!activeTool || e.target !== e.currentTarget) return;
    handleCanvasPointerDown(e);
  };

  // LeftPanel'in Data paletinden sürüklenen bir {tip.alan} değişkenini
  // bırakma — HTML5 DnD, LeftPanel__list'in katman yeniden sıralamasında
  // zaten kullandığı deseni (draggable/onDragStart/onDrop) izler. Bırakılan
  // noktada UYUMLU bir block varsa (aynı bindableField.kind) onu rebind
  // eder, yoksa boş alana yeni bir TEXT/IMAGE block'u zaten bağlı olarak
  // oluşturur — ikisi de aynı payload'ı okur, tek fark hedefin var olup
  // olmadığı.
  const handleCanvasDragOver = (e) => {
    if (e.dataTransfer.types.includes(FANDOOM_VAR_MIME)) e.preventDefault();
  };

  const handleCanvasDrop = (e) => {
    const raw = e.dataTransfer.getData(FANDOOM_VAR_MIME);
    if (!raw) return;
    e.preventDefault();
    const payload = JSON.parse(raw);
    const rect = canvasRef.current.getBoundingClientRect();
    const canvasCtx = { el: canvasRef.current, rect };
    const xPct = clamp(((e.clientX - rect.left) / rect.width) * 100, 0, 100);
    const yPct = clamp(((e.clientY - rect.top) / rect.height) * 100, 0, 100);
    const dropPx = { left: e.clientX - rect.left, top: e.clientY - rect.top };

    const target = visibleBlocks.find((b) => {
      const edges = pixelEdgesOf(b, breakpoint, canvasCtx);
      const bottom = edges.bottom ?? edges.top;
      return dropPx.left >= edges.left && dropPx.left <= edges.right && dropPx.top >= edges.top && dropPx.top <= bottom;
    });

    if (target) {
      const definition = getComponentDefinition(target.componentType);
      if (definition?.bindableField?.kind !== payload.kind) return;
      updateBlock(target.id, {
        bindings: { entityType: payload.entityType, entityId: payload.entityId, field: payload.field },
        content: { ...target.content, [definition.bindableField.key]: payload.value },
      });
      onSelectBlock(target.id);
      return;
    }

    const componentType = payload.kind === 'image' ? 'IMAGE' : 'TEXT';
    const definition = getComponentDefinition(componentType);
    const block = createEmptyBlock(componentType, { x: xPct, y: yPct }, definition);
    if (componentType === 'IMAGE') block.layout.base.h = DEFAULT_PREVIEW_HEIGHT;
    block.bindings = { entityType: payload.entityType, entityId: payload.entityId, field: payload.field };
    block.content = { ...block.content, [definition.bindableField.key]: payload.value };
    onAddBlock(block);
  };

  return { drawRect, marquee, visibleBlocks, handleCanvasPointerDown, handleWrapPointerDown, handleCanvasDragOver, handleCanvasDrop };
}
