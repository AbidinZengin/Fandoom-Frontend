import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LocalizedLink as Link } from '../../../../shared/i18n/LocalizedLink';
import { getStoredAuth } from '../../../../shared/api/authStorage';
import { uploadImage, uploadVideo } from '../../../../shared/api/media';
import sendIcon from '../../../../assets/icons/send.png';
import { avatarColor } from '../../communityAvatar';
import { htmlToRichText } from '../../RichText/htmlToRichText';
import { BoldIcon, ChevronIcon, ImageIcon, ItalicIcon, PenNibIcon, SpoilerIcon, LinkIcon } from '../../ThreadIcons';
import { createThread, getPortalOptions } from '../Feed.data';
import styles from './PostComposer.module.css';

const SURFACE_OPTIONS = [
  { key: 'DISCUSSION', labelKey: 'navbar.discussion' },
  { key: 'THEORY', labelKey: 'navbar.theories' },
  { key: 'FAN_ART', labelKey: 'navbar.fanArt' },
];
// STAFF_ONLY portala yalnız MODERATOR/ADMIN yazar (backend 403 verir). Saklanan
// rol bayat olabilir — burada yalnız seçiciyi sadeleştiren bir ipucudur, yetki
// kararı backend'indir.
const STAFF_ROLES = ['MODERATOR', 'ADMIN'];
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
// Daralan bölüm: grid-template-rows 0fr↔1fr ile yükseklik ölçmeden akıcı açılır
// (CSS'te). Kapalıyken `inert` — odaklanamaz, ekran okuyucudan gizlenir.
function Collapse({ open, children }) {
  return (
    <div className={styles.postComposer__collapse} data-open={open} inert={!open}>
      <div className={styles.postComposer__collapseInner}>{children}</div>
    </div>
  );
}

