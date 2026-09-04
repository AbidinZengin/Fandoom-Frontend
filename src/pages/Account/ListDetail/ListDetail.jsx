import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Flip } from 'gsap/Flip';
import { LocalizedLink } from '../../../shared/i18n/LocalizedLink';
import { getCustomListDetail } from '../Account.data';
import { removeFromList } from '../../../shared/api/account';
import { extractDominantColor } from './dominantColor';
import { ListItemCard } from './ListItemCard/ListItemCard';
import { AddItemsPanel } from './AddItemsPanel/AddItemsPanel';
import styles from './ListDetail.module.css';

const FALLBACK_ACCENT = [60, 60, 60];

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function HeartIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path
        d="M12 20.5s-7.5-4.6-10-9.3C.4 7.9 2 4.5 5.4 4c2-.3 3.7.6 6.6 3.3C14.9 4.6 16.6 3.7 18.6 4c3.4.5 5 3.9 3.4 7.2-2.5 4.7-10 9.3-10 9.3z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BookmarkIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M6.5 3.5h11a1 1 0 0 1 1 1V21l-6.5-3.9L5.5 21V4.5a1 1 0 0 1 1-1z" strokeLinejoin="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

// Bir CUSTOM listenin detay sayfası — kapak görselinden çıkarılan baskın
// renk sayfanın arka planına (Spotify "now playing" tarzı) sızar, edit
// modu sıralama+silme+ekleme'yi TEK modda birleştirir (kullanıcı kararı,
// bkz. docs/plans/2026-08-31-custom-list-detail-design.md Karar #2).
//
// Heart/Bookmark butonları bu turda Faz 1: sadece görsel + optimistic yerel
// state, backend'de liste-seviyesi beğeni/kaydetme ucu yok (Karar #1).
//
// Sıralama SADECE bu oturumda kalıcı — backend'de item sırası için bir alan/
// endpoint yok (Karar #3, ayrı backend görevi). İçerik ekleme/çıkarma ise
// mevcut addToList/removeFromList ile GERÇEKTEN persist edilir.
// `id` prop DashboardView'dan gelir (wildcard route'ta useParams ':id'yi
// çözemez, bkz. DashboardView.jsx yorumu) — prop verilmezse (standalone
// kullanım ihtimaline karşı) kendi useParams()'ına düşer.
export function ListDetail({ id: idProp }) {
  const { id: idParam } = useParams();
  const id = idProp ?? idParam;
  const { t } = useTranslation();

  const [list, setList] = useState(null);
  const [accent, setAccent] = useState(FALLBACK_ACCENT);
  const [editMode, setEditMode] = useState(false);
  const [addPanelOpen, setAddPanelOpen] = useState(false);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dragIdx, setDragIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  const gridRef = useRef(null);
  const flipStateRef = useRef(null);

  const refresh = () => getCustomListDetail(id).then(setList);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!list?.coverImageUrl) {
      setAccent(FALLBACK_ACCENT);
      return;
    }
    let cancelled = false;
    extractDominantColor(list.coverImageUrl).then((rgb) => {
      if (!cancelled) setAccent(rgb);
    });
    return () => {
      cancelled = true;
    };
  }, [list?.coverImageUrl]);

  // Sürükle-bırak reorder: DOM pozisyonları drop ÖNCESİ (First) yakalanır,
  // state güncellenip React yeniden diziyi render ettikten SONRA (Last)
  // GSAP Flip aradaki farkı (Invert) smooth bir tween'e (Play) çevirir —
  // React'in anlık grid reflow'u yerine tüm kartlar akıcı kayar.
  useLayoutEffect(() => {
    if (!flipStateRef.current) return;
    Flip.from(flipStateRef.current, { duration: 0.5, ease: 'power2.inOut', absolute: true });
    flipStateRef.current = null;
  }, [list?.items]);

  const membership = useMemo(() => {
    const map = new Map();
    (list?.items ?? []).forEach((item) => map.set(`${item.itemType}:${item.id}`, item.savedItemId));
    return map;
  }, [list?.items]);

  const handleDragStart = (idx) => setDragIdx(idx);
  const handleDragOver = (e, idx) => {
    e.preventDefault();
    setDragOverIdx(idx);
  };
  const handleDragEnd = () => {
    setDragIdx(null);
    setDragOverIdx(null);
  };
  const handleDrop = (targetIdx) => {
    if (dragIdx === null || dragIdx === targetIdx || !gridRef.current) {
      handleDragEnd();
      return;
    }
    flipStateRef.current = Flip.getState(gridRef.current.children);
    setList((prev) => {
      const items = [...prev.items];
      const [moved] = items.splice(dragIdx, 1);
      items.splice(targetIdx, 0, moved);
      return { ...prev, items };
    });
    handleDragEnd();
  };

  const handleRemove = async (savedItemId) => {
    const prevItems = list.items;
    setList((prev) => ({ ...prev, items: prev.items.filter((item) => item.savedItemId !== savedItemId) }));
    try {
      await removeFromList(savedItemId);
    } catch {
      setList((prev) => ({ ...prev, items: prevItems }));
    }
  };

  if (!list) {
    return <p className={styles.detail__loading}>{t('blog.loading')}</p>;
  }

  const accentCss = accent.join(',');

  return (
    <div className={styles.detail} style={{ '--list-accent': accentCss }}>
      <div className={styles.detail__wash} aria-hidden="true" />
      <div className={styles.detail__washFade} aria-hidden="true" />

      <div className={styles.detail__content}>
        <LocalizedLink to="/account" className={styles.detail__backLink}>
          <BackIcon />
          {t('account.listDetail.backToLists')}
        </LocalizedLink>

        <div className={styles.detail__hero}>
          {list.coverImageUrl ? (
            <img src={list.coverImageUrl} alt="" className={styles.detail__heroImage} />
          ) : (
            <div className={styles.detail__heroFallback}>
              <span>{list.title?.[0]?.toUpperCase()}</span>
            </div>
          )}
          <div className={styles.detail__heroGradient} />

          <button
            type="button"
            className={styles.detail__editToggle}
            data-active={editMode || undefined}
            onClick={() => setEditMode((v) => !v)}
            aria-label={editMode ? t('account.listDetail.finishEditing') : t('account.listDetail.startEditing')}
          >
            {editMode ? <CheckIcon /> : <PencilIcon />}
          </button>

          <div className={styles.detail__heroBottom}>
            <div className={styles.detail__heroText}>
              <span className={styles.detail__visibility} data-visibility={list.isPublic ? 'public' : 'private'}>
                {list.isPublic ? t('account.customLists.public') : t('account.customLists.private')}
              </span>
              <h1 className={styles.detail__title}>{list.title}</h1>
              <p className={styles.detail__meta}>{t('account.customLists.itemsCount', { count: list.items.length })}</p>
            </div>

            <div className={styles.detail__heroActions}>
              <button
                type="button"
                className={styles.detail__heroAction}
                data-active={liked || undefined}
                onClick={() => setLiked((v) => !v)}
                aria-label={liked ? t('contentActions.unlike') : t('contentActions.like')}
                aria-pressed={liked}
              >
                <HeartIcon active={liked} />
              </button>
              <button
                type="button"
                className={styles.detail__heroAction}
                data-active={saved || undefined}
                onClick={() => setSaved((v) => !v)}
                aria-label={saved ? t('contentActions.removeFromSaved') : t('contentActions.save')}
                aria-pressed={saved}
              >
                <BookmarkIcon active={saved} />
              </button>
            </div>
          </div>
        </div>

        {list.description && <p className={styles.detail__description}>{list.description}</p>}

        {editMode && <p className={styles.detail__editHint}>{t('account.listDetail.dragHint')}</p>}

        {list.items.length === 0 && !editMode ? (
          <p className={styles.detail__empty}>{t('account.content.emptyState')}</p>
        ) : (
          <ul ref={gridRef} className={styles.detail__grid}>
            {list.items.map((item, idx) => (
              <ListItemCard
                key={item.savedItemId}
                item={item}
                index={idx}
                editMode={editMode}
                isDragging={dragIdx === idx}
                isDragOver={dragOverIdx === idx}
                onRemove={() => handleRemove(item.savedItemId)}
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={() => handleDrop(idx)}
                onDragEnd={handleDragEnd}
              />
            ))}
            {editMode && (
              <li className={styles.detail__addCard}>
                <button type="button" onClick={() => setAddPanelOpen(true)}>
                  <PlusIcon />
                  {t('account.listDetail.addItemsCta')}
                </button>
              </li>
            )}
          </ul>
        )}
      </div>

      {addPanelOpen && (
        <AddItemsPanel
          listId={list.id}
          listType={list.dominantType}
          membership={membership}
          onClose={() => setAddPanelOpen(false)}
          onChanged={refresh}
        />
      )}
    </div>
  );
}

export default ListDetail;
