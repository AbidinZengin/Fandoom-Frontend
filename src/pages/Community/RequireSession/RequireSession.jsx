import { useTranslation } from 'react-i18next';
import { LocalizedLink } from '../../../shared/i18n/LocalizedLink';
import { getStoredAuth } from '../../../shared/api/authStorage';
import styles from './RequireSession.module.css';

// Kişisel Community sayfaları (kütüphane, listeler, ayarlar) oturum ister.
// Oturumsuzken orta kolonda giriş çağrısı çıkar; giriş tek yerde (/account)
// kalır, giriş sonrası kullanıcı ayrıldığı sayfaya döner (returnTo).
export function RequireSession({ children }) {
  const { t } = useTranslation();
  if (getStoredAuth()?.token) return children;

  return (
    <section className={styles.requireSession}>
      <h1 className={styles.requireSession__title}>{t('community.sidebar.ctaTitle')}</h1>
      <p className={styles.requireSession__body}>{t('community.sidebar.ctaBody')}</p>
      <LocalizedLink to="/account" className={styles.requireSession__button}>
        {t('community.sidebar.signIn')}
      </LocalizedLink>
    </section>
  );
}
