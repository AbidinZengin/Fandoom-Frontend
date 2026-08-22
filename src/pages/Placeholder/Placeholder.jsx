import { useTranslation } from 'react-i18next';
import { Footer } from '../../components/Footer/Footer';

export default function Placeholder({ titleKey }) {
  const { t } = useTranslation();
  return (
    <>
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 44px)', color: 'var(--fg-muted)', fontWeight: 700 }}>
          {t('placeholder.comingSoon', { title: t(titleKey) })}
        </h1>
      </div>
      <Footer />
    </>
  );
}
