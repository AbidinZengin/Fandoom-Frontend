import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LocalizedLink } from '../../../../shared/i18n/LocalizedLink';
import {
  getCustomLists,
  createCustomList,
  editCustomList,
  removeCustomList,
} from '../../Account.data';
import { ListEditorModal } from './ListEditorModal/ListEditorModal';
import styles from './CustomListsSection.module.css';

// Gerçek backend'e bağlı: POST/PATCH/DELETE/GET /api/me/lists. Liste öğe
// ekleme/silme akışı (bir prodüksiyonu/blogu bir listeye ekleme) bu turda
// YOK — sadece listenin kendisinin (başlık/açıklama/kapak/görünürlük)
// oluşturma/düzenleme/silmesi (kullanıcı isteği, 2026-08-29).
const TYPE_FILTERS = [
  { key: 'all', labelKey: 'account.content.filterAll' },
  { key: 'MOVIE', labelKey: 'account.content.typeMovie' },
  { key: 'SERIES', labelKey: 'account.content.typeSeries' },
  { key: 'BLOG', labelKey: 'account.content.typeBlog' },
];

export function CustomListsSection() {
  const { t } = useTranslation();
  const [lists, setLists] = useState(null);
  const [editorList, setEditorList] = useState(undefined); // undefined=kapalı, null=create, obj=edit
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null);
  const [error, setError] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');

  const refresh = () => {
    getCustomLists().then(setLists);
  };

  useEffect(() => {
    refresh();
  }, []);

  // Kullanıcı kararı (2026-08-31): liste türü oluşturma anında sorulur ve
  // ikinci kez sorulmaz — create başarılı olunca modal KAPANMAZ, aynı modal
  // yeni listenin EDIT moduna geçer (dominantType = seçilen tür), kullanıcı
  // kesintisiz içerik eklemeye devam eder. Edit'te tür zaten sabit
  // (list.dominantType), submit sadece meta günceller.
  const handleSubmit = async (fields, chosenType) => {
    if (editorList) {
      await editCustomList(editorList.id, fields);
      setEditorList(undefined);
      refresh();
    } else {
      const created = await createCustomList(fields);
      refresh();
      setEditorList({ ...created, dominantType: chosenType });
    }
  };

  const handleDeleteClick = async (id) => {
    if (confirmingDeleteId !== id) {
      setConfirmingDeleteId(id);
      return;
    }
    setConfirmingDeleteId(null);
    setError(null);
    try {
      await removeCustomList(id);
      refresh();
    } catch (err) {
      setError(err.message ?? t('account.customLists.deleteError'));
    }
  };

  return (
    <section className={styles.customLists}>
      <div className={styles.customLists__head}>
        <h1 className={styles.customLists__heading}>{t('account.customLists.heading')}</h1>
        <button type="button" className={styles.customLists__newButton} onClick={() => setEditorList(null)}>
          {t('account.customLists.newListCta')}
        </button>
      </div>

      {error && <p className={styles.customLists__toast}>{error}</p>}

      {lists && lists.length === 0 && (
        <p className={styles.customLists__toast}>{t('account.content.emptyState')}</p>
      )}

      {/* Kullanıcı isteği: her liste homojen (film/dizi/blog kendi içinde)
          olduğu için üstte türe göre filtrelenebilsin — tür list.dominantType'tan
          gelir (Account.data.js, listenin ilk öğesinden türetilir). Henüz
          öğesi olmayan (dominantType null) listeler sadece "Tümü"nde görünür. */}
      {lists && lists.length > 0 && (
        <div className={styles.customLists__filterTabs} role="tablist">
          {TYPE_FILTERS.map((filter) => (
            <button
              key={filter.key}
              type="button"
              role="tab"
              className={styles.customLists__filterTab}
              data-active={typeFilter === filter.key}
              aria-selected={typeFilter === filter.key}
              onClick={() => setTypeFilter(filter.key)}
            >
              {t(filter.labelKey)}
            </button>
          ))}
        </div>
      )}

      <ul className={styles.customLists__grid}>
        {(lists ?? [])
          .filter((list) => typeFilter === 'all' || list.dominantType === typeFilter)
          .map((list) => (
          <li key={list.id}>
            <LocalizedLink
              to={`/account/lists/${list.id}`}
              className={styles.customLists__card}
              style={list.coverImageUrl ? { backgroundImage: `url(${list.coverImageUrl})` } : undefined}
              data-has-cover={Boolean(list.coverImageUrl) || undefined}
            >
              <div className={styles.customLists__cardHead}>
                <span className={styles.customLists__visibility} data-visibility={list.isPublic ? 'public' : 'private'}>
                  {list.isPublic ? t('account.customLists.public') : t('account.customLists.private')}
                </span>
                <div className={styles.customLists__cardActions}>
                  <button
                    type="button"
                    className={styles.customLists__actionButton}
                    onClick={(e) => {
                      e.preventDefault();
                      setEditorList(list);
                    }}
                  >
                    {t('account.customLists.editCta')}
                  </button>
                  <button
                    type="button"
                    className={styles.customLists__actionButton}
                    data-danger={confirmingDeleteId === list.id || undefined}
                    onClick={(e) => {
                      e.preventDefault();
                      handleDeleteClick(list.id);
                    }}
                    onBlur={() => setConfirmingDeleteId(null)}
                  >
                    {confirmingDeleteId === list.id ? t('account.customLists.confirmDelete') : t('account.customLists.deleteCta')}
                  </button>
                </div>
              </div>

              <div className={styles.customLists__cardBody}>
                <p className={styles.customLists__cardName}>{list.title}</p>
                {list.description && <p className={styles.customLists__cardDescription}>{list.description}</p>}
                <span className={styles.customLists__cardMeta}>
                  {t('account.customLists.itemsCount', { count: list.itemCount })}
                  {list.dominantType && (
                    <span className={styles.customLists__typeBadge}>
                      {t(TYPE_FILTERS.find((f) => f.key === list.dominantType)?.labelKey ?? '')}
                    </span>
                  )}
                </span>
              </div>
            </LocalizedLink>
          </li>
        ))}
      </ul>

      {editorList !== undefined && (
        <ListEditorModal
          list={editorList}
          onClose={() => setEditorList(undefined)}
          onSubmit={handleSubmit}
        />
      )}
    </section>
  );
}
