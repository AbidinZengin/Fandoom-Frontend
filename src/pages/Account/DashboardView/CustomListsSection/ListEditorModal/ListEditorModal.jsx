import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { uploadImage } from '../../../../../shared/api/media';
import { getMyListDetail, addToList, removeFromList } from '../../../../../shared/api/account';
import styles from './ListEditorModal.module.css';

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <line x1="5" y1="5" x2="19" y2="19" />
      <line x1="19" y1="5" x2="5" y2="19" />
    </svg>
  );
}

// Aynı modal hem oluşturma hem düzenleme için kullanılır — `list` prop'u
// verilirse edit modu (mevcut değerlerle önceden doldurulur), verilmezse
// create modu. Backend CreateUserListRequest'in POST/PATCH'te aynı DTO
// olması FE'de de aynı form/submit deseninin paylaşılmasını doğal kılıyor
// (bkz. shared/api/account.js updateMyList yorumu).
// İçerik ekleme/çıkarma sadece EDIT modunda: yeni açılan bir listenin
// henüz id'si yok, targetListId gerektiren addToList çağrılamaz — kullanıcı
// önce oluşturur, sonra Düzenle'ye tekrar girip içerik ekler.
const ITEMS_FETCH_SIZE = 200;

export function ListEditorModal({ list, candidates, onClose, onSubmit }) {
  const { t } = useTranslation();
  const coverInputRef = useRef(null);
  const [title, setTitle] = useState(list?.title ?? '');
  const [description, setDescription] = useState(list?.description ?? '');
  const [coverImageUrl, setCoverImageUrl] = useState(list?.coverImageUrl ?? '');
  const [isPublic, setIsPublic] = useState(list?.isPublic ?? false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const isEdit = Boolean(list);

  // itemMembership: `${itemType}:${itemId}` -> saved-item satır id'si (ya da
  // 'pending' işlem sürerken) — listenin şu anki içeriğini tek seferde çeker.
  const [itemMembership, setItemMembership] = useState(null);
  const [loadingItems, setLoadingItems] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    setLoadingItems(true);
    getMyListDetail(list.id, { size: ITEMS_FETCH_SIZE })
      .then((detail) => {
        const map = {};
        (detail.items?.content ?? []).forEach((raw) => {
          map[`${raw.itemType}:${raw.itemId}`] = raw.id;
        });
        setItemMembership(map);
      })
      .finally(() => setLoadingItems(false));
  }, [isEdit, list?.id]);

  const toggleItem = async (candidate) => {
    const key = `${candidate.itemType}:${candidate.id}`;
    const current = itemMembership?.[key];
    if (current === 'pending') return;
    const prev = itemMembership;

    if (current) {
      setItemMembership((m) => ({ ...m, [key]: 'pending' }));
      try {
        await removeFromList(current);
        setItemMembership((m) => {
          const next = { ...m };
          delete next[key];
          return next;
        });
      } catch {
        setItemMembership(prev);
      }
    } else {
      setItemMembership((m) => ({ ...m, [key]: 'pending' }));
      try {
        const res = await addToList(candidate.id, candidate.itemType, { targetListId: list.id });
        setItemMembership((m) => ({ ...m, [key]: res.id }));
      } catch {
        setItemMembership(prev);
      }
    }
  };

  const handleCoverFile = async (file) => {
    if (!file) return;
    setError(null);
    setUploadingCover(true);
    try {
      const { url } = await uploadImage(file);
      setCoverImageUrl(url);
    } catch (err) {
      setError(err.message ?? t('account.customLists.uploadError'));
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setError(null);
    setSaving(true);
    try {
      await onSubmit({ title: title.trim(), description, coverImageUrl, isPublic });
    } catch (err) {
      setError(err.message ?? t('account.customLists.saveError'));
      setSaving(false);
    }
  };

  const busy = saving || uploadingCover;

  return (
    <div className={styles.modal__backdrop} onClick={onClose}>
      <form
        className={styles.modal__card}
        role="dialog"
        aria-modal="true"
        aria-labelledby="list-editor-title"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className={styles.modal__head}>
          <h2 id="list-editor-title" className={styles.modal__title}>
            {isEdit ? t('account.customLists.editModalTitle') : t('account.customLists.createModalTitle')}
          </h2>
          <button
            type="button"
            className={styles.modal__closeButton}
            onClick={onClose}
            aria-label={t('account.profile.closeModal')}
          >
            <CloseIcon />
          </button>
        </div>

        <div className={styles.modal__coverField}>
          <div
            className={styles.modal__coverPreview}
            style={coverImageUrl ? { backgroundImage: `url(${coverImageUrl})` } : undefined}
          >
            {uploadingCover && <span className={styles.modal__spinner} aria-hidden="true" />}
          </div>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className={styles.modal__fileInput}
            onChange={(e) => handleCoverFile(e.target.files?.[0])}
          />
          <button
            type="button"
            className={styles.modal__changeButton}
            onClick={() => coverInputRef.current?.click()}
          >
            {t('account.customLists.changeCover')}
          </button>
        </div>

        <label className={styles.modal__fieldLabel} htmlFor="list-editor-name">
          {t('account.customLists.titlePlaceholder')}
        </label>
        <input
          id="list-editor-name"
          type="text"
          className={styles.modal__textInput}
          maxLength={150}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />

        <label className={styles.modal__fieldLabel} htmlFor="list-editor-description">
          {t('account.customLists.descriptionLabel')}
        </label>
        <textarea
          id="list-editor-description"
          className={styles.modal__bioInput}
          maxLength={2000}
          rows={4}
          placeholder={t('account.customLists.descriptionPlaceholder')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <label className={styles.modal__checkboxLabel}>
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
          />
          {t('account.customLists.publicToggleLabel')}
        </label>

        {isEdit && (
          <div>
            <p className={styles.modal__fieldLabel}>{t('account.customLists.itemsHeading')}</p>

            {loadingItems && <p className={styles.modal__itemsStatus}>{t('blog.loading')}</p>}

            {!loadingItems && (!candidates || candidates.length === 0) && (
              <p className={styles.modal__itemsStatus}>{t('account.customLists.itemsEmpty')}</p>
            )}

            {!loadingItems && candidates && candidates.length > 0 && (
              <ul className={styles.modal__itemsList}>
                {candidates.map((candidate) => {
                  const key = `${candidate.itemType}:${candidate.id}`;
                  const membership = itemMembership?.[key];
                  const thumb = candidate.itemType === 'BLOG' ? candidate.imageUrl : candidate.posterUrl;
                  return (
                    <li key={key}>
                      <label className={styles.modal__itemRow}>
                        <input
                          type="checkbox"
                          checked={Boolean(membership)}
                          disabled={membership === 'pending'}
                          onChange={() => toggleItem(candidate)}
                        />
                        {thumb && <img src={thumb} alt="" className={styles.modal__itemThumb} />}
                        <span className={styles.modal__itemTitle}>{candidate.title}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {error && <p className={styles.modal__error}>{error}</p>}

        <div className={styles.modal__actions}>
          <button type="button" className={styles.modal__cancel} onClick={onClose} disabled={saving}>
            {t('account.settings.cancel')}
          </button>
          <button type="submit" className={styles.modal__save} disabled={busy || !title.trim()}>
            {saving ? t('account.profile.saving') : t('account.settings.save')}
          </button>
        </div>
      </form>
    </div>
  );
}
