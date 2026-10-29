import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Flip } from 'gsap/Flip';
import { LocalizedLink } from '../../../shared/i18n/LocalizedLink';
import { useMyListsStore } from '../../../shared/state/useMyListsStore';
import { reorderListItems } from '../../../shared/api/account';
import { getCustomListDetail, editCustomList } from '../Account.data';
import { ListEditorModal } from '../DashboardView/CustomListsSection/ListEditorModal/ListEditorModal';
import { extractDominantColor } from './dominantColor';
import { useListAccent } from './useListAccent';
import { ListItemCard } from './ListItemCard/ListItemCard';
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

function ReorderIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="8 9 12 5 16 9" />
      <polyline points="8 15 12 19 16 15" />
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

// Bir CUSTOM listenin detay sayfası — kapak görselinden çıkarılan baskın
// renk sayfanın arka planına (Spotify "now playing" tarzı) sızar. Kalem
// (edit) TEK bir düzenleme modalı açar (ListEditorModal: başlık, açıklama,
// kapak, görünürlük, içerik ekle/çıkar) — Save hepsini birlikte kaydeder,
// İptal hepsini atar (kullanıcı kararı, 2026-10-24). Sıralama AYRI bir moddur
// (kalemin yanındaki "Sırala"): sürükle-bırak + Flip, ✓ ile kaydedilir.
//
// Heart/Bookmark butonları bu turda Faz 1: sadece görsel + optimistic yerel
// state, backend'de liste-seviyesi beğeni/kaydetme ucu yok (Karar #1).
//
// Sıra kalıcılığı backend'in PATCH /me/lists/{id}/items/order ucuna bağlı
// (docs/plans/2026-10-24-custom-list-order-contract.md). Uç yoksa/hata verirse
// sıra yalnız bu oturumda kalır ve kullanıcıya açıkça söylenir.
// `id` prop DashboardView'dan gelir (wildcard route'ta useParams ':id'yi
// çözemez, bkz. DashboardView.jsx yorumu) — prop verilmezse (standalone
// kullanım ihtimaline karşı) kendi useParams()'ına düşer.
// backTo: "Listelerime dön" linkinin hedefi (Account'ta varsayılan).
// embedded: Community'nin orta kolonuna gömülü kip — kendi siyah zeminini,
// ekranı kaplayan renk sızıntısını ve sayfa kenar boşluklarını bırakır, geri
// linki yerine Community breadcrumb'ı (Community › Listelerim › liste) gösterir.
export function ListDetail({ id: idProp, backTo = '/account', embedded = false }) {
  const { id: idParam } = useParams();
  const id = idProp ?? idParam;
  const { t } = useTranslation();

  const [list, setList] = useState(null);
  const [accent, setAccent] = useState(FALLBACK_ACCENT);
  // Gömülü kipte (Community) orta bloğun eriyen zemini: kayıtlı accentColor ya da
  // kapaktan bir kez hesaplanıp kaydedilen CANLI baskın renk (bkz. useListAccent;
  // sayfa wash'ının piksel ortalamasından ayrı — o koyu görsellerde siyaha yakındı).
  const panelAccent = useListAccent(list) ?? FALLBACK_ACCENT;
  const [editorOpen, setEditorOpen] = useState(false);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  // Sıralama modu: orderBackup, İptal'de geri dönülecek sıra (mod açılırken alınır).
  const [reorderMode, setReorderMode] = useState(false);
  const [orderBackup, setOrderBackup] = useState(null);
  const [orderError, setOrderError] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
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

  // Drop öncesi DOM pozisyonları (First) yakalanır, state güncellenip React diziyi
  // yeniden render ettikten SONRA (Last) GSAP Flip aradaki farkı tween'e çevirir —
  // tüm kartlar akıcı kayar.
  useLayoutEffect(() => {
    if (!flipStateRef.current) return;
    Flip.from(flipStateRef.current, { duration: 0.5, ease: 'power2.inOut', absolute: true });
    flipStateRef.current = null;
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

  const startReorder = () => {
    setOrderBackup(list.items);
    setOrderError(false);
    setReorderMode(true);
  };

  const cancelReorder = () => {
    setList((prev) => ({ ...prev, items: orderBackup ?? prev.items }));
    setReorderMode(false);
    setOrderBackup(null);
  };

  // ✓: yeni sırayı backend'e yollar. Uç yoksa/hata verirse sıra bu oturumda kalır
  // (kullanıcıya açıkça söylenir) — sessizce "kaydedildi" denmez.
  const saveReorder = async () => {
    setSavingOrder(true);
    setOrderError(false);
    try {
      await reorderListItems(list.id, list.items.map((item) => item.savedItemId));
    } catch {
      setOrderError(true);
    } finally {
      setSavingOrder(false);
      setReorderMode(false);
      setOrderBackup(null);
    }
  };

  // Modal Save'i: içerik değişiklikleri modalın içinde uygulanır, buraya yalnız
  // DEĞİŞEN meta alanları gelir (boşsa PATCH atılmaz). Sonra detay yenilenir ve
  // listeler sayfası/sidebar'ı haberdar edilir.
  const handleEditSubmit = async (fields) => {
    if (Object.keys(fields).length > 0) await editCustomList(list.id, fields);
    setEditorOpen(false);
    await refresh();
    useMyListsStore.getState().bump();
  };

  if (!list) {
    return <p className={styles.detail__loading}>{t('blog.loading')}</p>;
  }

  const accentCss = accent.join(',');

  return (
    <div
      className={styles.detail}
      style={{ '--list-accent': accentCss, '--panel-accent': panelAccent.join(',') }}
      data-embedded={embedded || undefined}
    >
      <div className={styles.detail__wash} aria-hidden="true" />
      <div className={styles.detail__washFade} aria-hidden="true" />

      <div className={styles.detail__content}>
        {embedded ? (
          <nav className={styles.detail__breadcrumb} aria-label={t('community.thread.breadcrumb')}>
            <LocalizedLink to="/community">{t('navbar.community')}</LocalizedLink>
            <span aria-hidden="true">›</span>
            <LocalizedLink to={backTo}>{t('community.sidebar.listsHeading')}</LocalizedLink>
            <span aria-hidden="true">›</span>
            <span className={styles.detail__breadcrumbCurrent}>{list.title}</span>
          </nav>
        ) : (
          <LocalizedLink to={backTo} className={styles.detail__backLink}>
            <BackIcon />
            {t('account.listDetail.backToLists')}
          </LocalizedLink>
        )}

        <div className={styles.detail__panel}>
        <div className={styles.detail__hero}>
          {list.coverImageUrl ? (
            <img src={list.coverImageUrl} alt="" className={styles.detail__heroImage} />
          ) : (
            <div className={styles.detail__heroFallback}>
              <span>{list.title?.[0]?.toUpperCase()}</span>
            </div>
          )}
          <div className={styles.detail__heroGradient} />

          <div className={styles.detail__heroTools}>
            {list.items.length > 1 && (
              <button
                type="button"
                className={styles.detail__editToggle}
                data-active={reorderMode || undefined}
                onClick={reorderMode ? saveReorder : startReorder}
                disabled={savingOrder}
                aria-label={reorderMode ? t('account.settings.save') : t('account.listDetail.startReorder')}
                aria-pressed={reorderMode}
              >
                {reorderMode ? <CheckIcon /> : <ReorderIcon />}
              </button>
            )}
            <button
              type="button"
              className={styles.detail__editToggle}
              onClick={() => setEditorOpen(true)}
              disabled={reorderMode}
              aria-label={t('account.listDetail.startEditing')}
            >
              <PencilIcon />
            </button>
          </div>

          <div className={styles.detail__heroBottom}>
            <div className={styles.detail__heroText}>
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

        {reorderMode && (
          <div className={styles.detail__reorderBar}>
            <p className={styles.detail__editHint}>{t('account.listDetail.dragHint')}</p>
            <button type="button" className={styles.detail__reorderCancel} onClick={cancelReorder}>
              {t('account.settings.cancel')}
            </button>
          </div>
        )}

        {orderError && <p className={styles.detail__orderError}>{t('account.listDetail.orderSaveError')}</p>}

        {list.items.length === 0 ? (
          <p className={styles.detail__empty}>{t('account.content.emptyState')}</p>
        ) : (
          <ul ref={gridRef} className={styles.detail__grid}>
            {list.items.map((item, idx) => (
              <ListItemCard
                key={item.savedItemId}
                item={item}
                index={idx}
                editMode={reorderMode}
                isDragging={dragIdx === idx}
                isDragOver={dragOverIdx === idx}
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={() => handleDrop(idx)}
                onDragEnd={handleDragEnd}
              />
            ))}
          </ul>
        )}
        </div>
      </div>

      {editorOpen && <ListEditorModal list={list} onClose={() => setEditorOpen(false)} onSubmit={handleEditSubmit} />}
    </div>
  );
}

export default ListDetail;
