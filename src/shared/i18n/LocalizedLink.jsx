import { Link } from 'react-router-dom';
import { useLang } from './useLang';

// react-router-dom Link sarmalayıcısı — mutlak `to` path'ine mevcut dil
// prefix'ini ekler ("/blog" -> "/en/blog"). Admin path'leri (/admin/...)
// prefix'siz kalır, dokunulmaz.
export function LocalizedLink({ to, ...rest }) {
  const lang = useLang();
  const localizedTo =
    typeof to === 'string' && to.startsWith('/') && !to.startsWith('/admin')
      ? `/${lang}${to}`
      : to;

  return <Link to={localizedTo} {...rest} />;
}
