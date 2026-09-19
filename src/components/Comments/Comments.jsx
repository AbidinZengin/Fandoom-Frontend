import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocalizedNavigate } from '../../shared/i18n/useLocalizedNavigate';
import { getStoredAuth } from '../../shared/api/authStorage';
import { getComments, postComment, deleteComment, likeComment, unlikeComment } from '../../shared/api/community';
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
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState(null);

  // Yanıt kompozeri: aynı anda tek yorumda açık (id) + taslak metni.
  const [activeReplyId, setActiveReplyId] = useState(null);
  const [replyBody, setReplyBody] = useState('');
  const [postingReply, setPostingReply] = useState(false);
  // Yanıtlar varsayılan AÇIK gelir (zaten fetch'e gömülü, ekstra istek yok);
  // id burada varsa KAPALI demektir.
  const [collapsedReplies, setCollapsedReplies] = useState({});

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthed) {
      navigate('/account');
      return;
    }
    const trimmed = body.trim();
    if (trimmed.length < 2) return;
    setPosting(true);
    setError(null);
    try {
      const created = await postComment({ subjectType, subjectId, body: trimmed });
      setComments((cs) => [{ ...created, replies: [] }, ...cs]);
      setTotalElements((n) => n + 1);
      setBody('');
    } catch (err) {
      setError(err.message ?? t('blog.commentsPostError'));
    } finally {
      setPosting(false);
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
    setPostingReply(true);
    try {
      const created = await postComment({ subjectType, subjectId, body: trimmed, parentId: parent.id });
      setComments((cs) =>
        cs.map((c) =>
          c.id === parent.id
            ? { ...c, replies: [...(c.replies ?? []), created], replyCount: (c.replyCount ?? 0) + 1 }
            : c
        )
      );
      setCollapsedReplies((prev) => ({ ...prev, [parent.id]: false }));
      setActiveReplyId(null);
      setReplyBody('');
    } catch (err) {
      setError(err.message ?? t('blog.commentsPostError'));
    } finally {
      setPostingReply(false);
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
          disabled={!isAuthed}
          aria-pressed={comment.isLiked}
        >
          <HeartIcon active={comment.isLiked} />
          {comment.likeCount > 0 && comment.likeCount}
        </button>
        {canReply && isAuthed && (
          <button type="button" className={styles.replyButton} onClick={() => openReply(comment)}>
            {t('blog.commentsReply')}
          </button>
        )}
        {comment.author?.username === myUsername && (
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
          <button type="submit" className={styles.form__submit} disabled={postingReply || replyBody.trim().length < 2}>
            {t('blog.commentsSubmit')}
          </button>
        </div>
      </form>
    );

  return (
    <section className={styles.comments} data-variant={variant} aria-labelledby="comments-heading">
      <h2 className={styles.comments__heading} id="comments-heading">
        {t('blog.comments')}
        {totalElements > 0 && <span className={styles.comments__count}>{totalElements}</span>}
      </h2>

      {isAuthed ? (
        <form className={styles.form} onSubmit={handleSubmit}>
          <textarea
            className={styles.form__input}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t('blog.commentsPlaceholder')}
            maxLength={2000}
            rows={3}
          />
          <button type="submit" className={styles.form__submit} disabled={posting || body.trim().length < 2}>
            {t('blog.commentsSubmit')}
          </button>
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
        <p className={styles.comments__empty}>{t('blog.commentsEmpty')}</p>
      ) : (
        <>
          <ul className={styles.list}>
            {comments.map((comment) => {
              const replies = comment.replies ?? [];
              const collapsed = collapsedReplies[comment.id];
              return (
                <li key={comment.id} className={styles.item}>
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
                          <li key={reply.id} className={styles.replyItem}>
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
