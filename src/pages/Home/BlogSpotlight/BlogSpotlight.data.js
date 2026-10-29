// BlogSpotlight'ın veri erişim katmanı — GET /api/blogs (küratörlü hub feed'i).
// İlk blog manşet, sonraki 3'ü yan liste olur. Hata durumunda null döner:
// component sessizce hiç render olmaz (sahte içerikle doldurulmaz).
import { fetchBlogs } from '../../../shared/api/blogs';

export async function getBlogSpotlight() {
  try {
    const { content } = await fetchBlogs({ size: 4 });
    const [lead, ...rest] = content;
    return lead ? { lead, rest } : null;
  } catch {
    return null;
  }
}
