import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getStoredAuth } from '../../../shared/api/authStorage';
import { MoreIcon } from '../ThreadIcons';
import styles from './ThreadMenu.module.css';

// Kartın sağ üstündeki "..." menüsü (FeedCard + ThreadBody ortak). İçerik
// dinamik: kendi postunda düzenleme/kapatma/silme, başkasınınkinde sessize
// alma/şikayet. Şimdilik yalnız "Bağlantıyı Kopyala" ve "Uygulama Dışında
// Paylaş" gerçek çalışır — thread için edit/delete/report/mute/bildirim/
// yorumları-kapat uçları backend'de YOK (istek listesinde), o öğeler sahte
// çalışmak yerine "Yakında" olarak pasif durur (learned-rules [veri]).
// Kendi post ayrımı: yazar kimliği (id) gelmediği için kullanıcı adı karşılaştırılır.
export function ThreadMenu({ thread, shareUrl }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const listRef = useRef(null);
  const copiedTimer = useRef(null);
  const listId = useId();

  const username = getStoredAuth()?.username;
  const isOwn = Boolean(username) && username === thread.author;

  // Dışarı tıklama / Escape menüyü kapatır; Escape odağı tetikleyiciye döndürür.
  useEffect(() => {
    if (!open) return undefined;
    const handlePointer = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const handleKey = (event) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener('pointerdown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('pointerdown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  // Açılınca odak ilk öğeye geçer (menü klavye sözleşmesi); pasif "Yakında"
  // öğeleri de gezilir — odaklanabilir ama seçilemez (APG).
  useEffect(() => {
    if (open) listRef.current?.querySelector('[role="menuitem"]')?.focus();
  }, [open]);

  useEffect(() => () => clearTimeout(copiedTimer.current), []);

  const handleListKeyDown = (event) => {
    if (event.key === 'Tab') {
      setOpen(false);
      return;
    }
    const menuItems = Array.from(listRef.current.querySelectorAll('[role="menuitem"]'));
    const current = menuItems.indexOf(document.activeElement);
    const target = {
      ArrowDown: (current + 1) % menuItems.length,
      ArrowUp: (current - 1 + menuItems.length) % menuItems.length,
      Home: 0,
      End: menuItems.length - 1,
    }[event.key];
    if (target === undefined) return;
    event.preventDefault();
    menuItems[target].focus();
  };

  const copyLink = () => {
    navigator.clipboard
      ?.writeText(shareUrl)
      .then(() => {
        setCopied(true);
        copiedTimer.current = setTimeout(() => {
          setCopied(false);
          setOpen(false);
        }, 1000);
      })
      .catch(() => {});
  };

  const shareExternal = () => {
    navigator.share?.({ title: thread.title, url: shareUrl }).catch(() => {});
    setOpen(false);
  };

  const copyItem = { key: 'copyLink', label: copied ? t('community.thread.linkCopied') : t('community.menu.copyLink'), onSelect: copyLink };
  const items = isOwn
    ? [
        { key: 'edit', soon: true },
        copyItem,
        { key: 'closeComments', soon: true },
        { key: 'delete', soon: true, danger: true },
      ]
    : [
        copyItem,
        ...(typeof navigator.share === 'function' ? [{ key: 'shareExternal', onSelect: shareExternal }] : []),
        { key: 'notifications', soon: true },
        { key: 'muteBlock', soon: true },
        { key: 'report', soon: true, danger: true },
      ];

  return (
    <div ref={rootRef} className={styles.threadMenu} data-open={open || undefined}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.threadMenu__trigger}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={t('community.menu.label')}
        onClick={() => setOpen((value) => !value)}
      >
        <MoreIcon />
      </button>

      {open && (
        <div ref={listRef} id={listId} className={styles.threadMenu__list} role="menu" onKeyDown={handleListKeyDown}>
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              role="menuitem"
              className={styles.threadMenu__item}
              data-danger={item.danger || undefined}
              aria-disabled={item.soon || undefined}
              onClick={item.soon ? undefined : item.onSelect}
            >
              {item.label ?? t(`community.menu.${item.key}`, { user: thread.author })}
              {item.soon && <span className={styles.threadMenu__soon}>{t('community.menu.soon')}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
