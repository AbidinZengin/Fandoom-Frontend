// Breaking Bad sayfasının altındaki "Related Blogs" şeridinin veri kaynağı.
// GET /api/blogs/related yapım seviyesinde çağrılır; ancak backend kademeli
// geri düşüş yapıyor (yapım → evren → popülerlik) ve az etiketli yapımda
// şeridi başka dizilerin blogları doldurur. Kullanıcı kararı: SADECE Breaking
// Bad etiketli bloglar gösterilir. Özet öğesi (BlogSummaryResponse) etiket
// taşımadığı için her blogun tags[]'i GET /api/blogs/{id} ile okunur (slug
// ucu her çağrıda viewCount artırdığı için KULLANILMAZ) ve subjectId
// dizinin id'siyle eşleşenler tutulur.
// Backend istek listesi: related uca sıkı filtre (yalnız o yapımın etiketli
// blogları) veya özete tags[] gelince bu N+1 çağrı kalkar.
import { fetchBlogById, fetchRelatedBlogs } from '../../../../shared/api/blogs';

export async function getBreakingBadBlogs(seriesId) {
  const related = await fetchRelatedBlogs({
    productionType: 'SERIES',
    productionSlug: 'breaking-bad',
  });
  // allSettled: tek bir blogun detay çağrısı düşerse diğerleri yine gösterilir.
  const details = await Promise.allSettled(related.map((blog) => fetchBlogById(blog.id)));
  return related.filter((_, i) => {
    const detail = details[i];
    return (
      detail.status === 'fulfilled' &&
      detail.value.tags?.some((tag) => tag.subjectType === 'SERIES' && tag.subjectId === seriesId)
    );
  });
}