// `lockedPortal` ({slug, name}): Portal sayfasında composer o odaya kilitli
// gelir — seçici tek, pasif bir pill olarak durur, liste çekilmez.
export function PostComposer({ defaultSurface = null, lockedPortal = null, onPostCreated }) {
  const { t } = useTranslation();
  const formRef = useRef(null);
  const bodyRef = useRef(null);
  const mediaInputRef = useRef(null);
  // Kapalıyken tek satır ("Ne düşünüyorsun?"); odaklanınca açılır (2026-09-20).
  const [expanded, setExpanded] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [surface, setSurface] = useState(defaultSurface);
  // Portal = Oda: her thread mecburen tek bir portalda açılır (varsayılan yok,
  // kullanıcı seçer). status: loading | ready | error.
  const [pickedPortalSlug, setPickedPortalSlug] = useState(null);
  const portalSlug = lockedPortal?.slug ?? pickedPortalSlug;
  const lockedSlug = lockedPortal?.slug;
  const [portals, setPortals] = useState({ status: 'loading', items: [] });
  // discussion/theories/fan-art route'ları aynı Feed örneğini yeniden kullanır
  // (remount yok) — sekme değişince önseçim de yeni route'un yüzeyine geçer;
  // taslak (başlık/gövde) remount edilmediği için korunur.
  const [prevDefaultSurface, setPrevDefaultSurface] = useState(defaultSurface);
  if (prevDefaultSurface !== defaultSurface) {
    setPrevDefaultSurface(defaultSurface);
    setSurface(defaultSurface);
  }
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  // Gönderi sonrası editörü boşaltmak için remount anahtarı (uncontrolled DOM).
  const [editorKey, setEditorKey] = useState(0);
  // Kalın/italik butonlarının aktif durumu — imlecin bulunduğu metne göre.
  const [format, setFormat] = useState({ bold: false, italic: false });
  const [spoilerFlagged, setSpoilerFlagged] = useState(false);
  const [media, setMedia] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const syncFormat = () => {
      const editor = bodyRef.current;
      const anchor = window.getSelection()?.anchorNode;
      if (!editor || !anchor || !editor.contains(anchor)) return;
      const next = { bold: document.queryCommandState('bold'), italic: document.queryCommandState('italic') };
      // Değişmediyse aynı nesne döner — her imleç hareketinde composer yeniden çizilmez.
      setFormat((prev) => (prev.bold === next.bold && prev.italic === next.italic ? prev : next));
    };
    document.addEventListener('selectionchange', syncFormat);
    return () => document.removeEventListener('selectionchange', syncFormat);
  }, []);

  const signedIn = Boolean(getStoredAuth()?.token);
  useEffect(() => {
    if (!signedIn || lockedSlug) return undefined;
    let cancelled = false;
    getPortalOptions()
      .then((items) => {
        if (!cancelled) setPortals({ status: 'ready', items });
      })
      .catch(() => {
        if (!cancelled) setPortals({ status: 'error', items: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [signedIn, lockedSlug]);

  const mediaRef = useRef([]);
  mediaRef.current = media;
  useEffect(() => () => mediaRef.current.forEach((m) => URL.revokeObjectURL(m.url)), []);

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
  const isStaff = STAFF_ROLES.includes(auth.role);
  const portalOptions = portals.items.filter((portal) => portal.postingPolicy === 'OPEN' || isStaff);
  // Zorunlu: portal, tür, başlık (>= 10 karakter). İçerik opsiyonel.
  const isValid =
    Boolean(portalSlug) &&
    Boolean(surface) &&
    titleLength >= MIN_TITLE_LENGTH &&
    !uploading;
  const isEmpty = !title && !body && !tagInput && media.length === 0 && tags.length === 0;

  // Gövde WYSIWYG'dir (contenteditable): kalın/italik yazılırken ekranda
  // doğrudan öyle görünür, işaret karakteri GÖSTERİLMEZ. Kaydedilen metne
  // gönderimde çevrilir (htmlToRichText); kart + detay RichText ile okur.
  const handleBodyInput = (event) => {
    const editor = event.currentTarget;
    // Tarayıcı her şeyi silince kalan <br>, :empty placeholder'ını bozar.
    if (!editor.textContent) editor.innerHTML = '';
    setBody(htmlToRichText(editor));
  };

  // Enter tek biçimde <br> ekler (tarayıcıya göre <div>/<p> açmasın); altı çizili
  // kısayolu kapalı — kaydedilen biçimde karşılığı yok. Yapıştırma düz metindir.
  const handleBodyKeyDown = (event) => {
    // IME birleştirme sırasındaki Enter (aday seçimi) satır sonu sayılmaz.
    if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
      event.preventDefault();
      document.execCommand('insertLineBreak');
    } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'u') {
      event.preventDefault();
    }
  };

  const handleBodyPaste = (event) => {
    event.preventDefault();
    document.execCommand('insertText', false, event.clipboardData.getData('text/plain'));
  };

  const applyFormat = (command) => {
    bodyRef.current?.focus();
    document.execCommand(command);
    setFormat({ bold: document.queryCommandState('bold'), italic: document.queryCommandState('italic') });
  };

  const applyLink = () => {
    bodyRef.current?.focus();
    const selection = window.getSelection();
    if (!selection.rangeCount || selection.isCollapsed) return;
    const url = window.prompt(t('community.composer.linkPrompt') ?? 'URL:');
    if (url) {
      document.execCommand('createLink', false, url);
    }
  };

  // Odak formun DIŞINA çıkınca ve içerik boşsa daralır. Kontrol bir sonraki
  // karede yapılır: dosya seçici açılınca pencere odağı gider ama
  // document.activeElement form içinde kalır — o durumda daralmaz.
  const handleBlur = () => {
    requestAnimationFrame(() => {
      if (formRef.current?.contains(document.activeElement)) return;
      if (isEmpty && !uploading && !submitting) setExpanded(false);
    });
  };

  // Seçilen dosyalar local preview URL ile tutulur, submit edilince yüklenir (orphan media önlemi).
  const handleMediaFiles = (fileList) => {
    const files = Array.from(fileList ?? []).slice(0, MAX_MEDIA - media.length);
    if (files.length === 0) return;
    setError(null);
    const newMedia = [];
    for (const file of files) {
      const isVideo = file.type.startsWith('video/');
      const maxMb = isVideo ? MAX_VIDEO_MB : MAX_IMAGE_MB;
      if (file.size > maxMb * 1024 * 1024) {
        setError(t('community.composer.mediaTooLarge', { name: file.name, max: maxMb }));
        continue;
      }
      newMedia.push({
        type: isVideo ? 'VIDEO' : 'IMAGE',
        file,
        url: URL.createObjectURL(file), // temporary local preview
      });
    }
    setMedia((prev) => [...prev, ...newMedia]);
    if (mediaInputRef.current) mediaInputRef.current.value = '';
  };

  const removeMedia = (url) => {
    URL.revokeObjectURL(url);
    setMedia((prev) => prev.filter((item) => item.url !== url));
  };

  // `#` alanda SABİT önek olarak durur, kullanıcı yalnız kelimeyi yazar; yine de
  // yapıştırılan/yazılan #, boşluk ve virgül temizlenir (etiket tek kelime).
  const cleanTag = (value) => value.replace(/[#,\s]/g, '');

  const addTag = () => {
    const clean = cleanTag(tagInput);
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
      setUploadingCount(media.length);
      const uploadedMedia = [];
      for (const item of media) {
        const { url } = await (item.type === 'VIDEO' ? uploadVideo : uploadImage)(item.file, MEDIA_FOLDER);
        uploadedMedia.push({ type: item.type, url });
      }
      setUploadingCount(0);

      const post = await createThread({
        portalSlug,
        surface,
        title: title.trim(),
        body: body.trim(),
        media: uploadedMedia,
        tags,
        spoilerFlagged,
      });
      media.forEach((m) => URL.revokeObjectURL(m.url));
      setTitle('');
      setBody('');
      setEditorKey((key) => key + 1);
      setFormat({ bold: false, italic: false });
      setSpoilerFlagged(false);
      setMedia([]);
      setTags([]);
      setExpanded(false);
      onPostCreated?.(post);
    } catch (err) {
      // Backend'in gerçek mesajı (400 validasyon, 401 süresi dolmuş token...)
      // genel "tekrar dene" yerine gösterilir; mesaj yoksa genel metne düşer.
      setError(err.message || t('community.composer.error'));
      setUploadingCount(0);
    } finally {
      setSubmitting(false);
    }
  };

  const mediaLabel = t('community.composer.chooseMedia', { count: media.length, max: MAX_MEDIA });

  return (
    <form
      ref={formRef}
      className={styles.postComposer}
      data-locked={Boolean(lockedPortal) || undefined}
      onSubmit={handleSubmit}
      onFocus={() => setExpanded(true)}
      onBlur={handleBlur}
    >
      <div className={styles.postComposer__row}>
        <span className={styles.postComposer__avatar} style={{ background: avatarColor(username) }}>
          {username.charAt(0).toUpperCase()}
        </span>

        <div className={styles.postComposer__fields}>
          <div className={styles.postComposer__titleRow}>
            <input
              className={styles.postComposer__title}
              placeholder={t('community.composer.titlePlaceholder')}
              aria-label={t('community.composer.titlePlaceholder')}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={140}
            />
            <span className={styles.postComposer__titleIcon} aria-hidden="true">
              <PenNibIcon />
            </span>
          </div>
          {title.length > 0 && titleLength < MIN_TITLE_LENGTH && (
            <p className={styles.postComposer__hint}>
              {t('community.composer.titleMin', { min: MIN_TITLE_LENGTH, count: titleLength })}
            </p>
          )}

          <Collapse open={expanded}>
            <div className={styles.postComposer__section}>
              <div
                key={editorKey}
                ref={bodyRef}
                className={styles.postComposer__body}
                contentEditable
                suppressContentEditableWarning
                role="textbox"
                aria-multiline="true"
                aria-label={t('community.composer.bodyPlaceholder')}
                data-placeholder={t('community.composer.bodyPlaceholder')}
                onInput={handleBodyInput}
                onKeyDown={handleBodyKeyDown}
                onPaste={handleBodyPaste}
              />

              {media.length > 0 && (
                <div className={styles.postComposer__mediaGrid}>
                  {media.map((item) => (
                    <div key={item.url} className={styles.postComposer__preview}>
                      {item.type === 'VIDEO' ? (
                        <video
                          src={item.url}
                          muted
                          preload="metadata"
                          className={styles.postComposer__previewImage}
                        />
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
                  <label className={styles.postComposer__tagField}>
                    <span className={styles.postComposer__tagHash} aria-hidden="true">
                      #
                    </span>
                    <input
                      className={styles.postComposer__tagInput}
                      placeholder={t('community.composer.tagPlaceholder')}
                      aria-label={t('community.composer.tagPlaceholder')}
                      value={tagInput}
                      onChange={(event) => setTagInput(cleanTag(event.target.value))}
                      onKeyDown={(event) => {
                        // Enter, boşluk veya virgül etiketi ekler — tek tek, # otomatik.
                        if (event.key === 'Enter' || event.key === ' ' || event.key === ',') {
                          event.preventDefault();
                          addTag();
                        }
                      }}
                    />
                  </label>
                )}
              </div>

              {/* Portal seçici: dropdown. Yerel <select> — hiçbir şey kaymaz, açılan liste
                  üst katmanda çizilir (daralan bölümün overflow:hidden'ı kırpmaz).
                  Görünüm CSS'te (appearance: base-select); desteklemeyen tarayıcı yerel listeyi gösterir. */}
              <div className={styles.postComposer__surfaceRow}>
                <span className={styles.postComposer__surfaceLabel}>{t('community.composer.portalLabel')}</span>
                {!lockedPortal && portals.status === 'error' && (
                  <span className={styles.postComposer__hint}>{t('community.composer.portalsError')}</span>
                )}
                <span className={styles.postComposer__selectWrap}>
                  <select
                    className={styles.postComposer__select}
                    aria-label={t('community.composer.portalLabel')}
                    value={portalSlug ?? ''}
                    disabled={Boolean(lockedPortal)}
                    data-empty={!portalSlug || undefined}
                    onChange={(event) => setPickedPortalSlug(event.target.value)}
                  >
                    {!lockedPortal && (
                      <option value="" disabled>
                        {t('community.composer.portalPlaceholder')}
                      </option>
                    )}
                    {(lockedPortal ? [lockedPortal] : portalOptions).map((portal) => (
                      <option key={portal.slug} value={portal.slug}>
                        {portal.name}
                      </option>
                    ))}
                  </select>
                  <span className={styles.postComposer__selectChevron} aria-hidden="true">
                    <ChevronIcon />
                  </span>
                </span>
              </div>

              <div className={styles.postComposer__surfaceRow} role="group" aria-label={t('community.composer.typeLabel')}>
                <span className={styles.postComposer__surfaceLabel}>{t('community.composer.typeLabel')}</span>
                {SURFACE_OPTIONS.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    className={styles.postComposer__surfaceButton}
                    data-active={surface === option.key}
                    aria-pressed={surface === option.key}
                    onClick={() => setSurface(option.key)}
                  >
                    {t(option.labelKey)}
                  </button>
                ))}
              </div>
            </div>
          </Collapse>
        </div>
      </div>

      <Collapse open={expanded}>
        <div className={styles.postComposer__footer}>
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
              {/* onMouseDown engeli: editör odağı/seçimi butona geçmesin. */}
              <button
                type="button"
                className={styles.postComposer__tool}
                data-active={format.bold}
                aria-pressed={format.bold}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => applyFormat('bold')}
                aria-label={t('community.composer.bold')}
                title={t('community.composer.bold')}
              >
                <BoldIcon />
              </button>
              <button
                type="button"
                className={styles.postComposer__tool}
                data-active={format.italic}
                aria-pressed={format.italic}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => applyFormat('italic')}
                aria-label={t('community.composer.italic')}
                title={t('community.composer.italic')}
              >
                <ItalicIcon />
              </button>
              <button
                type="button"
                className={styles.postComposer__tool}
                onMouseDown={(event) => event.preventDefault()}
                onClick={applyLink}
                aria-label={t('community.composer.link')}
                title={t('community.composer.link')}
              >
                <LinkIcon />
              </button>
              <button
                type="button"
                className={styles.postComposer__tool}
                data-active={spoilerFlagged}
                aria-pressed={spoilerFlagged}
                onClick={() => setSpoilerFlagged((value) => !value)}
                aria-label={t('community.composer.spoiler')}
                title={t('community.composer.spoiler')}
              >
                <SpoilerIcon />
              </button>
            </div>

            <button type="submit" className={styles.postComposer__submit} disabled={!isValid || submitting}>
              {t('community.composer.submit')}
              <img src={sendIcon} alt="" className={styles.postComposer__submitIcon} />
            </button>
          </div>
        </div>
      </Collapse>
    </form>
  );
}
