import { useNavigate } from 'react-router-dom';
import { useLang } from './useLang';

// useNavigate sarmalayıcısı — LocalizedLink ile aynı prefix mantığı.
export function useLocalizedNavigate() {
  const navigate = useNavigate();
  const lang = useLang();

  return (to, options) => {
    const localizedTo =
      typeof to === 'string' && to.startsWith('/') && !to.startsWith('/admin')
        ? `/${lang}${to}`
        : to;
    navigate(localizedTo, options);
  };
}
