import { useLocation } from 'react-router-dom';
import { SUPPORTED_LANGS, DEFAULT_LANG } from './constants';

// Route ağacına bağımlı değil (useParams değil) — Navbar/Footer gibi
// <Routes> DIŞINDA render edilen component'lerde de çalışır.
export function useLang() {
  const { pathname } = useLocation();
  const first = pathname.split('/')[1];
  return SUPPORTED_LANGS.includes(first) ? first : DEFAULT_LANG;
}
