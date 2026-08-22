import { useNavigate } from 'react-router-dom';
import { useLang } from './useLang';
import { withLangPrefix } from './constants';

// useNavigate sarmalayıcısı — LocalizedLink ile aynı prefix mantığı.
export function useLocalizedNavigate() {
  const navigate = useNavigate();
  const lang = useLang();

  return (to, options) => {
    navigate(withLangPrefix(to, lang), options);
  };
}
