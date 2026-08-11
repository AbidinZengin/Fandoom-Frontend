import { useCallback, useRef, useState } from 'react';

const DEBOUNCE_MS = 600;

// Tüm editör state'i (draft) için TEK merkezi undo/redo — component bazlı
// değil (kullanıcı düzeltmesi: "undo redo component bazlı çalışıyor tüm
// componentler için ana bir sistem gerekli"). "sealed" bir COMMIT SINIRIDIR:
// sealed=true iken gelen update() yeni bir history kaydı AÇAR; sealed=false
// iken gelen update()'ler AYNI kaydın üstüne yazar (ör. bir sürükleme
// gesture'ının tüm ara kareleri, bir metin alanına art arda yazılan
// karakterler TEK undo adımı olur). seal() gesture bitiminde (pointerup,
// blur) çağrılır; ayrıca DEBOUNCE_MS boyunca yeni update() gelmezse otomatik
// seal olur (prop-drilling gerektirmeyen genel bir güvenlik ağı).
export function useHistory(initialState) {
  const [state, setState] = useState({ entries: [initialState], index: 0, sealed: true });
  const timerRef = useRef(null);

  const seal = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setState((s) => (s.sealed ? s : { ...s, sealed: true }));
  }, []);

  const update = useCallback(
    (updater) => {
      setState((s) => {
        const base = s.entries[s.index];
        const next = typeof updater === 'function' ? updater(base) : updater;
        if (next === base) return s;
        const truncated = s.entries.slice(0, s.index + 1);
        if (s.sealed) {
          return { entries: [...truncated, next], index: truncated.length, sealed: false };
        }
        const entries = truncated.slice();
        entries[entries.length - 1] = next;
        return { entries, index: s.index, sealed: false };
      });
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(seal, DEBOUNCE_MS);
    },
    [seal]
  );

  const undo = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setState((s) => ({ ...s, index: Math.max(0, s.index - 1), sealed: true }));
  }, []);

  const redo = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setState((s) => ({ ...s, index: Math.min(s.entries.length - 1, s.index + 1), sealed: true }));
  }, []);

  const reset = useCallback((newInitial) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setState({ entries: [newInitial], index: 0, sealed: true });
  }, []);

  return {
    state: state.entries[state.index],
    update,
    seal,
    undo,
    redo,
    reset,
    canUndo: state.index > 0,
    canRedo: state.index < state.entries.length - 1,
  };
}
