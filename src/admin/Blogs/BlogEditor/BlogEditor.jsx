import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useHistory } from '../../../pages/Admin/BlogEditor/useHistory';
import GlassButton from '../../GlassButton/GlassButton';
import IconButton from '../../IconButton/IconButton';
import { ArrowLeftIcon, RedoIcon, UndoIcon } from '../../icons';
import PageHeader from '../../PageHeader/PageHeader';
import TabPills from '../../TabPills/TabPills';
import { emptyDraft, loadBlogForEdit, saveBlog } from './BlogEditor.data';
import { MetaPanel } from './MetaPanel/MetaPanel';
import { BlockList } from './BlockList/BlockList';
import { AddBlockBar } from './AddBlockBar/AddBlockBar';
import styles from './BlogEditor.module.css';

const DRAFT_SAVE_DEBOUNCE_MS = 800;
const draftStorageKey = (id) => `fandoom_blog_draft_${id ?? 'new'}`;

const TABS = [
  { key: 'details', label: 'Detaylar' },
  { key: 'content', label: 'İçerik' },
];

const permissionMessage = 'Bunun için yetkin yok.';

export default function BlogEditor() {
  const { id } = useParams();
  const navigate = useNavigate();

  const history = useHistory(emptyDraft());
  const draft = history.state;

  const [tab, setTab] = useState('details');
  const [loading, setLoading] = useState(Boolean(id));
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [recoverableDraft, setRecoverableDraft] = useState(null);

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
      if (!id) navigate(`/admin/blogs/${saved.id}`);
    } catch (err) {
      setSaveError(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className={styles['blogEditor__status']}>Yükleniyor…</p>;

  if (loadError) {
    return (
      <div className={styles['blogEditor__status']}>
        <p>{loadError.status === 403 ? permissionMessage : 'Blog yüklenemedi.'}</p>
        <GlassButton onClick={() => setReloadToken((t) => t + 1)}>Tekrar dene</GlassButton>
      </div>
    );
  }

  return (
    <div className={styles['blogEditor']}>
      <Link to="/admin/blogs" className={styles['blogEditor__back']}>
        <span className={styles['blogEditor__backIcon']}>
          <ArrowLeftIcon />
        </span>
        Bloglar
      </Link>

      <PageHeader
        title={id ? 'Blogu düzenle' : 'Yeni blog'}
        subtitle={isDirty ? 'Kaydedilmemiş değişiklikler var' : draft.title || undefined}
      >
        <IconButton label="Geri al (Ctrl+Z)" onClick={history.undo} disabled={!history.canUndo}>
          <UndoIcon />
        </IconButton>
        <IconButton label="Yinele (Ctrl+Shift+Z)" onClick={history.redo} disabled={!history.canRedo}>
          <RedoIcon />
        </IconButton>
        <GlassButton onClick={handleSave} disabled={saving}>
          {saving ? 'Kaydediliyor…' : 'Kaydet'}
        </GlassButton>
      </PageHeader>

      {recoverableDraft && (
        <div className={styles['blogEditor__notice']}>
          <p>Kaydedilmemiş bir taslak bulundu, geri yüklensin mi?</p>
          <div className={styles['blogEditor__noticeActions']}>
            <button type="button" onClick={restoreDraft}>
              Geri yükle
            </button>
            <button type="button" onClick={discardRecoverableDraft}>
              Sil
            </button>
          </div>
        </div>
      )}

      {saveError && (
        <div className={`${styles['blogEditor__notice']} ${styles['blogEditor__notice--error']}`}>
          {saveError.fieldErrors ? (
            Object.entries(saveError.fieldErrors).map(([field, message]) => (
              <p key={field}>
                {field}: {message}
              </p>
            ))
          ) : (
            <p>{saveError.status === 403 ? permissionMessage : 'Kaydedilemedi, tekrar dene.'}</p>
          )}
        </div>
      )}

      <TabPills tabs={TABS} active={tab} onChange={setTab} label="Editör bölümleri" />

      {tab === 'details' ? (
        <MetaPanel draft={draft} onPatch={patch} />
      ) : (
        <div className={styles['blogEditor__blocks']}>
          <BlockList blocks={draft.blocks} onChange={patchBlocks} onCommit={history.seal} />
          <AddBlockBar onAdd={addBlock} />
        </div>
      )}
    </div>
  );
}
