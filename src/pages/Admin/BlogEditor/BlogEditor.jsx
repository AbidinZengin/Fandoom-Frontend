import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { emptyDraft, loadBlogForEdit, saveBlog } from './BlogEditor.data';
import { fetchBlogs } from '../../../shared/api/blogs';
import { useHistory } from './useHistory';
import { MetaPanel } from './MetaPanel/MetaPanel';
import { BlockList } from './BlockList/BlockList';
import { AddBlockBar } from './AddBlockBar/AddBlockBar';
import styles from './BlogEditor.module.css';

const DRAFT_SAVE_DEBOUNCE_MS = 800;
const draftStorageKey = (id) => `fandoom_blog_draft_${id ?? 'new'}`;

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
  const [recoverableDraft, setRecoverableDraft] = useState(null);

  // Sidebar list
  const [blogsList, setBlogsList] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  useEffect(() => {
    fetchBlogs({ size: 50, sort: 'latest' })
      .then((res) => setBlogsList(res.content || []))
      .catch(() => {})
      .finally(() => setLoadingList(false));
  }, []);

  useEffect(() => {
    let cancelled = false;

    const checkRecoverable = () => {
      try {
        const raw = localStorage.getItem(draftStorageKey(id));
        if (raw && !cancelled) setRecoverableDraft(JSON.parse(raw));
      } catch {
        // ignore
      }
    };

    if (!id) {
      history.reset(emptyDraft());
      setIsDirty(false);
      setLoading(false);
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

  useEffect(() => {
    if (!isDirty) return undefined;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(draftStorageKey(id), JSON.stringify(draft));
      } catch {
        // ignore
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
      if (!id) {
        navigate(`/admin/blogs/${saved.id}`);
        // Refresh list
        const res = await fetchBlogs({ size: 50, sort: 'latest' });
        setBlogsList(res.content || []);
      }
    } catch (err) {
      setSaveError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.dashboard}>
      <aside className={styles.dashboard__sidebar}>
        <div className={styles.dashboard__sidebarHeader}>
          <h2 className={styles.dashboard__sidebarTitle}>Blogs</h2>
          <Link to="/admin/blogs/new" className={styles.dashboard__newBtn}>
            + New
          </Link>
        </div>
        <ul className={styles.dashboard__navList}>
          {!loadingList && blogsList.map(b => (
            <li key={b.id}>
              <button
                type="button"
                className={styles.dashboard__navButton}
                data-active={id === String(b.id) || undefined}
                onClick={() => navigate(`/admin/blogs/${b.id}`)}
              >
                <span className={styles.dashboard__navButtonTitle}>{b.title || 'Untitled'}</span>
                {b.status && <span style={{fontSize: 'var(--text-xs)'}}>{b.status}</span>}
              </button>
            </li>
          ))}
          {loadingList && <li className={styles.dashboard__navButton}>Loading...</li>}
        </ul>
      </aside>

      <main className={styles.dashboard__panel}>
        {loading ? (
          <p className={styles.blogEditor__status}>Loading…</p>
        ) : loadError ? (
          <div className={styles.blogEditor__status}>
            <p>{loadError.status === 403 ? "You don't have permission for this." : 'Failed to load.'}</p>
            <button type="button" onClick={() => setReloadToken((t) => t + 1)}>
              Retry
            </button>
          </div>
        ) : (
          <>
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
                onChange={patchBlocks}
                onCommit={history.seal}
              />
              <AddBlockBar onAdd={addBlock} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
