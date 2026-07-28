// ProductionDetail'in veri erişim katmanı — GET /api/movies/slug/:slug ve
// GET /api/series/slug/:slug'a bağlı. theories hâlâ mock (backend'de
// forum/community modülü henüz yok) — shared/data/community.js'ten THEORY
// yüzeyi filtrelenir.
import { threads } from '../../shared/data/community';

export { fetchProductionDetail } from '../../shared/api/productions';
export { resolveGenreNames } from '../../shared/api/genres';
export const theories = threads.filter((t) => t.surface === 'THEORY');
