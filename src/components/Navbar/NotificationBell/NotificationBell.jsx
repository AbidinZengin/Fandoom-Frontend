import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LocalizedLink as Link } from '../../../shared/i18n/LocalizedLink';
import {
  hasSession,
  getUnreadCount,
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  acceptFollowRequest,
  rejectFollowRequest,
} from './NotificationBell.data';
import styles from './NotificationBell.module.css';

// Bilinmeyen type'lar sessizce atlanır (backend enum'u genişleyebilir).
const TEXT_KEYS = {
  FOLLOW: 'navbar.notifications.follow',
  FOLLOW_REQUEST: 'navbar.notifications.followRequest',
  FOLLOW_ACCEPTED: 'navbar.notifications.followAccepted',
};

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M6 16.5V11a6 6 0 1 1 12 0v5.5l1.5 1.5h-15L6 16.5Z" strokeLinejoin="round" />
      <path d="M10 20a2 2 0 0 0 4 0" strokeLinecap="round" />
    </svg>
  );
}

// Oturum yokken hiç render olmaz. Okunmamış sayı oturum/rota değişince tazelenir
// (giriş yapınca Navbar yeniden mount olmaz); liste panel açılınca çekilir.
export function NotificationBell() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('idle');
  // Karar bekleyen istek satırları — çift tık iki istek atmasın.
  const [busy, setBusy] = useState(() => new Set());

  useEffect(() => {
    if (!hasSession()) return;
    getUnreadCount()
      .then(setUnread)
      .catch(() => {});
  }, [pathname]);

  const loadList = useCallback(async () => {
    setStatus('loading');
    try {
      const res = await getMyNotifications();
      setItems(res.content.filter((n) => TEXT_KEYS[n.type]));
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (open) loadList();
  }, [open, loadList]);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onPointerDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);

  if (!hasSession()) return null;

  const markRead = (item) => {
    if (item.read) return;
    setItems((list) => list.map((n) => (n.id === item.id ? { ...n, read: true } : n)));
    setUnread((c) => Math.max(0, c - 1));
    markNotificationRead(item.id).catch(() => {});
  };

  const handleReadAll = () => {
    setItems((list) => list.map((n) => ({ ...n, read: true })));
    setUnread(0);
    markAllNotificationsRead().catch(() => {});
  };

  // Kabul/ret sonrası satır listeden kalkar; bildirim de okundu sayılır ki
  // sayaçta asılı kalmasın.
  const handleDecision = async (item, accept) => {
    if (busy.has(item.id)) return;
    setBusy((s) => new Set(s).add(item.id));
    try {
      await (accept ? acceptFollowRequest : rejectFollowRequest)(item.actor.username);
      markRead(item);
      setItems((list) => list.filter((n) => n.id !== item.id));
    } catch {
      setStatus('error');
    } finally {
      setBusy((s) => {
        const next = new Set(s);
        next.delete(item.id);
        return next;
      });
    }
  };

  return (
    <div className={styles.bell} ref={rootRef}>
      <button
        type="button"
        className={styles.bell__button}
        onClick={() => setOpen((v) => !v)}
        aria-label={t('navbar.notifications.ariaLabel')}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <BellIcon />
        {unread > 0 && (
          <span className={styles.bell__badge}>
            <span className={styles.bell__badgeText}>{unread > 99 ? '99+' : unread}</span>
          </span>
        )}
      </button>

      {open && (
        <div className={styles.bell__panel} role="region" aria-label={t('navbar.notifications.heading')}>
          <div className={styles.bell__head}>
            <h2 className={styles.bell__title}>{t('navbar.notifications.heading')}</h2>
            {unread > 0 && (
              <button type="button" className={styles.bell__readAll} onClick={handleReadAll}>
                {t('navbar.notifications.readAll')}
              </button>
            )}
          </div>

          {items.length > 0 && (
            <ul className={styles.bell__list}>
              {items.map((item) => {
                const username = item.actor.username;
                return (
                  <li key={item.id} className={styles.bell__item} data-unread={!item.read || undefined}>
                    <Link
                      to={`/community/u/${encodeURIComponent(username)}`}
                      className={styles.bell__person}
                      onClick={() => {
                        markRead(item);
                        setOpen(false);
                      }}
                    >
                      {item.actor.avatarUrl ? (
                        <img src={item.actor.avatarUrl} alt="" className={styles.bell__avatar} />
                      ) : (
                        <span className={styles.bell__avatar} aria-hidden="true">
                          {username.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <span className={styles.bell__text}>{t(TEXT_KEYS[item.type], { username })}</span>
                    </Link>

                    {item.type === 'FOLLOW_REQUEST' && (
                      <div className={styles.bell__decision}>
                        <button
                          type="button"
                          className={styles.bell__accept}
                          disabled={busy.has(item.id)}
                          onClick={() => handleDecision(item, true)}
                        >
                          {t('navbar.notifications.accept')}
                        </button>
                        <button
                          type="button"
                          className={styles.bell__reject}
                          disabled={busy.has(item.id)}
                          onClick={() => handleDecision(item, false)}
                        >
                          {t('navbar.notifications.reject')}
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {status === 'ready' && items.length === 0 && (
            <p className={styles.bell__message}>{t('navbar.notifications.empty')}</p>
          )}
          {status === 'error' && (
            <p className={styles.bell__message} role="alert">
              {t('navbar.notifications.error')}
            </p>
          )}
          {status === 'loading' && items.length === 0 && (
            <p className={styles.bell__message} role="status">
              {t('navbar.notifications.loading')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
