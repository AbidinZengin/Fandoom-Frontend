import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { emptyDraft, loadBlogForEdit, saveBlog } from './BlogEditor.data';
import { useHistory } from './useHistory';
import { MetaPanel } from './MetaPanel/MetaPanel';
import { BlockList } from './BlockList/BlockList';
import { AddBlockBar } from './AddBlockBar/AddBlockBar';
import styles from './BlogEditor.module.css';

const DRAFT_SAVE_DEBOUNCE_MS = 800;
const draftStorageKey = (id) => `fandoom_blog_draft_${id ?? 'new'}`;

// Blog editör sayfası — :id varsa mevcut blogu yükler (GET /api/blogs/{id},
// status-agnostic), yoksa boş taslakla başlar. Tek state objesi BlogRequest
// şekline yakın tutulur (bkz. BlogEditor.data.js), Kaydet'te aynen POST/PUT'a
// gider. State merkezi undo/redo history'si (useHistory) üzerinden yönetilir
// — component bazlı değil, TÜM taslak (meta + bloklar) için tek sistem
// (kullanıcı düzeltmesi).
export default function BlogEditor() {
  const { id } = useParams();
  const navigate = useNavigate();

  const history = useHistory(emptyDraft());
  const draft = history.state;

  const [loading, setLoading] = useState(Boolean(id));
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  // localStorage'da bu id/new için kurtarılabilir bir taslak varsa banner
  // gösterilir — otomatik UYGULANMAZ (sunucudaki hâl daha güncel olabilir),
  // kullanıcı Geri Yükle/Yoksay ile karar verir.
  const [recoverableDraft, setRecoverableDraft] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const checkRecoverable = () => {
      try {
        const raw = localStorage.getItem(draftStorageKey(id));
        if (raw && !cancelled) setRecoverableDraft(JSON.parse(raw));
      } catch {
        // bozuk kayıt — sessizce yoksay
      }
    };

    if (!id) {
      checkRecoverable();
      return undefined;
    }

    setLoading(true);
    setLoadError(null);
    loadBlogForEdit(id)
      .then((state) => {
        if (cancelled) return;
        history.reset(state);
        setIsDirty(false);
        setLoading(false);
        checkRecoverable();
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, reloadToken]);

  // Sayfadan ayrılınca (route değişimi, sekme kapanışı) taslağı BELLEKTEN
  // silinmeye karşı localStorage'a yedekler — kullanıcı raporu: "blog
  // eklerken başka yere geçince taslak siliniyor". Kaydet başarılı olunca
  // veya kullanıcı kurtarılabilir taslağı yoksayınca temizlenir.
  useEffect(() => {
    if (!isDirty) return undefined;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(draftStorageKey(id), JSON.stringify(draft));
      } catch {
        // localStorage dolu/kapalı olabilir — taslak sadece bellekte kalır
      }
    }, DRAFT_SAVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [draft, isDirty, id]);

  const restoreDraft = () => {
    history.reset(recoverableDraft);
    setIsDirty(true);
    setRecoverableDraft(null);
  };

  const discardRecoverableDraft = () => {
    localStorage.removeItem(draftStorageKey(id));
    setRecoverableDraft(null);
  };

  // Ctrl/Cmd+Z geri al, Ctrl/Cmd+Shift+Z (veya Ctrl+Y) yinele — global
  // (Figma/Canva deseni: odak metin alanında olsa da uygulama-seviyesi
  // undo kazanır, native textarea undo'suyla KARIŞMAZ çünkü metin
  // değişiklikleri zaten aynı history'ye coalesced giriyor).
  useEffect(() => {
    const onKeyDown = (e) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      if (e.key === 'z' || e.key === 'Z') {
        e.preventDefault();
        if (e.shiftKey) history.redo();
        else history.undo();
      } else if (e.key === 'y' || e.key === 'Y') {
        e.preventDefault();
        history.redo();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history.undo, history.redo]);

  // Kaydedilmemiş değişiklik varken sekme kapatma/yenileme uyarısı — route
  // içi navigasyon koruması bu app'in düz BrowserRouter kurulumunda (data
  // router değil) desteklenmiyor; localStorage yedeği (yukarıda) o durumu
  // zaten güvenli hâle getiriyor — kaybolmaz, sadece geri yükleme gerekir.
  useEffect(() => {
    if (!isDirty) return undefined;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const patch = (field, value) => {
    history.update((d) => ({ ...d, [field]: value }));
    setIsDirty(true);
  };

  const patchBlocks = (blocks) => {
    history.update((d) => ({ ...d, blocks }));
    setIsDirty(true);
  };

  const addBlock = (block) => {
    history.update((d) => ({ ...d, blocks: [...d.blocks, block] }));
    history.seal();
    setIsDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const saved = await saveBlog(id, draft);
      setIsDirty(false);
      localStorage.removeItem(draftStorageKey(id));
      if (!id) navigate(`/admin/blogs/${saved.id}`);
    } catch (err) {
      setSaveError(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className={styles.blogEditor__status}>Loading…</p>;
  }

  if (loadError) {
    return (
      <div className={styles.blogEditor__status}>
        <p>{loadError.status === 403 ? "You don't have permission for this." : 'Failed to load.'}</p>
        <button type="button" onClick={() => setReloadToken((t) => t + 1)}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <section className={styles.blogEditor}>
      <header className={styles.blogEditor__head}>
        <h1 className={styles.blogEditor__title}>{id ? 'Edit Blog' : 'New Blog'}</h1>
        <div className={styles.blogEditor__headActions}>
          <button
            type="button"
            className={styles.blogEditor__historyButton}
            onClick={history.undo}
            disabled={!history.canUndo}
            aria-label="Undo"
            title="Undo (Ctrl+Z)"
          >
            ↶
          </button>
          <button
            type="button"
            className={styles.blogEditor__historyButton}
            onClick={history.redo}
            disabled={!history.canRedo}
            aria-label="Redo"
            title="Redo (Ctrl+Shift+Z)"
          >
            ↷
          </button>
          <button type="button" className={styles.blogEditor__save} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </header>

      {recoverableDraft && (
        <div className={styles.blogEditor__recoverBanner}>
          <p>Found an unsaved draft — restore it?</p>
          <div className={styles.blogEditor__recoverActions}>
            <button type="button" onClick={restoreDraft}>
              Restore
            </button>
            <button type="button" onClick={discardRecoverableDraft}>
              Discard
            </button>
          </div>
        </div>
      )}

      {saveError && (
        <div className={styles.blogEditor__saveError}>
          {saveError.fieldErrors
            ? Object.entries(saveError.fieldErrors).map(([field, message]) => (
                <p key={field}>
                  {field}: {message}
                </p>
              ))
            : <p>{saveError.status === 403 ? "You don't have permission for this." : 'Save failed, try again.'}</p>}
        </div>
      )}

      <MetaPanel draft={draft} onPatch={patch} />

      <div className={styles.blogEditor__blocks}>
        <BlockList
          blocks={draft.blocks}
          canvasHeight={draft.canvasHeight}
          onChange={patchBlocks}
          onCommit={history.seal}
          onCanvasHeightChange={(h) => patch('canvasHeight', h)}
        />
        <AddBlockBar onAdd={addBlock} />
      </div>
    </section>
  );
}
