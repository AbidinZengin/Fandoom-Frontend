import { Link } from 'react-router-dom';
import { useLang } from './useLang';
import { withLangPrefix } from './constants';

// react-router-dom Link sarmalayıcısı — mutlak `to` path'ine mevcut dil
// prefix'ini ekler ("/blog" -> "/en/blog"). Admin path'leri (/admin/...)
// prefix'siz kalır, dokunulmaz. Zaten prefixli path'lere tekrar eklenmez.
export function LocalizedLink({ to, ...rest }) {
  const lang = useLang();
  return <Link to={withLangPrefix(to, lang)} {...rest} />;
}
