import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocalizedNavigate } from '../../../shared/i18n/useLocalizedNavigate';
import { getStoredAuth } from '../../../shared/api/authStorage';
import { getMyLists, getMyListDetail, createMyList, addToList, removeFromList } from '../../../shared/api/account';
import styles from './AddToListPopover.module.css';

function ListPlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <line x1="4" y1="7" x2="14" y2="7" strokeLinecap="round" />
      <line x1="4" y1="12" x2="14" y2="12" strokeLinecap="round" />
      <line x1="4" y1="17" x2="11" y2="17" strokeLinecap="round" />
      <line x1="18" y1="13" x2="18" y2="21" strokeLinecap="round" />
      <line x1="14" y1="17" x2="22" y2="17" strokeLinecap="round" />
    </svg>
  );
}

// Bir öğenin belirli bir CUSTOM listede olup olmadığını soran bir backend
// ucu yok (bkz. shared/api/account.js getMySavedItemStatus yorumu) — popover
// açıldığında kullanıcının her CUSTOM listesinin içeriği bu boyutla çekilip
// itemId/itemType eşleşmesi client-side aranır. Kullanıcı listelerinin
// tipik boyutu için kabul edilebilir bir N+1 (aynı tolerans Account.data.js
// enrichRawItems'ta da var); bir liste bu sayıdan fazla öğe içeriyorsa
// mevcut üyelik gözden kaçabilir — bkz. teslim notu.
const MEMBERSHIP_FETCH_SIZE = 200;

// Blog/Movie/Series ortak aksiyon barının son öğesi — ContentActions.jsx
// tarafından tip ayrımı yapılmadan (isProduction fark etmeksizin) render
// edilir, çünkü CUSTOM listeler her üç itemType'ı da kabul ediyor.
export function AddToListPopover({ itemId, itemType }) {
  const { t } = useTranslation();
  const navigate = useLocalizedNavigate();
  const containerRef = useRef(null);
  const isAuthed = Boolean(getStoredAuth()?.token);

  const [open, setOpen] = useState(false);
  const [lists, setLists] = useState(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [error, setError] = useState(null);

  const loadLists = async () => {
    setLoading(true);
    setError(null);
    try {
      const allLists = await getMyLists();
      const customLists = allLists.filter((l) => l.listType === 'CUSTOM');
      const withMembership = await Promise.all(
        customLists.map(async (list) => {
          const detail = await getMyListDetail(list.id, { size: MEMBERSHIP_FETCH_SIZE });
          const match = detail.items?.content?.find((it) => it.itemId === itemId && it.itemType === itemType);
          return { id: list.id, title: list.title, savedItemId: match?.id ?? null };
        })
      );
      setLists(withMembership);
    } catch (err) {
      setError(err.message ?? t('contentActions.listLoadError'));
    } finally {
      setLoading(false);
    }
  };

  const toggleOpen = () => {
    if (!isAuthed) {
      navigate('/account');
      return;
    }
    const next = !open;
    setOpen(next);
    if (next && lists === null) loadLists();
  };

  useEffect(() => {
    if (!open) return undefined;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const toggleMembership = async (list) => {
    if (list.savedItemId === 'pending') return;
    const prevLists = lists;
    if (list.savedItemId) {
      setLists((ls) => ls.map((l) => (l.id === list.id ? { ...l, savedItemId: null } : l)));
      try {
        await removeFromList(list.savedItemId);
      } catch {
        setLists(prevLists);
      }
    } else {
      setLists((ls) => ls.map((l) => (l.id === list.id ? { ...l, savedItemId: 'pending' } : l)));
      try {
        const res = await addToList(itemId, itemType, { targetListId: list.id });
        setLists((ls) => ls.map((l) => (l.id === list.id ? { ...l, savedItemId: res.id } : l)));
      } catch {
        setLists(prevLists);
      }
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setError(null);
    try {
      const list = await createMyList({ title: newTitle.trim() });
      const res = await addToList(itemId, itemType, { targetListId: list.id });
      setLists((ls) => [...(ls ?? []), { id: list.id, title: list.title, savedItemId: res.id }]);
      setNewTitle('');
      setCreating(false);
    } catch (err) {
      setError(err.message ?? t('contentActions.listCreateError'));
    }
  };

  return (
    <div className={styles.wrap} ref={containerRef}>
      <button
        type="button"
        className={styles.trigger}
        onClick={toggleOpen}
        aria-label={t('contentActions.addToList')}
        aria-expanded={open}
      >
        <ListPlusIcon />
      </button>

      {open && (
        <div className={styles.popover} role="menu">
          <p className={styles.popover__heading}>{t('contentActions.addToListHeading')}</p>

          {loading && <p className={styles.popover__status}>{t('blog.loading')}</p>}
          {error && <p className={styles.popover__status}>{error}</p>}
          {lists && lists.length === 0 && !creating && (
            <p className={styles.popover__status}>{t('contentActions.noLists')}</p>
          )}

          {lists && lists.length > 0 && (
            <ul className={styles.popover__list}>
              {lists.map((list) => (
                <li key={list.id}>
                  <label className={styles.popover__item}>
                    <input
                      type="checkbox"
                      checked={Boolean(list.savedItemId)}
                      disabled={list.savedItemId === 'pending'}
                      onChange={() => toggleMembership(list)}
                    />
                    {list.title}
                  </label>
                </li>
              ))}
            </ul>
          )}

          {creating ? (
            <form className={styles.popover__createForm} onSubmit={handleCreate}>
              <input
                type="text"
                className={styles.popover__createInput}
                maxLength={150}
                placeholder={t('account.customLists.titlePlaceholder')}
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                autoFocus
              />
              <button type="submit" className={styles.popover__createSubmit}>
                {t('contentActions.createAndAddCta')}
              </button>
            </form>
          ) : (
            <button type="button" className={styles.popover__newListButton} onClick={() => setCreating(true)}>
              {t('account.customLists.newListCta')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
