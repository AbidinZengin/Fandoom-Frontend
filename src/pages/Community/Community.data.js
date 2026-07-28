// Community hub sayfasının veri erişim katmanı — ileride GET /api/community/threads
// (surface bazlı) ve GET /api/community/universes çağrılarına dönüşecek seam.
import { threads, universes, SURFACES } from '../../shared/data/community';
import { getProductionBySlug } from '../../shared/data/productions';

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
// (learned-rules [[topluluk-organizasyon]]).
export function getUniverseCards() {
  return universes.map((universe) => ({
    ...universe,
    productions: universe.productionSlugs.map(getProductionBySlug).filter(Boolean),
  }));
}
