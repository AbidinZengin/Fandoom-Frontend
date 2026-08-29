import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { uploadImage } from '../../../../../shared/api/media';
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
export function ListEditorModal({ list, onClose, onSubmit }) {
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
