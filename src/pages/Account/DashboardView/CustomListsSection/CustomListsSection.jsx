import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getCustomLists, createCustomList, editCustomList, removeCustomList } from '../../Account.data';
import { ListEditorModal } from './ListEditorModal/ListEditorModal';
import styles from './CustomListsSection.module.css';

// Gerçek backend'e bağlı: POST/PATCH/DELETE/GET /api/me/lists. Liste öğe
// ekleme/silme akışı (bir prodüksiyonu/blogu bir listeye ekleme) bu turda
// YOK — sadece listenin kendisinin (başlık/açıklama/kapak/görünürlük)
// oluşturma/düzenleme/silmesi (kullanıcı isteği, 2026-08-29).
export function CustomListsSection() {
  const { t } = useTranslation();
  const [lists, setLists] = useState(null);
  const [editorList, setEditorList] = useState(undefined); // undefined=kapalı, null=create, obj=edit
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null);
  const [error, setError] = useState(null);

  const refresh = () => {
    getCustomLists().then(setLists);
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleSubmit = async (fields) => {
    if (editorList) {
      await editCustomList(editorList.id, fields);
    } else {
      await createCustomList(fields);
    }
    setEditorList(undefined);
    refresh();
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

      <ul className={styles.customLists__grid}>
        {(lists ?? []).map((list) => (
          <li
            key={list.id}
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
                  onClick={() => setEditorList(list)}
                >
                  {t('account.customLists.editCta')}
                </button>
                <button
                  type="button"
                  className={styles.customLists__actionButton}
                  data-danger={confirmingDeleteId === list.id || undefined}
                  onClick={() => handleDeleteClick(list.id)}
                  onBlur={() => setConfirmingDeleteId(null)}
                >
                  {confirmingDeleteId === list.id ? t('account.customLists.confirmDelete') : t('account.customLists.deleteCta')}
                </button>
              </div>
            </div>

            <div className={styles.customLists__cardBody}>
              <p className={styles.customLists__cardName}>{list.title}</p>
              {list.description && <p className={styles.customLists__cardDescription}>{list.description}</p>}
              <span className={styles.customLists__cardMeta}>{t('account.customLists.itemsCount', { count: list.itemCount })}</span>
            </div>
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
