import { useLocation, useNavigate } from 'react-router-dom';
import { useLang } from '../../../shared/i18n/useLang';
import { SUPPORTED_LANGS } from '../../../shared/i18n/constants';
import styles from './LanguageSwitcher.module.css';

// Sayfayı değiştirmeden path'in dil segmentini yer değiştirir
// ("/en/series/breaking-bad" -> "/tr/series/breaking-bad").
export function LanguageSwitcher() {
  const lang = useLang();
  const location = useLocation();
  const navigate = useNavigate();

  const switchTo = (target) => {
    if (target === lang) return;
    const rest = location.pathname.split('/').slice(2).join('/');
    navigate(`/${target}/${rest}${location.search}`);
  };

  return (
    <div className={styles['lang-switcher']}>
      {SUPPORTED_LANGS.map((code) => (
        <button
          key={code}
          type="button"
          className={
            code === lang
              ? `${styles['lang-switcher__option']} ${styles['lang-switcher__option--active']}`
              : styles['lang-switcher__option']
          }
          onClick={() => switchTo(code)}
          aria-pressed={code === lang}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
