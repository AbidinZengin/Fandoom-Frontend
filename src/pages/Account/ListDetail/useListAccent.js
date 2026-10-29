import { useEffect, useState } from 'react';
import { updateMyList } from '../../../shared/api/account';
import { NEUTRAL_GRAY, extractVividDominantColor } from './dominantColor';

// Listenin accent rengi (erime zemini). Sıra:
//  1) backend'de kayıtlı `list.accentColor` (#RRGGBB) → ANINDA, hesap yok, gri
//     yanıp sönmesi yok;
//  2) yoksa kapaktan bir kez hesaplanır, gösterilir ve — backend alanı destekliyorsa
//     (cevapta `accentColor` anahtarı VAR, null olsa bile) — PATCH ile kaydedilir;
//     sonraki açılışlar 1. yola düşer. Kapak değişince backend alanı null'lar
//     (sözleşme), bu yol yeniden hesaplayıp yazar.
// Alan henüz backend'de yoksa PATCH atılmaz (her görüntülemede boşa istek olmasın).
// Nötr gri (renksiz görsel / CORS'ta tainted canvas) kalıcı yazılmaz.
// Dönüş: [r, g, b] ya da henüz bilinmiyorsa null.
const persisted = new Set();

function hexToRgb(hex) {
  const match = /^#([0-9a-f]{6})$/i.exec(hex ?? '');
  if (!match) return null;
  const value = parseInt(match[1], 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function rgbToHex([r, g, b]) {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

export function useListAccent(list) {
  const stored = hexToRgb(list?.accentColor);
  const [computed, setComputed] = useState(null);
  const cover = list?.coverImageUrl;
  const id = list?.id;
  const supportsStore = Boolean(list) && 'accentColor' in list;

  useEffect(() => {
    if (stored || !cover) return undefined;
    let cancelled = false;
    extractVividDominantColor(cover).then((rgb) => {
      if (cancelled) return;
      setComputed(rgb);
      const neutral = rgb.join() === NEUTRAL_GRAY.join();
      if (!supportsStore || neutral || id == null || persisted.has(id)) return;
      persisted.add(id);
      updateMyList(id, { accentColor: rgbToHex(rgb) }).catch(() => persisted.delete(id));
    });
    return () => {
      cancelled = true;
    };
    // stored hex'ten türetilen dizi her render yeni kimlik; asıl bağımlılık hex'in kendisi.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list?.accentColor, cover, id, supportsStore]);

  return stored ?? (cover ? computed : null);
}
