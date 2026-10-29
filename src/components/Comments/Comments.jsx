import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocalizedNavigate } from '../../shared/i18n/useLocalizedNavigate';
import { getStoredAuth } from '../../shared/api/authStorage';
import { getComments, postComment, deleteComment, likeComment, unlikeComment } from '../../shared/api/community';
import { PenNibIcon } from '../../pages/Community/ThreadIcons';
import styles from './Comments.module.css';

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

function ChevronIcon({ up }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" style={{ transform: up ? 'rotate(180deg)' : 'none' }}>
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function timeAgo(iso, t) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return t('blog.commentsJustNow');
  if (minutes < 60) return t('blog.commentsMinutesAgo', { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('blog.commentsHoursAgo', { count: hours });
  const days = Math.floor(hours / 24);
  return t('blog.commentsDaysAgo', { count: days });
}

function Avatar({ author, small }) {
  const cls = small ? styles.avatarSmall : styles.avatar;
  if (author?.avatarUrl) {
    return <img className={cls} src={author.avatarUrl} alt="" />;
  }
  const initial = author?.username?.[0]?.toUpperCase() ?? '?';
  return (
    <span className={cls} aria-hidden="true">
      {initial}
    </span>
  );
}

// Backend'in polimorfik /api/community/comments ucuna bağlanan prototip:
// Blog yazısı altında yorum listesi + ekleme + beğeni + kendi yorumunu
// silme + YANITLAR (backend en fazla 2 seviyeye izin veriyor — bir yanıta
// tekrar yanıt verilemez, bu yüzden Reply butonu SADECE üst seviye
// yorumlarda var). GET zaten her üst yorumla birlikte ilk 3 yanıtını
// (replies[]) gömülü döndürüyor — ayrı bir "yanıtları getir" ucu yok,
// bu yüzden 3'ten fazla yanıt varsa "+N yanıt daha" bilgi amaçlı durur,
// yeni sayfa çekmez (backend'de böyle bir uç eklenirse genişletilir).
// Dislike/unlike backend'de YOK (CommentResponse sadece likeCount/isLiked
// taşıyor) — referans ekran görüntüsündeki thumbs-down uydurulmadı.
export function Comments({ subjectType = 'BLOG', subjectId, variant }) {
  const { t } = useTranslation();
  // Feed'de birden çok kart yorumunu aynı anda açabilir — sabit id çakışırdı.
  const headingId = useId();
  const inputRef = useRef(null);
  const navigate = useLocalizedNavigate();
  const isAuthed = Boolean(getStoredAuth()?.token);
  const myUsername = getStoredAuth()?.username;

  const [comments, setComments] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [body, setBody] = useState('');
  const [error, setError] = useState(null);

  // Yanıt kompozeri: aynı anda tek yorumda açık (id) + taslak metni.
  const [activeReplyId, setActiveReplyId] = useState(null);
  // Hata dönüşünde "şu an başka yanıt yazılıyor mu" bilgisi await sonrası bayat
  // closure'dan değil güncel değerden okunur.
  const activeReplyIdRef = useRef(null);
  activeReplyIdRef.current = activeReplyId;
  const [replyBody, setReplyBody] = useState('');
  // Yanıtlar varsayılan AÇIK gelir (zaten fetch'e gömülü, ekstra istek yok);
  // id burada varsa KAPALI demektir.
  const [collapsedReplies, setCollapsedReplies] = useState({});

  // Neutral yazma kutusu içeriğe göre boyutlanır. useLayoutEffect: boyama
  // ÖNCESİ çalışır, yoksa metin sarılıp kutu eski boyda bir kare çizilir
  // (titreme). Ölçüm anında geçiş kapatılıp yükseklik 'auto'ya alınır, eski
  // px'e geri konur, sonra yeni px'e geçilir — auto'ya geçiş animasyonlanamaz,
  // doğrudan scrollHeight atamak sıçrama yapardı. Taşma yalnız tavana
  // (240px) varınca kaydırılır, yoksa büyürken kaydırma çubuğu parlar.
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el || variant !== 'neutral') return;
    const previous = el.offsetHeight;
    el.style.transition = 'none';
    el.style.height = 'auto';
    const wanted = el.scrollHeight + el.offsetHeight - el.clientHeight;
    el.style.height = `${previous}px`;
    void el.offsetHeight;
    el.style.transition = '';
    el.style.height = `${Math.min(wanted, 240)}px`;
    el.style.overflowY = wanted > 240 ? 'auto' : 'hidden';
  }, [body, variant]);

  // Optimistic gönderimler await'ten sonra state'e dokunur; konu değiştiyse veya
  // component kalktıysa (anahtar sıfırlanır) sonuç yok sayılır — eski konunun
  // yorumu yeni listeye, taslağı yeni konunun formuna karışmasın.
  const subjectKey = `${subjectType}:${subjectId}`;
  const activeKeyRef = useRef(subjectKey);
  const tempSeqRef = useRef(0);
  useEffect(() => {
    activeKeyRef.current = subjectKey;
    return () => {
      activeKeyRef.current = null;
    };
  }, [subjectKey]);

  useEffect(() => {
    if (subjectId == null) return undefined;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getComments(subjectType, subjectId, { page: 0 })
      .then((res) => {
        if (cancelled) return;
        setComments(res.content);
        setPage(res.page);
        setTotalPages(res.totalPages);
        setTotalElements(res.totalElements);
      })
      .catch(() => {
        if (!cancelled) setError(t('blog.commentsLoadError'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [subjectType, subjectId, t]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const res = await getComments(subjectType, subjectId, { page: page + 1 });
      setComments((cs) => [...cs, ...res.content]);
      setPage(res.page);
      setTotalPages(res.totalPages);
    } catch {
      setError(t('blog.commentsLoadError'));
    } finally {
      setLoadingMore(false);
    }
  };

  // Sunucu cevabı beklenmeden gösterilen geçici yorum (isPending); id `temp-`
  // önekli, cevap gelince gerçek kayıtla değiştirilir. Sayaç, aynı milisaniyede
  // art arda gönderimlerde id çakışmasını önler.
  const createTempComment = (text, extra) => {
    const auth = getStoredAuth();
    tempSeqRef.current += 1;
    return {
      id: `temp-${Date.now()}-${tempSeqRef.current}`,
      body: text,
      author: { username: auth?.username, avatarUrl: auth?.avatarUrl ?? null },
      createdAt: new Date().toISOString(),
      likeCount: 0,
      isLiked: false,
      deleted: false,
      isPending: true,
      ...extra,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthed) {
      navigate('/account');
      return;
    }
    const trimmed = body.trim();
    if (trimmed.length < 2) return;
    const key = activeKeyRef.current;
    const temp = createTempComment(trimmed, { replies: [], replyCount: 0 });
    setError(null);
    setComments((cs) => [temp, ...cs]);
    setTotalElements((n) => n + 1);
    setBody('');
    try {
      const created = await postComment({ subjectType, subjectId, body: trimmed });
      if (activeKeyRef.current !== key) return;
      setComments((cs) => cs.map((c) => (c.id === temp.id ? { ...created, replies: [] } : c)));
    } catch (err) {
      if (activeKeyRef.current !== key) return;
      setComments((cs) => cs.filter((c) => c.id !== temp.id));
      setTotalElements((n) => n - 1);
      // Yazılan metin kaybolmasın — kullanıcı bu arada yenisini yazmadıysa geri konur.
      setBody((current) => current || trimmed);
      setError(err.message ?? t('blog.commentsPostError'));
    }
  };

  // Üst seviyede VEYA bir yorumun replies[] listesinde eşleşeni günceller.
  const patchComment = (id, updater) => {
    setComments((cs) =>
      cs.map((c) => {
        if (c.id === id) return updater(c);
        if (c.replies?.some((r) => r.id === id)) {
          return { ...c, replies: c.replies.map((r) => (r.id === id ? updater(r) : r)) };
        }
        return c;
      })
    );
  };

  const toggleLike = async (comment) => {
    const next = !comment.isLiked;
    patchComment(comment.id, (c) => ({ ...c, isLiked: next, likeCount: c.likeCount + (next ? 1 : -1) }));
    try {
      await (next ? likeComment(comment.id) : unlikeComment(comment.id));
    } catch {
      patchComment(comment.id, (c) => ({ ...c, isLiked: !next, likeCount: c.likeCount + (next ? -1 : 1) }));
    }
  };

  const handleDelete = async (comment) => {
    const prev = comments;
    patchComment(comment.id, (c) => ({ ...c, body: null, deleted: true }));
    try {
      await deleteComment(comment.id);
    } catch {
      setComments(prev);
    }
  };

  const openReply = (comment) => {
    setActiveReplyId(comment.id);
    setReplyBody('');
  };

  const submitReply = async (parent) => {
    const trimmed = replyBody.trim();
    if (trimmed.length < 2) return;
    const key = activeKeyRef.current;
    const temp = createTempComment(trimmed, { parentId: parent.id });
    const patchParent = (updater) => setComments((cs) => cs.map((c) => (c.id === parent.id ? updater(c) : c)));
    setError(null);
    patchParent((c) => ({ ...c, replies: [...(c.replies ?? []), temp], replyCount: (c.replyCount ?? 0) + 1 }));
    setCollapsedReplies((prev) => ({ ...prev, [parent.id]: false }));
    setActiveReplyId(null);
    setReplyBody('');
    try {
      const created = await postComment({ subjectType, subjectId, body: trimmed, parentId: parent.id });
      if (activeKeyRef.current !== key) return;
      patchParent((c) => ({ ...c, replies: c.replies.map((r) => (r.id === temp.id ? created : r)) }));
    } catch (err) {
      if (activeKeyRef.current !== key) return;
      patchParent((c) => ({
        ...c,
        replies: c.replies.filter((r) => r.id !== temp.id),
        replyCount: Math.max((c.replyCount ?? 1) - 1, 0),
      }));
      // Yanıt kutusu kapalıysa ve başka bir yanıt yazılmıyorsa metinle birlikte geri açılır.
      if (activeReplyIdRef.current == null) {
        setActiveReplyId(parent.id);
        setReplyBody(trimmed);
      }
      setError(err.message ?? t('blog.commentsPostError'));
    }
  };

  const renderActions = (comment, { canReply } = {}) =>
    !comment.deleted && (
      <div className={styles.item__actions}>
        <button
          type="button"
          className={styles.likeButton}
          data-active={comment.isLiked || undefined}
          onClick={() => toggleLike(comment)}
          disabled={!isAuthed || comment.isPending}
          aria-pressed={comment.isLiked}
        >
          <HeartIcon active={comment.isLiked} />
          {comment.likeCount > 0 && comment.likeCount}
        </button>
        {canReply && isAuthed && !comment.isPending && (
          <button type="button" className={styles.replyButton} onClick={() => openReply(comment)}>
            {t('blog.commentsReply')}
          </button>
        )}
        {comment.author?.username === myUsername && !comment.isPending && (
          <button type="button" className={styles.deleteButton} onClick={() => handleDelete(comment)}>
            {t('blog.commentsDelete')}
          </button>
        )}
      </div>
    );

  const renderReplyComposer = (parent) =>
    activeReplyId === parent.id && (
      <form
        className={styles.replyForm}
        onSubmit={(e) => {
          e.preventDefault();
          submitReply(parent);
        }}
      >
        <textarea
          className={styles.replyForm__input}
          value={replyBody}
          onChange={(e) => setReplyBody(e.target.value)}
          placeholder={t('blog.commentsReplyPlaceholder', { username: parent.author?.username ?? '' })}
          maxLength={2000}
          rows={2}
          autoFocus
        />
        <div className={styles.replyForm__actions}>
          <button type="button" className={styles.replyForm__cancel} onClick={() => setActiveReplyId(null)}>
            {t('blog.commentsCancel')}
          </button>
          <button type="submit" className={styles.form__submit} disabled={replyBody.trim().length < 2}>
            {t('blog.commentsSubmit')}
          </button>
        </div>
      </form>
    );

  const isNeutral = variant === 'neutral';
  // Neutral'da gönder butonu yazma kutusunun İÇİNDE (sağ-alt), Blog'da altında.
  const submitButton = (
    <button type="submit" className={styles.form__submit} disabled={body.trim().length < 2}>
      {t('blog.commentsSubmit')}
    </button>
  );

  return (
    <section
      className={styles.comments}
      data-variant={variant}
      aria-labelledby={isNeutral ? undefined : headingId}
      aria-label={isNeutral ? t('blog.comments') : undefined}
    >
      {/* Neutral (Community) bağlamında başlık yok: sayaç zaten kartın aksiyon çubuğunda. */}
      {!isNeutral && (
        <h2 className={styles.comments__heading} id={headingId}>
          {t('blog.comments')}
          {totalElements > 0 && <span className={styles.comments__count}>{totalElements}</span>}
        </h2>
      )}

      {isAuthed ? (
        <form className={styles.form} onSubmit={handleSubmit}>
          {/* Neutral: PostComposer'daki kalem ucu, kutunun SOL başında (yazmaya davet eden dekor). */}
          <div className={styles.form__field}>
            {isNeutral && (
              <span className={styles.form__icon} aria-hidden="true">
                <PenNibIcon />
              </span>
            )}
            <textarea
              ref={inputRef}
              className={styles.form__input}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={
                isNeutral && !loading && comments.length === 0
                  ? t('blog.commentsEmptyCompact')
                  : t('blog.commentsPlaceholder')
              }
              maxLength={2000}
              rows={isNeutral ? 1 : 3}
            />
            {isNeutral && submitButton}
          </div>
          {!isNeutral && submitButton}
        </form>
      ) : (
        <button type="button" className={styles.loginPrompt} onClick={() => navigate('/account')}>
          {t('blog.commentsLoginPrompt')}
        </button>
      )}

      {error && <p className={styles.status}>{error}</p>}

      {loading ? (
        <p className={styles.status}>{t('blog.loading')}</p>
      ) : comments.length === 0 ? (
        // Neutral'da boş durum yazma kutusunun placeholder'ında anlatılır.
        isNeutral ? null : <p className={styles.comments__empty}>{t('blog.commentsEmpty')}</p>
      ) : (
        <>
          <ul className={styles.list}>
            {comments.map((comment) => {
              const replies = comment.replies ?? [];
              const collapsed = collapsedReplies[comment.id];
              return (
                <li key={comment.id} className={styles.item} data-pending={comment.isPending || undefined}>
                  <div className={styles.item__avatarCol}>
                    <Avatar author={comment.author} />
                    {replies.length > 0 && !collapsed && <div className={styles.item__rail} aria-hidden="true" />}
                  </div>
                  <div className={styles.item__body}>
                    <div className={styles.item__meta}>
                      <span className={styles.item__author}>
                        {comment.author?.username ?? t('blog.commentsUnknownUser')}
                      </span>
                      <span className={styles.item__time}>{timeAgo(comment.createdAt, t)}</span>
                    </div>
                    <p className={comment.deleted ? styles.item__textDeleted : styles.item__text}>
                      {comment.deleted ? t('blog.commentsDeletedPlaceholder') : comment.body}
                    </p>

                    <div className={styles.item__actionsRow}>
                      {renderActions(comment, { canReply: true })}
                      {replies.length > 0 && (
                        <button
                          type="button"
                          className={styles.repliesToggle}
                          onClick={() => setCollapsedReplies((prev) => ({ ...prev, [comment.id]: !prev[comment.id] }))}
                        >
                          {t('blog.commentsRepliesCount', { count: comment.replyCount ?? replies.length })}
                          <ChevronIcon up={!collapsed} />
                        </button>
                      )}
                    </div>

                    {renderReplyComposer(comment)}

                    {replies.length > 0 && !collapsed && (
                      <ul className={styles.replies}>
                        {replies.map((reply) => (
                          <li key={reply.id} className={styles.replyItem} data-pending={reply.isPending || undefined}>
                            <Avatar author={reply.author} small />
                            <div className={styles.item__body}>
                              <div className={styles.item__meta}>
                                <span className={styles.item__author}>
                                  {reply.author?.username ?? t('blog.commentsUnknownUser')}
                                </span>
                                <span className={styles.item__time}>{timeAgo(reply.createdAt, t)}</span>
                              </div>
                              <p className={reply.deleted ? styles.item__textDeleted : styles.item__text}>
                                {reply.deleted ? t('blog.commentsDeletedPlaceholder') : reply.body}
                              </p>
                              {renderActions(reply, { canReply: false })}
                            </div>
                          </li>
                        ))}
                        {(comment.replyCount ?? 0) > replies.length && (
                          <li className={styles.repliesMore}>
                            {t('blog.commentsMoreReplies', { count: (comment.replyCount ?? 0) - replies.length })}
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          {page + 1 < totalPages && (
            <button type="button" className={styles.loadMore} onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? t('blog.loading') : t('blog.commentsLoadMore')}
            </button>
          )}
        </>
      )}
    </section>
  );
}
