import { useEffect, useRef } from 'react';
import { makeBlockId } from './schema';

const PASTE_OFFSET = 3; // yüzde puanı — SeriesHeroEditor'daki DUPLICATE_OFFSET ile aynı büyüklük mertebesi

// BlockList.jsx'teki isTypingTarget()'ın bilinçli kopyası — motor hiçbir
// editöre bağımlı olmamalı, bu yüzden import etmek yerine yeniden tanımlanır.
function isTypingTarget(el) {
  return el instanceof HTMLElement && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT' || el.tagName === 'SELECT');
}

// Global Ctrl/Cmd+C / X / V dinleyicisi — ÇOKLU seçimi destekler (kullanıcı
// raporu: "toplu ctrl x olmuyor"). getSelectedBlocks HER ZAMAN bir dizi
// döner (tekil seçimde de 1 elemanlı); pano da her zaman dizi tutar.
export function useClipboard({ getSelectedBlocks, onPaste, onCut }) {
  const clipboardRef = useRef([]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (isTypingTarget(document.activeElement)) return;
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;

      if (e.key === 'c' || e.key === 'C') {
        const blocks = getSelectedBlocks?.() ?? [];
        if (blocks.length) clipboardRef.current = blocks.map((b) => structuredClone(b));
      } else if (e.key === 'x' || e.key === 'X') {
        const blocks = getSelectedBlocks?.() ?? [];
        if (blocks.length) {
          clipboardRef.current = blocks.map((b) => structuredClone(b));
          onCut?.(blocks.map((b) => b.id));
        }
      } else if (e.key === 'v' || e.key === 'V') {
        if (!clipboardRef.current.length) return;
        const copies = clipboardRef.current.map((b) => {
          const copy = structuredClone(b);
          copy.id = makeBlockId();
          copy.layout = {
            ...copy.layout,
            x: Math.min(100 - copy.layout.w, copy.layout.x + PASTE_OFFSET),
            y: copy.layout.y + PASTE_OFFSET,
          };
          return copy;
        });
        onPaste?.(copies);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [getSelectedBlocks, onPaste, onCut]);
}
