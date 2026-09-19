// Universes widget'ının veri erişim katmanı — eski UniverseBrowse'daki
// mantığın taşınmış hâli (backend'de bu modül henüz yok, universes mock
// kalır; production'lar gerçek backend'e bağlı). Learned-rules
// [[topluluk-organizasyon]]: evren KLASÖR değil, giriş noktası/tag.
import { universes } from '../../../../shared/data/community';
import { resolveProductionBySlug } from '../../../../shared/api/productions';
import { getProductionAccent } from '../../../../shared/theme/productionAccent';

export async function getUniverseCards() {
  return Promise.all(
    universes.map(async (universe) => {
      const resolved = await Promise.all(universe.productionSlugs.map(resolveProductionBySlug));
      const productions = universe.productionSlugs
        .map((slug, i) => (resolved[i] ? { title: resolved[i].title, ...getProductionAccent(slug) } : null))
        .filter(Boolean);
      return { ...universe, productions };
    })
  );
}
