import { useEffect, useState } from 'react';
import styles from './PostActions.module.css';

// Kaydet/beğen, backend/user modülü olmadan GERÇEK ama istemci-kapsamlı
// kalıcılık kullanır (localStorage) — learned-rules [veri]: backend'de
// karşılığı olmayan bir öğe sahte veriyle doldurulmaz; burada sahte veri YOK,
// gerçekten kaydediyor, sadece cihaz-yerel. Hesap/backend gelince sunucu
// tarafı senkron ayrı bir görevdir.
const SAVE_STORAGE_KEY = 'fandoom:savedBlogs';
const LIKE_STORAGE_KEY = 'fandoom:likedBlogs';

function readIds(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeIds(key, ids) {
  try {
    localStorage.setItem(key, JSON.stringify(ids));
  } catch {
    // localStorage kapalı/dolu olabilir — kaydetme sessizce görsel-only kalır.
  }
}

// Makale sonunda yatay sıra (kullanıcı kararı, bkz. BlogPost.module.css
// .storyActions). Web Share API varsa native paylaşım sayfası açılır
// (mobil), yoksa panoya kopyalanır ve kısa bir "Copied" onayı gösterilir.
export function PostActions({ id, shareTitle, shareUrl }) {
  const [saved, setSaved] = useState(false);
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setSaved(readIds(SAVE_STORAGE_KEY).includes(id));
    setLiked(readIds(LIKE_STORAGE_KEY).includes(id));
  }, [id]);

  useEffect(() => {
    if (!copied) return undefined;
    const t = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(t);
  }, [copied]);

  const toggleSave = () => {
    const ids = readIds(SAVE_STORAGE_KEY);
    const next = saved ? ids.filter((x) => x !== id) : [...ids, id];
    writeIds(SAVE_STORAGE_KEY, next);
    setSaved(!saved);
  };

  const toggleLike = () => {
    const ids = readIds(LIKE_STORAGE_KEY);
    const next = liked ? ids.filter((x) => x !== id) : [...ids, id];
    writeIds(LIKE_STORAGE_KEY, next);
    setLiked(!liked);
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, url: shareUrl });
      } catch {
        // Kullanıcı paylaşım panelini iptal etti — sessiz geç.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
    } catch {
      // Panoya erişim yoksa sessiz geç — kritik olmayan bir kolaylık.
    }
  };

  return (
    <div className={styles.actions}>
      <div className={styles.actionWrap}>
        <button type="button" className={styles.action} onClick={share} aria-label="Share">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <circle cx="18" cy="5" r="2.6" />
            <circle cx="6" cy="12" r="2.6" />
            <circle cx="18" cy="19" r="2.6" />
            <line x1="8.3" y1="10.6" x2="15.6" y2="6.6" />
            <line x1="8.3" y1="13.4" x2="15.6" y2="17.4" />
          </svg>
        </button>
        {copied && (
          <span className={styles.toast} role="status">
            Copied
          </span>
        )}
      </div>

      <button
        type="button"
        className={styles.action}
        data-active={liked || undefined}
        onClick={toggleLike}
        aria-label={liked ? 'Unlike' : 'Like'}
        aria-pressed={liked}
      >
        <svg
          viewBox="0 0 24 24"
          fill={liked ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="1.6"
          aria-hidden="true"
        >
          <path d="M12 20.5s-7.5-4.6-10-9.3C.4 7.9 2 4.5 5.4 4c2-.3 3.7.6 6.6 3.3C14.9 4.6 16.6 3.7 18.6 4c3.4.5 5 3.9 3.4 7.2-2.5 4.7-10 9.3-10 9.3z" strokeLinejoin="round" />
        </svg>
      </button>

      <button
        type="button"
        className={styles.action}
        data-active={saved || undefined}
        onClick={toggleSave}
        aria-label={saved ? 'Remove from saved' : 'Save'}
        aria-pressed={saved}
      >
        <svg
          viewBox="0 0 24 24"
          fill={saved ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="1.6"
          aria-hidden="true"
        >
          <path d="M6.5 3.5h11a1 1 0 0 1 1 1V21l-6.5-3.9L5.5 21V4.5a1 1 0 0 1 1-1z" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
