import { useRef, useState } from 'react';
import { getStoredAuth } from '../../shared/api/authStorage';
import { useLocalizedNavigate } from '../../shared/i18n/useLocalizedNavigate';
import { likeThread, unlikeThread, bookmarkThread, unbookmarkThread } from '../../shared/api/community';

// FeedCard ve ThreadBody'nin ortak beğen/kaydet mantığı — gerçek uçlara bağlı,
// optimistic güncelleyip sunucu cevabıyla (kesin sayaç) eşitler, hatada geri alır.
// Oturumsuz kullanıcı /account'a yönlendirilir (PostComposer ile aynı kural).
export function useThreadActions(thread) {
  const navigate = useLocalizedNavigate();
  const [liked, setLiked] = useState(thread.isLiked);
  const [likeCount, setLikeCount] = useState(thread.likeCount);
  const [saved, setSaved] = useState(thread.isBookmarked);
  const [saveCount, setSaveCount] = useState(thread.bookmarkCount);
  // Çift tık aynı anda iki istek atmasın (idempotent olsa da sayaç titrer).
  const pending = useRef({ like: false, save: false });

  const canAct = () => {
    if (getStoredAuth()?.token) return true;
    navigate('/account');
    return false;
  };

  const toggleLike = async () => {
    if (!canAct() || pending.current.like) return;
    pending.current.like = true;
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    try {
      const res = await (next ? likeThread : unlikeThread)(thread.slug);
      setLiked(res.liked);
      setLikeCount(res.likeCount);
    } catch {
      setLiked(!next);
      setLikeCount((c) => c + (next ? -1 : 1));
    } finally {
      pending.current.like = false;
    }
  };

  const toggleSave = async () => {
    if (!canAct() || pending.current.save) return;
    pending.current.save = true;
    const next = !saved;
    setSaved(next);
    setSaveCount((c) => c + (next ? 1 : -1));
    try {
      const res = await (next ? bookmarkThread : unbookmarkThread)(thread.slug);
      setSaved(res.bookmarked);
      setSaveCount(res.bookmarkCount);
    } catch {
      setSaved(!next);
      setSaveCount((c) => c + (next ? -1 : 1));
    } finally {
      pending.current.save = false;
    }
  };

  return { liked, likeCount, saved, saveCount, toggleLike, toggleSave };
}
