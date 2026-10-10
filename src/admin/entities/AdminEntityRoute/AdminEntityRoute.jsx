import { Navigate, useLocation } from 'react-router-dom';
import { pathOf, parseAdminPath } from '../adminPath';
import EntityEditPage from '../EntityEditPage/EntityEditPage';
import EntityListPage from '../EntityListPage/EntityListPage';

// /admin/* içindeki varlık URL'lerini çözer: `series` → liste, `series/7/seasons/18`
// → düzenleme (zincir). Alt varlık listesi ayrı sayfa değil, ebeveynin sekmesidir.
export default function AdminEntityRoute() {
  // Rota segmentleri statik (App.jsx), bu yüzden `*` parametresi yerine tam yoldan çözülür.
  const rest = useLocation().pathname.replace(/^\/admin\//, '');
  const parsed = parseAdminPath(rest);

  if (!parsed) return <p style={{ color: 'var(--fg-muted)', margin: 0 }}>Böyle bir bölüm yok.</p>;

  if (parsed.kind === 'list') {
    if (parsed.chain.length === 0) return <EntityListPage entity={parsed.listEntity} />;
    return <Navigate to={`${pathOf(parsed.chain)}?tab=${parsed.listEntity.key}`} replace />;
  }

  return <EntityEditPage key={pathOf(parsed.chain)} chain={parsed.chain} />;
}
