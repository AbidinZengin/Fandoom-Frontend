import styles from './TabPills.module.css';

// Pill sekme satırı (referans: Nixtio). `tabs`: [{ key, label }].
export default function TabPills({ tabs, active, onChange, label }) {
  return (
    <div className={styles['tabPills']} role="tablist" aria-label={label}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={active === tab.key}
          className={
            active === tab.key
              ? `${styles['tabPills__tab']} ${styles['tabPills__tab--active']}`
              : styles['tabPills__tab']
          }
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
