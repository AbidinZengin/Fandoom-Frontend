import { useEffect, useRef, useState } from 'react';
import { EXTRA_STYLE_PROPERTIES } from '../SeriesHeroEditor.data';
import styles from './PropertyMenu.module.css';

// Kullanıcı isteği: "componentlerin özellikleri sağ tıkla bir sürü şey
// ekleyebiliyor olayım" — bloğa sağ tıklayınca beliren, sabit kontrollerin
// (radius/blur/font) DIŞINDA kalan CSS özelliklerini keşfedilebilir şekilde
// eklemeye yarayan bağlam menüsü. "Custom…" ile listede olmayan herhangi
// bir özellik adı da serbestçe eklenebilir (tam kaçış kapısı).
export function PropertyMenu({ x, y, existingKeys, onAdd, onClose }) {
  const [customMode, setCustomMode] = useState(false);
  const [customKey, setCustomKey] = useState('');
  const [query, setQuery] = useState('');
  const menuRef = useRef(null);

  useEffect(() => {
    const onDocPointerDown = (e) => {
      if (!menuRef.current?.contains(e.target)) onClose();
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('pointerdown', onDocPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onDocPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  const q = query.trim().toLowerCase();
  const available = EXTRA_STYLE_PROPERTIES.filter(
    (p) => !existingKeys.includes(p.key) && (q === '' || p.label.toLowerCase().includes(q) || p.key.toLowerCase().includes(q))
  );

  return (
    <div ref={menuRef} className={styles.menu} style={{ left: x, top: y }}>
      <span className={styles.menu__label}>Add property</span>
      <input
        type="text"
        className={styles.menu__search}
        placeholder="Search…"
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {available.length === 0 && !customMode && <p className={styles.menu__empty}>No match — try "Custom…".</p>}
      {available.map((prop) => (
        <button
          key={prop.key}
          type="button"
          className={styles.menu__item}
          onClick={() => {
            onAdd(prop.key);
            onClose();
          }}
        >
          {prop.label}
        </button>
      ))}
      {customMode ? (
        <form
          className={styles.menu__customForm}
          onSubmit={(e) => {
            e.preventDefault();
            const key = customKey.trim();
            if (key) onAdd(key);
            onClose();
          }}
        >
          <input
            autoFocus
            type="text"
            placeholder="CSS property (camelCase)"
            value={customKey}
            onChange={(e) => setCustomKey(e.target.value)}
          />
          <button type="submit">Add</button>
        </form>
      ) : (
        <button type="button" className={styles.menu__item} data-custom onClick={() => setCustomMode(true)}>
          Custom…
        </button>
      )}
    </div>
  );
}
