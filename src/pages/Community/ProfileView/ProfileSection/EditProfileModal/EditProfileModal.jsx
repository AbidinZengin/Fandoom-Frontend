import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { uploadImage } from '../../../../../shared/api/media';
import { updateMyProfile } from '../../../../../shared/api/account';
import styles from './EditProfileModal.module.css';

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <line x1="5" y1="5" x2="19" y2="19" />
      <line x1="19" y1="5" x2="5" y2="19" />
    </svg>
  );
}

// PATCH /me/profile — bio/avatarUrl/bannerUrl birlikte gönderilir (backend
// UserProfileResponse'un tamamını döner, ProfileSection.jsx bunu doğrudan
// yeni `user` prop'u olarak alır). Görsel yükleme ImageField.jsx (BlogEditor)
// ile aynı desen: dosya seçilir seçilmez (Kaydet'i beklemeden) Cloudinary'e
// yüklenir, sadece URL Kaydet'te profile PATCH edilir.
export function EditProfileModal({ user, onClose, onSaved }) {
  const { t } = useTranslation();
  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? '');
  const [bannerUrl, setBannerUrl] = useState(user.bannerUrl ?? '');
  const [bio, setBio] = useState(user.bio ?? '');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleAvatarFile = async (file) => {
    if (!file) return;
    setError(null);
    setUploadingAvatar(true);
    try {
      const { url } = await uploadImage(file);
      setAvatarUrl(url);
    } catch (err) {
      setError(err.message ?? t('account.profile.uploadError'));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleBannerFile = async (file) => {
    if (!file) return;
    setError(null);
    setUploadingBanner(true);
    try {
      const { url } = await uploadImage(file);
      setBannerUrl(url);
    } catch (err) {
      setError(err.message ?? t('account.profile.uploadError'));
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    try {
      const updated = await updateMyProfile({ bio, avatarUrl, bannerUrl });
      onSaved(updated);
    } catch (err) {
      setError(err.message ?? t('account.profile.saveError'));
      setSaving(false);
    }
  };

  const busy = saving || uploadingAvatar || uploadingBanner;

  return (
    <div className={styles.modal__backdrop} onClick={onClose}>
      <div
        className={styles.modal__card}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-profile-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modal__head}>
          <h2 id="edit-profile-title" className={styles.modal__title}>
            {t('account.profile.editModalTitle')}
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

        <div className={styles.modal__bannerField}>
          <div
            className={styles.modal__bannerPreview}
            style={bannerUrl ? { backgroundImage: `url(${bannerUrl})` } : undefined}
          >
            {uploadingBanner && <span className={styles.modal__spinner} aria-hidden="true" />}
          </div>
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            className={styles.modal__fileInput}
            onChange={(e) => handleBannerFile(e.target.files?.[0])}
          />
          <button
            type="button"
            className={styles.modal__changeButton}
            onClick={() => bannerInputRef.current?.click()}
          >
            {t('account.profile.changeBanner')}
          </button>
        </div>

        <div className={styles.modal__avatarField}>
          <div className={styles.modal__avatarPreview}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="" />
            ) : (
              <span>{user.username?.charAt(0).toUpperCase()}</span>
            )}
            {uploadingAvatar && <span className={styles.modal__spinner} aria-hidden="true" />}
          </div>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className={styles.modal__fileInput}
            onChange={(e) => handleAvatarFile(e.target.files?.[0])}
          />
          <button
            type="button"
            className={styles.modal__changeButton}
            onClick={() => avatarInputRef.current?.click()}
          >
            {t('account.profile.changeAvatar')}
          </button>
        </div>

        <label className={styles.modal__bioLabel} htmlFor="edit-profile-bio">
          {t('account.profile.bioLabel')}
        </label>
        <textarea
          id="edit-profile-bio"
          className={styles.modal__bioInput}
          maxLength={280}
          rows={4}
          placeholder={t('account.profile.bioPlaceholder')}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />

        {error && <p className={styles.modal__error}>{error}</p>}

        <div className={styles.modal__actions}>
          <button type="button" className={styles.modal__cancel} onClick={onClose} disabled={saving}>
            {t('account.settings.cancel')}
          </button>
          <button type="button" className={styles.modal__save} onClick={handleSave} disabled={busy}>
            {saving ? t('account.profile.saving') : t('account.settings.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
