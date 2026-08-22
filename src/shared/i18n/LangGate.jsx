import { useEffect } from 'react';
import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom';
import i18n from './i18n';
import { SUPPORTED_LANGS, DEFAULT_LANG } from './constants';

// /:lang altındaki route ağacının kapısı: :lang geçerliyse i18next'i
// senkronlar ve Outlet'i render eder; geçersizse (ör. "/blog" index route'a
// lang="blog" olarak yanlış eşleştiğinde) varsayılan dile yönlendirir.
export function LangGate() {
  const { lang } = useParams();
  const location = useLocation();
  const isValid = SUPPORTED_LANGS.includes(lang);

  useEffect(() => {
    if (isValid) i18n.changeLanguage(lang);
  }, [lang, isValid]);

  if (!isValid) {
    return <Navigate to={`/${DEFAULT_LANG}${location.pathname}`} replace />;
  }

  return <Outlet />;
}

// Prefix'siz eski path'ler için yakalayıcı (kök "/", "/series/breaking-bad" vb.)
// — ayrıca hiçbir route'a eşleşmeyen path'lerin son durağı (React Router bir
// eşleşme bulamazsa buraya düşer). Path zaten geçerli bir dil prefix'iyle
// başlıyorsa (ör. bozuk/tekrarlı bir prefixten dolayı hiçbir alt route'a
// eşleşmiyorsa) o dilin ana sayfasına döner — pathname'e KOŞULSUZ prefix
// eklemek burada sonsuz "/en/en/en/..." döngüsü yaratırdı.
export function LegacyRedirect() {
  const location = useLocation();
  const firstSegment = location.pathname.split('/')[1];
  if (SUPPORTED_LANGS.includes(firstSegment)) {
    return <Navigate to={`/${firstSegment}`} replace />;
  }
  return <Navigate to={`/${DEFAULT_LANG}${location.pathname}`} replace />;
}
