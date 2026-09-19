import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LocalizedLink as Link } from '../../../../shared/i18n/LocalizedLink';
import { getStoredAuth } from '../../../../shared/api/authStorage';
import { uploadImage, uploadVideo } from '../../../../shared/api/media';
import sendIcon from '../../../../assets/icons/send.png';
import { avatarColor } from '../../communityAvatar';
import { ImageIcon } from '../../ThreadIcons';
import { createThread } from '../Feed.data';
import styles from './PostComposer.module.css';

const SURFACE_OPTIONS = [
  { key: 'DISCUSSION', labelKey: 'navbar.discussion' },
  { key: 'THEORY', labelKey: 'navbar.theories' },
  { key: 'FAN_ART', labelKey: 'navbar.fanArt' },
];
const MAX_TAGS = 3;
const MIN_TITLE_LENGTH = 10;
// Limitler backend'le aynı (kullanıcı kararı): thread başına 6 medya, görsel
// <= 10 MB, video <= 50 MB — istemcide de kontrol edilir ki 50 MB'lık dosya
// yüklenip 400 yemesin.
const MAX_MEDIA = 6;
const MAX_IMAGE_MB = 10;
const MAX_VIDEO_MB = 50;
const MEDIA_FOLDER = 'community';

// Oturumsuz kullanıcı /account'a yönlendirilir (spec madde 4.2) — backend
// yazma ucu authorId'yi JWT'den aldığı için anonim post mümkün değil.
// Gönderim gerçek POST /api/community/threads (Feed.data.js createThread).
// Düzen (2026-09-19, sosyal composer referansı): solda avatar, sağda başlık +
// gövde alanları (ayrı, başlık kalın), altında yüzey seçimi, çizgi, ardından
// araç çubuğu — görsel/video ikonla eklenir (çoklu, EditProfileModal ile aynı
// desen: seçilir seçilmez Cloudinary'e yüklenir, sadece {type, url} thread'e gider).
export function PostComposer({ defaultSurface = 'DISCUSSION', onPostCreated }) {
  const { t } = useTranslation();
  const mediaInputRef = useRef(null);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [surface, setSurface] = useState(defaultSurface);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [media, setMedia] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const auth = getStoredAuth();
  if (!auth?.token) {
    return (
      <Link to="/account" className={styles.postComposer__signedOut}>
        {t('community.composer.signInPrompt')}
      </Link>
    );
  }

  const username = auth.username ?? '';
  const titleLength = title.trim().length;
  const uploading = uploadingCount > 0;
  const isValid = titleLength >= MIN_TITLE_LENGTH && !uploading;

  // Seçilen dosyalar sırayla yüklenir (kalan kontenjan kadarı); başarısız
  // olan atlanır, hata mesajı gösterilir, diğerleri eklenmeye devam eder.
  const handleMediaFiles = async (fileList) => {
    const files = Array.from(fileList ?? []).slice(0, MAX_MEDIA - media.length);
    if (files.length === 0) return;
    setError(null);
    setUploadingCount(files.length);
    const uploaded = [];
    for (const file of files) {
      const isVideo = file.type.startsWith('video/');
      const maxMb = isVideo ? MAX_VIDEO_MB : MAX_IMAGE_MB;
      if (file.size > maxMb * 1024 * 1024) {
        setError(t('community.composer.mediaTooLarge', { name: file.name, max: maxMb }));
        continue;
      }
      try {
        const { url } = await (isVideo ? uploadVideo : uploadImage)(file, MEDIA_FOLDER);
        uploaded.push({ type: isVideo ? 'VIDEO' : 'IMAGE', url });
      } catch (err) {
        setError(err.message || t('community.composer.mediaError'));
      }
    }
    setMedia((prev) => [...prev, ...uploaded]);
    setUploadingCount(0);
    // Aynı dosya tekrar seçilebilsin (kaldır → aynı dosyayı yeniden seç).
    if (mediaInputRef.current) mediaInputRef.current.value = '';
  };

  const removeMedia = (url) => setMedia((prev) => prev.filter((item) => item.url !== url));

  const addTag = () => {
    const clean = tagInput.trim().replace(/^#/, '');
    if (!clean || tags.includes(clean) || tags.length >= MAX_TAGS) return;
    setTags([...tags, clean]);
    setTagInput('');
  };

  const removeTag = (tag) => setTags(tags.filter((existing) => existing !== tag));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isValid || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const post = await createThread({
        surface,
        title: title.trim(),
        body: body.trim(),
        media,
        tags,
      });
      setTitle('');
      setBody('');
      setMedia([]);
      setTags([]);
      onPostCreated?.(post);
    } catch (err) {
      // Backend'in gerçek mesajı (400 validasyon, 401 süresi dolmuş token...)
      // genel "tekrar dene" yerine gösterilir; mesaj yoksa genel metne düşer.
      setError(err.message || t('community.composer.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const mediaLabel = t('community.composer.chooseMedia', { count: media.length, max: MAX_MEDIA });

  return (
    <form className={styles.postComposer} onSubmit={handleSubmit}>
      <div className={styles.postComposer__row}>
        <span className={styles.postComposer__avatar} style={{ background: avatarColor(username) }}>
          {username.charAt(0).toUpperCase()}
        </span>

        <div className={styles.postComposer__fields}>
          <input
            className={styles.postComposer__title}
            placeholder={t('community.composer.titlePlaceholder')}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={140}
          />
          {titleLength > 0 && titleLength < MIN_TITLE_LENGTH && (
            <p className={styles.postComposer__hint}>
              {t('community.composer.titleMin', { min: MIN_TITLE_LENGTH, count: titleLength })}
            </p>
          )}

          <textarea
            className={styles.postComposer__body}
            placeholder={t('community.composer.bodyPlaceholder')}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={2}
          />

          {media.length > 0 && (
            <div className={styles.postComposer__mediaGrid}>
              {media.map((item) => (
                <div key={item.url} className={styles.postComposer__preview}>
                  {item.type === 'VIDEO' ? (
                    <video src={item.url} muted preload="metadata" className={styles.postComposer__previewImage} />
                  ) : (
                    <img src={item.url} alt="" className={styles.postComposer__previewImage} />
                  )}
                  <button
                    type="button"
                    className={styles.postComposer__previewRemove}
                    onClick={() => removeMedia(item.url)}
                    aria-label={t('community.composer.removeMedia')}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className={styles.postComposer__tags}>
            {tags.map((tag) => (
              <span key={tag} className={styles.postComposer__tagPill}>
                #{tag}
                <button type="button" onClick={() => removeTag(tag)} aria-label={t('community.composer.removeTag')}>
                  ×
                </button>
              </span>
            ))}
            {tags.length < MAX_TAGS && (
              <input
                className={styles.postComposer__tagInput}
                placeholder={t('community.composer.tagPlaceholder')}
                value={tagInput}
                onChange={(event) => setTagInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    addTag();
                  }
                }}
              />
            )}
          </div>

          <div className={styles.postComposer__surfaceRow}>
            {SURFACE_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                className={styles.postComposer__surfaceButton}
                data-active={surface === option.key}
                onClick={() => setSurface(option.key)}
              >
                {t(option.labelKey)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <p className={styles.postComposer__error}>{error}</p>}

      <div className={styles.postComposer__toolbar}>
        <div className={styles.postComposer__tools}>
          <input
            ref={mediaInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
            multiple
            className={styles.postComposer__fileInput}
            onChange={(event) => handleMediaFiles(event.target.files)}
          />
          <button
            type="button"
            className={styles.postComposer__tool}
            onClick={() => mediaInputRef.current?.click()}
            disabled={uploading || media.length >= MAX_MEDIA}
            aria-label={mediaLabel}
            title={mediaLabel}
          >
            <ImageIcon />
            {uploading && <span>{t('community.composer.mediaUploading')}</span>}
            {!uploading && media.length > 0 && (
              <span>
                {media.length}/{MAX_MEDIA}
              </span>
            )}
          </button>
        </div>

        <button type="submit" className={styles.postComposer__submit} disabled={!isValid || submitting}>
          {t('community.composer.submit')}
          <img src={sendIcon} alt="" className={styles.postComposer__submitIcon} />
        </button>
      </div>
    </form>
  );
}
