import { useEffect, useRef, useState } from 'react';
import { makeBlockId } from '../../../../shared/builder/schema';
import { resolveEffectiveStyle, resolveEffectiveLayout, patchLayoutMatrix } from '../PageBuilder.data';
import { clamp, withGlobalCursor, parseObjectPosition, findSnap, findCollision, findContainerAtPoint, getBlockPxSize, pixelEdgesOf, trackPointerGesture } from './Canvas.geometry';
import { RESIZE_CURSOR, DRAG_THRESHOLD_PX } from './Canvas.constants';

// VAR OLAN block'ları taşıma/boyutlandırma/seçme/hizalama — tuvale YENİ
// block eklemek usePlacement'ın işi, referans görsel useReferenceImage'ın.
// Bu üçü ayrı hook'lar çünkü üçü de kendi state'ini (guides/collidingId/
// panningBlockId burada; drawRect/marquee usePlacement'ta; referenceOffset/
// Size useReferenceImage'ta) taşıyor — birleştirilseydi Canvas.jsx'in eski
// 1000+ satırlık tek-blok hâli geri gelirdi.
//
// `blocksById`/`onReparentBlock`: Faz 3 nested/auto-layout sürükle-bırak
// (bkz. docs/plans/2026-08-18-pagebuilder-nested-blocks-design.md) —
// container hit-testing (findContainerAtPoint) tüm bloklara pointer id'yle
// erişmek için düz map ister, `blocks` (root sırası) yetmez.
export function useBlockGestures({ blocks, blocksById, breakpoint, canvasRef, updateBlock, onReparentBlock, onSelectBlock, onSelectMany, selectedIds, activeTool, onAddBlock, onPatchStyle, onSelectReference }) {
  const [guides, setGuides] = useState({ v: null, h: null });
  const [collidingId, setCollidingId] = useState(null);
  // Nested drag hedefi — CONTAINER'ın üstündeyken vurgulanır (Canvas.jsx
  // `data-drop-target`). Ghost: bir CHILD blok sürüklenirken (kendi
  // position:static'i yüzünden imleci takip edemediği için) imlecin
  // yanında gösterilen küçük önizleme.
  const [dropTargetContainerId, setDropTargetContainerId] = useState(null);
  const [dragGhost, setDragGhost] = useState(null); // { block, x, y } | null
  // trackPointerGesture'ın onEnd'i son pointer event'ini ALMAZ — drop anındaki
  // imleç konumunu (kök'e bırakırken x/y hesaplamak için) ref'te tutuyoruz.
  const lastPointerRef = useRef({ x: 0, y: 0 });
  // React state (dropTargetContainerId) SADECE render/görsel vurgu için —
  // onEnd callback'i tanımlandığı andaki state'i KAPATIR (stale closure),
  // gerçek "drop anındaki hedef" burada, ref'te tutulur ve onEnd bunu okur.
  const dropTargetRef = useRef(null);
  // IMAGE block'a çift tıklayınca girilen "kaydırma modu" — bu modda o
  // block'un üstünde sürüklemek block'u TAŞIMAZ, içindeki görseli
  // object-position ile kutunun içinde kaydırır (bkz. startImagePan).
  // Kullanıcı raporu: "kırpma çapası değil, elimle kırpabiliyor olmalıyım".
  const [panningBlockId, setPanningBlockId] = useState(null);

  // Panning modundan çıkış: block'un DIŞINA tıklama veya Escape.
  useEffect(() => {
    if (!panningBlockId) return undefined;
    const onPointerDownOutside = (e) => {
      const el = canvasRef.current?.querySelector(`[data-block-id="${panningBlockId}"]`);
      if (el && !el.contains(e.target)) setPanningBlockId(null);
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setPanningBlockId(null);
    };
    window.addEventListener('pointerdown', onPointerDownOutside, true);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pointerdown', onPointerDownOutside, true);
      window.removeEventListener('keydown', onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panningBlockId]);

  // groupMembers verilirse (2+ blok) hepsi AYNI delta ile birlikte taşınır —
  // snap/collision grup taşımada BİLİNÇLİ olarak devre dışı (her üyeye göre
  // ayrı hesap karmaşıklaşırdı, kapsam v1 için tek-blok davranışıyla sınırlı
  // tutuldu).
  const startDrag = (block, startEvent, groupMembers) => {
    if (block.locked) return;
    const group = groupMembers && groupMembers.length > 1 ? groupMembers.filter((b) => !b.locked) : null;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const canvasCtx = { el: canvasRef.current, rect: canvasRect };
    const startClientX = startEvent.clientX, startClientY = startEvent.clientY;

    if (group) {
      const startLayouts = new Map(group.map((b) => [b.id, resolveEffectiveLayout(b, breakpoint)]));
      let dragging = false;
      let restoreCursor = null;
      const onMove = (ev) => {
        const dxClient = ev.clientX - startClientX, dyClient = ev.clientY - startClientY;
        // Eşik SADECE imleç/blur yan etkisini geciktirir — pozisyon HER
        // ZAMAN akıcı takip eder. Aksi halde eşiğe kadar hiçbir şey
        // güncellenmiyor, eşik aşılınca birikmiş delta bir anda uygulanıp
        // blok imlece göre çapraz "sıçrıyordu" (kullanıcı raporu:
        // "sürüklemeye başlarken imleçle blok arasında mesafe oluşuyor").
        if (!dragging && Math.hypot(dxClient, dyClient) >= DRAG_THRESHOLD_PX) {
          dragging = true;
          if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
          restoreCursor = withGlobalCursor('move');
        }
        // TEXT blokları artık tek tıkla direkt yazılabilir (textarea her
        // zaman etkileşimli) — bunun bedeli, sürükleme metnin üzerinden
        // başlarsa tarayıcının native "metni seç" davranışının da devreye
        // girmesi. Sürüklerken her tick'te oluşan seçimi temizleyip sadece
        // blok taşımasını görünür bırakıyoruz.
        if (dragging) window.getSelection()?.removeAllRanges();
        const dxPct = (dxClient / canvasRect.width) * 100;
        const dyPct = (dyClient / canvasRect.height) * 100;
        // 0-100 aralığına KENETLEME YOK — block'lar artboard dışına da
        // taşınabilmeli (bkz. usePlacement'taki AYNI karar).
        group.forEach((b) => {
          const start = startLayouts.get(b.id);
          updateBlock(b.id, { layout: patchLayoutMatrix(b.layout, breakpoint, { x: start.x + dxPct, y: start.y + dyPct }) });
        });
      };
      trackPointerGesture(onMove, () => restoreCursor?.());
      return;
    }

    onSelectBlock(block.id);
    const startLayout = resolveEffectiveLayout(block, breakpoint);
    const startX = startLayout.x, startY = startLayout.y;
    let dragging = false;
    let restoreCursor = null;

    const onMove = (ev) => {
      lastPointerRef.current = { x: ev.clientX, y: ev.clientY };
      const dxClient = ev.clientX - startClientX, dyClient = ev.clientY - startClientY;
      // Bkz. grup sürükleme yorumundaki aynı düzeltme — eşik pozisyonu
      // GECİKTİRMEZ, sadece imleç/blur yan etkisini tetikler.
      if (!dragging && Math.hypot(dxClient, dyClient) >= DRAG_THRESHOLD_PX) {
        dragging = true;
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
        restoreCursor = withGlobalCursor('move');
      }
      if (dragging) window.getSelection()?.removeAllRanges();
      const widthPx = (startLayout.w / 100) * canvasRect.width;
      const el = canvasRef.current?.querySelector(`[data-block-id="${block.id}"]`);
      const heightPx = startLayout.h != null ? (startLayout.h / 100) * canvasRect.height : (el?.getBoundingClientRect().height ?? null);

      let leftPx = (startX / 100) * canvasRect.width + dxClient;
      let topPx = (startY / 100) * canvasRect.height + dyClient;

      const snap = findSnap(blocks, block.id, leftPx, topPx, widthPx, heightPx, breakpoint, canvasCtx);
      leftPx -= snap.deltaX;
      topPx -= snap.deltaY;
      setGuides({ v: snap.guideX, h: snap.guideY });
      // Kırmızı kesikli outline SADECE görsel bir ipucu — çakışma artık
      // z-sırasını OTOMATİK değiştirmiyor (bkz. onUp yorumu).
      setCollidingId(findCollision(blocks, block.id, leftPx, topPx, widthPx, heightPx, breakpoint, canvasCtx));
      // Nested/auto-layout (Faz 3) — SERBEST bir bloğu bir CONTAINER'ın
      // üstüne sürüklerken hedefi vurgula (Canvas.jsx `data-drop-target`).
      const hoveredContainerId = dragging ? findContainerAtPoint(canvasRef.current, blocksById, ev.clientX, ev.clientY, block.id) : null;
      dropTargetRef.current = hoveredContainerId;
      setDropTargetContainerId(hoveredContainerId);

      // 0-100 aralığına KENETLEME YOK — kullanıcı raporu: "componentler
      // canvas dışında bir yerde de üretilebilip sürüklenebilmeli" — artboard
      // sınırı sadece görsel bir çerçeve, konum verisini kısıtlamıyor.
      const nextX = (leftPx / canvasRect.width) * 100;
      const nextY = (topPx / canvasRect.height) * 100;
      updateBlock(block.id, { layout: patchLayoutMatrix(block.layout, breakpoint, { x: nextX, y: nextY }) });
    };

    trackPointerGesture(onMove, () => {
      setGuides({ v: null, h: null });
      setCollidingId(null);
      restoreCursor?.();
      // Bırakılan an bir CONTAINER'ın üstündeyse içine katılır — x/y artık
      // anlamsız (flex akışından gelecek), reparentBlock bunu childOrder'a
      // ekler. Sona eklenir (sıralama Layers panelinden yapılabilir).
      // pxSize: reparent'tan ÖNCE (blok hâlâ eski absolute konumundayken)
      // okunur — kullanıcı kararı (2026-08-19): container'a giren VAR OLAN
      // bloğun görünümü değişmemeli.
      if (dropTargetRef.current) onReparentBlock(block.id, dropTargetRef.current, null, getBlockPxSize(block.id));
      dropTargetRef.current = null;
      setDropTargetContainerId(null);
      // ESKİ davranış (kaldırıldı, kullanıcı düzeltmesiyle TERS ÇEVRİLDİ):
      // çakışınca sürüklenen blok otomatik en öne alınıyordu. Kullanıcı
      // kararı: "bir componentin üstüne başka component koyulduysa o
      // component aksi belirtilmedikçe ASLA arkasındakinin altına layer
      // olarak düşemez" — z-sırası artık SADECE explicit eylemle
      // (Bring to front/Send to back butonu) değişir, sürükleme/çakışma
      // sessizce değiştirmez.
    });
  };

  // CONTAINER çocuğu bir bloğu sürükleme — normal startDrag'ten FARKLI,
  // çünkü child'ın konumu artık x/y DEĞİL flex akışından geliyor
  // (position:static, bkz. Canvas.jsx `data-in-flow`). Kendi DOM elemanını
  // taşımak yerine imleci takip eden küçük bir "ghost" gösterilir
  // (dragGhost state'i, Canvas.jsx render eder). Bırakılan an: bir
  // CONTAINER'ın üstündeyse oraya (yeniden) katılır, boş tuval alanına
  // bırakılırsa köke serbest bloğa döner (imleç konumundan x/y hesaplanır).
  // Aynı container'ın İÇİNDE yeniden sıralama BİLİNÇLİ olarak burada YOK —
  // Layers panelinde zaten tam destekleniyor (before/after/into), aynı
  // pixel-tabanlı sıralamayı burada tekrarlamak kapsamı gereksiz büyütür.
  const startChildDrag = (block, startEvent) => {
    if (block.locked) return;
    onSelectBlock(block.id);
    const startClientX = startEvent.clientX, startClientY = startEvent.clientY;
    let dragging = false;
    let restoreCursor = null;

    const onMove = (ev) => {
      lastPointerRef.current = { x: ev.clientX, y: ev.clientY };
      const dx = ev.clientX - startClientX, dy = ev.clientY - startClientY;
      if (!dragging && Math.hypot(dx, dy) >= DRAG_THRESHOLD_PX) {
        dragging = true;
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
        restoreCursor = withGlobalCursor('grabbing');
      }
      if (!dragging) return;
      window.getSelection()?.removeAllRanges();
      setDragGhost({ block, x: ev.clientX, y: ev.clientY });
      const hoveredContainerId = findContainerAtPoint(canvasRef.current, blocksById, ev.clientX, ev.clientY, block.id);
      dropTargetRef.current = hoveredContainerId;
      setDropTargetContainerId(hoveredContainerId);
    };

    trackPointerGesture(onMove, () => {
      restoreCursor?.();
      setDragGhost(null);
      setDropTargetContainerId(null);
      if (!dragging) {
        dropTargetRef.current = null;
        return;
      }
      if (dropTargetRef.current) {
        // Aynı container'a geri bırakıldıysa dokunma — sıralama Layers'ın işi.
        // Farklı bir container'a giriyorsa görünümü donduran pxSize (bkz.
        // yukarıdaki startDrag'in AYNI yorumu) reparent'tan ÖNCE okunur.
        if (dropTargetRef.current !== block.parentId) onReparentBlock(block.id, dropTargetRef.current, null, getBlockPxSize(block.id));
      } else {
        // Boş tuval alanına bırakıldı — köke serbest blok olarak döner,
        // x/y son imleç konumundan hesaplanır.
        const canvasRect = canvasRef.current.getBoundingClientRect();
        const w = block.layout?.base?.w ?? 30;
        const nextX = clamp(((lastPointerRef.current.x - canvasRect.left) / canvasRect.width) * 100 - w / 2, 0, 100 - w);
        const nextY = clamp(((lastPointerRef.current.y - canvasRect.top) / canvasRect.height) * 100, 0, 100);
        onReparentBlock(block.id, null, null);
        updateBlock(block.id, { layout: patchLayoutMatrix(block.layout, breakpoint, { x: nextX, y: nextY }) });
      }
      dropTargetRef.current = null;
    });
  };

  const startResize = (block, direction, startEvent) => {
    if (block.locked) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const startClientX = startEvent.clientX, startClientY = startEvent.clientY;
    const startLayout = resolveEffectiveLayout(block, breakpoint);
    const startX = startLayout.x, startY = startLayout.y, startWidth = startLayout.w;
    const el = canvasRef.current?.querySelector(`[data-block-id="${block.id}"]`);
    const startHeight = startLayout.h ?? ((el?.getBoundingClientRect().height ?? 0) / canvasRect.height) * 100;
    const restoreCursor = withGlobalCursor(RESIZE_CURSOR[direction] ?? 'nwse-resize');

    const onMove = (ev) => {
      const dxPct = ((ev.clientX - startClientX) / canvasRect.width) * 100;
      const dyPct = ((ev.clientY - startClientY) / canvasRect.height) * 100;
      let x = startX, y = startY, w = startWidth, h = startLayout.h;

      if (direction.includes('e')) w = clamp(startWidth + dxPct, 6, 100 - startX);
      if (direction.includes('w')) { const nw = clamp(startWidth - dxPct, 6, startX + startWidth); x = startX + startWidth - nw; w = nw; }
      if (direction.includes('s')) h = clamp(startHeight + dyPct, 3, 100 - startY);
      if (direction.includes('n')) { const nh = clamp(startHeight - dyPct, 3, startY + startHeight); y = startY + startHeight - nh; h = nh; }

      updateBlock(block.id, { layout: patchLayoutMatrix(block.layout, breakpoint, { x, y, w, h }) });
    };

    trackPointerGesture(onMove, restoreCursor);
  };

  // IMAGE block'a çift tıklayınca (panningBlockId set edilince) bu jest
  // devreye girer — normal blok taşımanın (startDrag) YERİNE geçer.
  // object-position "NN% NN%" ile sürüklemeyi DOĞRUDAN takip eder: mouse
  // aşağı/sağa gittikçe görsel "elle çekiliyormuş" gibi aynı yöne kayar
  // (yani daha ÖNCESİ görünür olur) — bu yüzden delta ÇIKARILIR, eklenmez.
  const startImagePan = (block, startEvent) => {
    const el = canvasRef.current?.querySelector(`[data-block-id="${block.id}"]`);
    const box = el?.getBoundingClientRect();
    if (!box) return;
    const [startX, startY] = parseObjectPosition(resolveEffectiveStyle(block, breakpoint, 'normal').objectPosition);
    const startClientX = startEvent.clientX, startClientY = startEvent.clientY;
    const restoreCursor = withGlobalCursor('grabbing');

    const onMove = (ev) => {
      const dx = ev.clientX - startClientX, dy = ev.clientY - startClientY;
      const nextX = clamp(startX - (dx / box.width) * 100, 0, 100);
      const nextY = clamp(startY - (dy / box.height) * 100, 0, 100);
      onPatchStyle({ objectPosition: `${nextX}% ${nextY}%` });
    };
    trackPointerGesture(onMove, restoreCursor);
  };

  // Shift+tık: çoklu seçime ekle/çıkar (sürükleme BAŞLATMAZ — Figma'da da
  // shift+tık sadece seçim değiştirir, taşımak için ayrı bir sürükleme gerekir).
  // Alt+sürükle: bloğu kopyalar, kopyayı sürüklemeye başlar (orijinal yerinde
  // kalır) — kullanıcı isteği: "Alt+sürükle ile kopyala".
  // Grup üyesi (Ctrl+G ile bağlı) bir bloğa tıklamak TÜM grubu seçer/taşır.
  // Zaten çoklu-seçimin bir parçasıysa (shift ile oluşturulmuş) tıklama
  // seçimi BOZMADAN grubu birlikte taşır.
  const handleBlockPointerDown = (block, e) => {
    // Bir yerleştirme aracı aktifken (Rectangle/Text/... seçili) bir bloğun
    // ÜSTÜNE tıklamak o bloğu taşımaz — kullanıcı isteği: "üstüne geldiysem
    // o componenti taşımak için değil üstüne yeni component koymak için
    // gelmişim demektir". Olay hiç işlenmeden tuvalin kendi pointerdown'ına
    // (yerleştirme mantığı) düşsün diye burada hiçbir şey yapmadan çıkılır.
    if (activeTool) return;
    onSelectReference(false);
    // KRİTİK — kök neden bulundu: bir TEXT block'un textarea'sı odaktayken
    // BAŞKA bir block'a düz tıklayınca (sürüklemeden) eskiden blur hiç
    // olmuyordu (blur SADECE startDrag'in onMove'unda, sürükleme eşiği
    // aşılınca tetikleniyordu) — document.activeElement o eski textarea'da
    // TAKILI KALIYOR, bu da useClipboard'ın VE PageBuilder'ın global keydown
    // guard'ının (isTypingTarget) Ctrl+X/Delete'i SESSİZCE engellemesine yol
    // açıyordu (kullanıcı raporu: "ctrl x tüm componentlerde işe yaramıyor").
    // Artık her block tıklamasında (sürüklensin sürüklenmesin) HEMEN blur.
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();

    // KULLANICI KARARI: TEXT'te tek tık SADECE seçer, textarea'ya
    // odaklanmaz — diğer block tipleriyle TUTARLI. Eskiden (bilinçli önceki
    // karar: "tek tıkla yazılabilir") HER tıklama textarea'yı odaklıyordu;
    // bu yüzden Delete/Ctrl+X'e basınca odak hâlâ textarea'da olduğundan
    // isTypingTarget guard'ı devreye girip block'u SİLMİYORDU (kullanıcı
    // raporu: "hâlâ text'i silmiyor, ctrl x algılamıyor"). Çözüm: block
    // ZATEN seçiliyken gelen İKİNCİ tıklama (veya çift tık, iki tıkı da
    // ayrı ayrı tetikler) odaklanmaya izin verir — henüz seçili değilken
    // gelen İLK tıklama preventDefault ile tarayıcının "tıklayınca odakla"
    // varsayılan davranışını iptal eder, sadece seçim yapar.
    const alreadySelected = selectedIds.has(block.id);
    if (block.componentType === 'TEXT' && !alreadySelected) {
      e.preventDefault();
    }

    if (e.shiftKey) {
      e.stopPropagation();
      const next = new Set(selectedIds);
      if (next.has(block.id)) next.delete(block.id);
      else next.add(block.id);
      onSelectMany([...next]);
      return;
    }

    // CONTAINER çocuğu — x/y-tabanlı serbest sürükleme (startDrag) ve
    // groupId/alt-klonlama (o mekanizmalar köke `onAddBlock`/blockOrder
    // varsayar) burada UYGULANMAZ, kendi ghost-tabanlı jesti var (bkz.
    // startChildDrag yorumu). Alt+sürükle klonlama child'larda MVP'de
    // desteklenmiyor (kapsam dışı, ayrı görev).
    if (block.parentId) {
      onSelectMany([block.id]);
      startChildDrag(block, e);
      return;
    }

    if (e.altKey) {
      e.stopPropagation();
      const clone = structuredClone(block);
      clone.id = makeBlockId();
      onAddBlock(clone);
      onSelectMany([clone.id]);
      startDrag(clone, e);
      return;
    }

    const groupMates = block.groupId ? blocks.filter((b) => b.groupId === block.groupId) : null;
    if (groupMates && groupMates.length > 1) {
      onSelectMany(groupMates.map((b) => b.id));
      startDrag(block, e, groupMates);
      return;
    }

    if (selectedIds.has(block.id) && selectedIds.size > 1) {
      startDrag(block, e, blocks.filter((b) => selectedIds.has(b.id)));
      return;
    }

    onSelectMany([block.id]);
    startDrag(block, e);
  };

  // Hizalama: seçili bloklardan oluşan toplam sınır kutusuna göre her
  // birinin kenarı/ortası eşitlenir. Dağıtma: en soldaki/üstteki ile en
  // sağdaki/alttaki SABİT kalır, aradakiler eşit boşlukla yeniden dizilir
  // (Figma'nın align/distribute mantığıyla aynı).
  const alignSelection = (mode) => {
    if (selectedIds.size < 2) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const canvasCtx = { el: canvasRef.current, rect: canvasRect };
    const members = blocks.filter((b) => selectedIds.has(b.id) && !b.locked).map((b) => ({ block: b, edges: pixelEdgesOf(b, breakpoint, canvasCtx) }));
    if (members.length < 2) return;
    const left = Math.min(...members.map((m) => m.edges.left));
    const right = Math.max(...members.map((m) => m.edges.right));
    const top = Math.min(...members.map((m) => m.edges.top));
    const bottom = Math.max(...members.map((m) => m.edges.bottom ?? m.edges.top));

    members.forEach(({ block: b, edges }) => {
      const w = edges.right - edges.left;
      const h = (edges.bottom ?? edges.top) - edges.top;
      let newLeft = edges.left, newTop = edges.top;
      if (mode === 'left') newLeft = left;
      if (mode === 'right') newLeft = right - w;
      if (mode === 'center-h') newLeft = left + (right - left) / 2 - w / 2;
      if (mode === 'top') newTop = top;
      if (mode === 'bottom') newTop = bottom - h;
      if (mode === 'center-v') newTop = top + (bottom - top) / 2 - h / 2;
      const bWidth = resolveEffectiveLayout(b, breakpoint).w;
      updateBlock(b.id, {
        layout: patchLayoutMatrix(b.layout, breakpoint, {
          x: clamp((newLeft / canvasRect.width) * 100, 0, 100 - bWidth),
          y: clamp((newTop / canvasRect.height) * 100, 0, 100),
        }),
      });
    });
  };

  const distributeSelection = (axis) => {
    if (selectedIds.size < 3) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const canvasCtx = { el: canvasRef.current, rect: canvasRect };
    const members = blocks.filter((b) => selectedIds.has(b.id) && !b.locked).map((b) => ({ block: b, edges: pixelEdgesOf(b, breakpoint, canvasCtx) }));
    if (members.length < 3) return;

    if (axis === 'h') {
      members.sort((a, b) => a.edges.left - b.edges.left);
      const first = members[0].edges.left;
      const last = members[members.length - 1].edges.right;
      const totalW = members.reduce((sum, m) => sum + (m.edges.right - m.edges.left), 0);
      const gap = (last - first - totalW) / (members.length - 1);
      let cursor = first;
      members.forEach(({ block: b, edges }) => {
        const w = edges.right - edges.left;
        const bWidth = resolveEffectiveLayout(b, breakpoint).w;
        updateBlock(b.id, { layout: patchLayoutMatrix(b.layout, breakpoint, { x: clamp((cursor / canvasRect.width) * 100, 0, 100 - bWidth) }) });
        cursor += w + gap;
      });
    } else {
      members.sort((a, b) => a.edges.top - b.edges.top);
      const first = members[0].edges.top;
      const last = members[members.length - 1].edges.bottom ?? members[members.length - 1].edges.top;
      const totalH = members.reduce((sum, m) => sum + ((m.edges.bottom ?? m.edges.top) - m.edges.top), 0);
      const gap = (last - first - totalH) / (members.length - 1);
      let cursor = first;
      members.forEach(({ block: b, edges }) => {
        const h = (edges.bottom ?? edges.top) - edges.top;
        updateBlock(b.id, { layout: patchLayoutMatrix(b.layout, breakpoint, { y: clamp((cursor / canvasRect.height) * 100, 0, 100) }) });
        cursor += h + gap;
      });
    }
  };

  return {
    guides,
    collidingId,
    panningBlockId,
    setPanningBlockId,
    handleBlockPointerDown,
    startResize,
    startImagePan,
    alignSelection,
    distributeSelection,
    dropTargetContainerId,
    dragGhost,
  };
}
