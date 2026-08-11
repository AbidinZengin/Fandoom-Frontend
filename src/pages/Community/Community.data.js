// Community hub sayfasının veri erişim katmanı — thread/universe listesi
// ileride GET /api/community/threads (surface bazlı) ve GET
// /api/community/universes çağrılarına dönüşecek seam (backend'de bu modül
// henüz yok, mock kalır). Universe kartlarındaki production'lar ise gerçek
// backend'e bağlı (GET /api/productions).
import { threads, universes, SURFACES } from '../../shared/data/community';
import { resolveProductionBySlug } from '../../shared/api/productions';
import { getProductionAccent } from '../../shared/theme/productionAccent';

const HIGHLIGHT_LIMIT = 3;

// 5 yüzeyden karışık öne-çıkanlar vitrini (learned-rules [[topluluk-navigasyon]]
// hub-and-spoke) — her yüzey en fazla HIGHLIGHT_LIMIT öğe taşır.
export function getSurfaceHighlights() {
  return SURFACES.map((surface) => ({
    ...surface,
    items: threads.filter((t) => t.surface === surface.key).slice(0, HIGHLIGHT_LIMIT),
  }));
}

// "Evrene göre gez" kartları — evren klasör değil, sadece giriş noktası
// (learned-rules [[topluluk-organizasyon]]). Asenkron: production'lar
// gerçek API'den gelir, Community.jsx hazır olana kadar boş dizide bekler.
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
