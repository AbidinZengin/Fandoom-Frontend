import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LocalizedLink as Link } from '../../../../shared/i18n/LocalizedLink';
import { getStoredAuth } from '../../../../shared/api/authStorage';
import { createThread } from '../Feed.data';
import styles from './PostComposer.module.css';

const SURFACE_OPTIONS = [
  { key: 'DISCUSSION', labelKey: 'navbar.discussion' },
  { key: 'THEORY', labelKey: 'navbar.theories' },
  { key: 'FAN_ART', labelKey: 'navbar.fanArt' },
];
const MAX_TAGS = 3;
const MIN_TITLE_LENGTH = 10;

// Oturumsuz kullanıcı /account'a yönlendirilir (spec madde 4.2). Gönderim
// localStorage'a optimistic yazar (Feed.data.js createThread) — gerçek
// thread POST ucu Faz 2.
export function PostComposer({ defaultSurface = 'DISCUSSION', onPostCreated }) {
  const { t } = useTranslation();
  const [surface, setSurface] = useState(defaultSurface);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!getStoredAuth()?.token) {
    return (
      <Link to="/account" className={styles.postComposer__signedOut}>
        {t('community.composer.signInPrompt')}
      </Link>
    );
  }

  const isValid = title.trim().length >= MIN_TITLE_LENGTH;

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
        imageUrl: imageUrl.trim(),
        tags,
      });
      setTitle('');
      setBody('');
      setImageUrl('');
      setTags([]);
      onPostCreated?.(post);
    } catch {
      setError(t('community.composer.error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className={styles.postComposer} onSubmit={handleSubmit}>
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

      <input
        className={styles.postComposer__title}
        placeholder={t('community.composer.titlePlaceholder')}
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        maxLength={140}
      />

      <textarea
        className={styles.postComposer__body}
        placeholder={t('community.composer.bodyPlaceholder')}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        rows={3}
      />

      <input
        className={styles.postComposer__image}
        placeholder={t('community.composer.imagePlaceholder')}
        value={imageUrl}
        onChange={(event) => setImageUrl(event.target.value)}
      />

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

      {error && <p className={styles.postComposer__error}>{error}</p>}

      <button type="submit" className={styles.postComposer__submit} disabled={!isValid || submitting}>
        {t('community.composer.submit')}
      </button>
    </form>
  );
}
