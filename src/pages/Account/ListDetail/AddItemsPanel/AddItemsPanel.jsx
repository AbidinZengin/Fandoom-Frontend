import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchCatalogForType } from '../../Account.data';
import { addToList, removeFromList } from '../../../../shared/api/account';
import styles from './AddItemsPanel.module.css';

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <line x1="5" y1="5" x2="19" y2="19" />
      <line x1="19" y1="5" x2="5" y2="19" />
    </svg>
  );
}

const TYPE_OPTIONS = [
  { key: 'MOVIE', labelKey: 'account.content.typeMovie' },
  { key: 'SERIES', labelKey: 'account.content.typeSeries' },
  { key: 'BLOG', labelKey: 'account.content.typeBlog' },
];

// Edit modunda listeye içerik ekleme/çıkarma — ListEditorModal'daki
// candidate-checkbox mantığının bu sayfaya taşınmış hali (kullanıcı kararı:
// edit ikonu sıralama+silme+ekleme'yi TEK modda açar, bkz.
// docs/plans/2026-08-31-custom-list-detail-design.md Karar #2).
// `membership`: `${itemType}:${id}` -> savedItemId Map'i (listenin şu anki
// içeriği, ListDetail'in `items` state'inden türetilir).
//
// `listType`: listenin homojen türü (ListDetail'in `list.dominantType`'ı —
// Account.data.js getCustomLists'te ilk öğeden türetilir). Kullanıcı kararı
// (2026-08-31): bir liste tek türe kilitli (film/dizi/blog karışmaz) — liste
// zaten türlüyse (≥1 öğe) tür burada SORULMAZ, doğrudan o türün kataloğunda
// arama açılır. Liste henüz türsüzse (boş, dominantType null) ListEditorModal
// ile AYNI TYPE_OPTIONS seçimi burada sorulur; ilk öğe eklenince tür kilitlenir.
// Arama: eski "sadece kaydedilenlerden/beğenilerden seç" havuzu yerine
// seçilen türün TAM kataloğu (fetchCatalogForType, ListEditorModal ile aynı
// fonksiyon) bir kere çekilip client-side filtrelenir.
export function AddItemsPanel({ listId, listType, membership, onClose, onChanged }) {
  const { t } = useTranslation();
  const [selectedType, setSelectedType] = useState(listType ?? null);
  const [catalog, setCatalog] = useState(null);
  const [query, setQuery] = useState('');
  const [pendingKey, setPendingKey] = useState(null);

  useEffect(() => {
    if (!selectedType) return undefined;
    let cancelled = false;
    setCatalog(null);
    fetchCatalogForType(selectedType).then((data) => {
      if (!cancelled) setCatalog(data);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedType]);

  const results = (catalog ?? []).filter((c) => {
    const q = query.trim().toLowerCase();
    return !q || c.title.toLowerCase().includes(q);
  });

  const toggle = async (candidate) => {
    const key = `${candidate.itemType}:${candidate.id}`;
    if (pendingKey === key) return;
    setPendingKey(key);
    try {
      const savedItemId = membership.get(key);
      if (savedItemId) {
        await removeFromList(savedItemId);
      } else {
        await addToList(candidate.id, candidate.itemType, { targetListId: listId });
      }
      await onChanged();
    } finally {
      setPendingKey(null);
    }
  };

  return (
    <div className={styles.panel__backdrop} onClick={onClose}>
      <div className={styles.panel__card} role="dialog" aria-modal="true" aria-labelledby="add-items-title" onClick={(e) => e.stopPropagation()}>
        <div className={styles.panel__head}>
          <h2 id="add-items-title" className={styles.panel__title}>
            {t('account.listDetail.addItemsTitle')}
          </h2>
          <button type="button" className={styles.panel__closeButton} onClick={onClose} aria-label={t('account.profile.closeModal')}>
            <CloseIcon />
          </button>
        </div>

        {!selectedType && (
          <div className={styles.panel__typeField}>
            <p className={styles.panel__typeLabel}>{t('account.customLists.typePickerLabel')}</p>
            <div className={styles.panel__typeOptions} role="radiogroup">
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  role="radio"
                  aria-checked={selectedType === opt.key}
                  className={styles.panel__typeOption}
                  onClick={() => setSelectedType(opt.key)}
                >
                  {t(opt.labelKey)}
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedType && (
          <input
            type="search"
            className={styles.panel__searchInput}
            placeholder={t('account.customLists.searchPlaceholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        )}

        {selectedType && catalog === null && <p className={styles.panel__status}>{t('blog.loading')}</p>}
        {selectedType && catalog !== null && results.length === 0 && (
          <p className={styles.panel__status}>{t('account.customLists.searchNoResults')}</p>
        )}

        {selectedType && catalog !== null && results.length > 0 && (
          <ul className={styles.panel__list}>
            {results.map((candidate) => {
              const key = `${candidate.itemType}:${candidate.id}`;
              const checked = membership.has(key);
              const thumb = candidate.itemType === 'BLOG' ? candidate.imageUrl : candidate.posterUrl;
              return (
                <li key={key}>
                  <label className={styles.panel__row}>
                    <input type="checkbox" checked={checked} disabled={pendingKey === key} onChange={() => toggle(candidate)} />
                    {thumb && <img src={thumb} alt="" className={styles.panel__thumb} />}
                    <span className={styles.panel__rowTitle}>{candidate.title}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
