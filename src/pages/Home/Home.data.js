// Home'un veri erişim katmanı — ileride GET /api/community/threads?surface=...
// servis çağrılarına dönüşecek seam. Ortak kaynak: shared/data/community.js
// (Category.surface modeli — bkz. learned-rules "Topluluk" bölümü).
import { threads } from '../../shared/data/community';

export const theories = threads.filter((t) => t.surface === 'THEORY');
export const news = threads.filter((t) => t.surface === 'NEWS');
export const blogPosts = threads.filter((t) => t.surface === 'BLOG');
