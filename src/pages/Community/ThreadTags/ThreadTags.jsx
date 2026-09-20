import styles from './ThreadTags.module.css';

// Serbest hashtag'ler (FeedCard + ThreadBody ortak). Tür pill'i (Discussion/
// Fan Art vb.) kartta GÖSTERİLMEZ — kullanıcı kararı 2026-09-21: tür zaten
// sekme/route'tan ve detay breadcrumb'ından bellidir. Hashtag'ler henüz
// tıklanmaz/aranmaz (arama Faz 2) — düz metin.
export function ThreadTags({ thread }) {
  if (!thread.tags?.length) return null;

  return (
    <div className={styles.threadTags}>
      {thread.tags.map((tag) => (
        <span key={tag} className={styles.threadTags__hashtag}>
          #{tag}
        </span>
      ))}
    </div>
  );
}
