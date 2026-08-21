import { themeBySlug } from '../../../ProductionDetail/ProductionDetail.theme';
import { IconDesktop, IconTablet, IconMobile, IconUndo, IconRedo } from '../icons';
import styles from './TopBar.module.css';

const DEVICES = [
  { value: 'base', Icon: IconDesktop, label: 'Desktop' },
  { value: 'md', Icon: IconTablet, label: 'Tablet' },
  { value: 'lg', Icon: IconMobile, label: 'Mobile' },
];

// "Fandoom" = jenerik/varsayılan bağlam (belirli bir yapıma bağlı değil) —
// açık editör kabuğu + marka kırmızısı. Gerçek bir yapım seçildiğinde
// PageBuilder tüm kabuğu koyulaştırır (referans: kullanıcının paylaştığı
// çalışan Figma Make prototipi — "tüm arayüz aksanı... dinamik değişiyor").
export const PRODUCTION_OPTIONS = ['fandoom', ...Object.keys(themeBySlug)];

// İnce, sabit üst bar — şablon adı, yapım (dinamik tema) seçici, cihaz/
// breakpoint geçişi, undo/redo, Kaydet.
export function TopBar({
  title,
  onTitleChange,
  productionSlug,
  onProductionChange,
  breakpoint,
  onBreakpointChange,
  canvasWidths,
  onCanvasWidthChange,
  canvasHeights,
  onCanvasHeightChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  saving,
  justSaved,
  onSave,
  justPublished,
  onPublish,
}) {
  const accent = productionSlug === 'fandoom' ? 'var(--brand-red)' : (themeBySlug[productionSlug]?.accent ?? 'var(--brand-red)');

  return (
    <header className={styles.topBar}>
      <div className={styles.topBar__left}>
        <span className={styles.topBar__breadcrumb}>Fandoom /</span>
        <input
          className={styles.topBar__title}
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          aria-label="Template name"
        />
        <select
          className={styles.topBar__production}
          style={{ '--dot-color': accent }}
          value={productionSlug}
          onChange={(e) => onProductionChange(e.target.value)}
        >
          {PRODUCTION_OPTIONS.map((slug) => (
            <option key={slug} value={slug}>
              {slug === 'fandoom' ? 'Fandoom' : slug}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.topBar__right}>
        <div className={styles.topBar__devices}>
          {DEVICES.map(({ value, Icon, label }) => (
            <button
              key={value}
              type="button"
              className={styles.topBar__device}
              data-active={breakpoint === value || undefined}
              title={label}
              aria-label={label}
              onClick={() => onBreakpointChange(value)}
            >
              <Icon width={15} height={15} />
            </button>
          ))}
        </div>

        {/* Her breakpoint'in tuval genişliği serbestçe düzenlenebilir (Faz
            1.5, kullanıcı isteği: "yatayda istediğim kadar uzatabileyim") —
            sabit 3 preset (1360/768/390) sadece varsayılan, kilitli değil.
            Sadece o an SEÇİLİ breakpoint'in genişliği gösterilir, üçü birden
            değil (bar şişmesin). */}
        <input
          type="number"
          className={styles.topBar__canvasWidth}
          value={canvasWidths[breakpoint]}
          min={200}
          step={10}
          title="Tuval genişliği (px)"
          aria-label="Tuval genişliği (px)"
          onChange={(e) => onCanvasWidthChange(breakpoint, Number(e.target.value))}
        />
        <span className={styles.topBar__dimSep}>×</span>
        <input
          type="number"
          className={styles.topBar__canvasWidth}
          value={canvasHeights[breakpoint]}
          min={200}
          step={10}
          title="Tuval yüksekliği (px)"
          aria-label="Tuval yüksekliği (px)"
          onChange={(e) => onCanvasHeightChange(breakpoint, Number(e.target.value))}
        />

        <button type="button" className={styles.topBar__historyButton} onClick={onUndo} disabled={!canUndo} aria-label="Undo" title="Undo (Ctrl+Z)">
          <IconUndo width={16} height={16} />
        </button>
        <button type="button" className={styles.topBar__historyButton} onClick={onRedo} disabled={!canRedo} aria-label="Redo" title="Redo (Ctrl+Shift+Z)">
          <IconRedo width={16} height={16} />
        </button>

        <button
          type="button"
          className={styles.topBar__publish}
          data-published={justPublished || undefined}
          onClick={onPublish}
          disabled={saving}
          title="Taslağı yeni bir build olarak geçmişe ekler — Geçmiş panelinden geri yüklenebilir"
        >
          {justPublished ? 'Published ✓' : 'Publish'}
        </button>
        <button type="button" className={styles.topBar__save} data-saved={justSaved || undefined} onClick={onSave} disabled={saving}>
          {saving ? 'Saving…' : justSaved ? 'Saved ✓' : 'Save'}
        </button>
      </div>
    </header>
  );
}
