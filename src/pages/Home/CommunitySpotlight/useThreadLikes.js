import { useCallback, useRef, useState } from 'react';
import { getStoredAuth } from '../../../shared/api/authStorage';
import { useLocalizedNavigate } from '../../../shared/i18n/useLocalizedNavigate';
import { likeThread, unlikeThread } from '../../../shared/api/community';

// Vitrin kartı ile açılan kartın BEĞENİ durumunu tek yerde tutar: iki yüzey de
// aynı thread'i gösterdiği için ayrı hook state'leri birbirinden kopardı.
// Optimistic günceller, sunucu cevabıyla (kesin sayaç) eşitler, hatada geri alır.
// Oturumsuz kullanıcı /account'a yönlenir (Community'deki useThreadActions ile aynı kural).
export function useThreadLikes() {
  const navigate = useLocalizedNavigate();
  const [overrides, setOverrides] = useState({});
  // Çift tık aynı anda iki istek atmasın.
  const pending = useRef(new Set());

  const view = useCallback(
    (thread) => overrides[thread.id] ?? { liked: thread.isLiked, count: thread.likeCount },
    [overrides]
  );

  const toggle = async (thread) => {
    if (!getStoredAuth()?.token) {
      navigate('/account');
      return;
    }
    if (pending.current.has(thread.id)) return;
    pending.current.add(thread.id);

    const current = view(thread);
    const next = !current.liked;
    const set = (liked, count) => setOverrides((o) => ({ ...o, [thread.id]: { liked, count } }));
    set(next, current.count + (next ? 1 : -1));
    try {
      const res = await (next ? likeThread : unlikeThread)(thread.id);
      set(res.liked, res.likeCount);
    } catch {
      set(current.liked, current.count);
    } finally {
      pending.current.delete(thread.id);
    }
  };

  return { view, toggle };
}
