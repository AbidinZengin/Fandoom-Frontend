// RightSidebar'ın veri erişim katmanı — tamamen mock (backend'de karşılığı
// yok). Feed/Feed.data.js'teki mock yazar/thread setiyle TUTARLI (kullanıcı
// düzeltmesi, 2026-09-13: eski shared/data/community.js'ten miras alınan
// isimler yeni Feed verisiyle çelişiyordu).
export function getTrendingTags() {
  return [
    { tag: 'theory', count: 1240 },
    { tag: 'severance', count: 890 },
    { tag: 'stranger-things', count: 615 },
    { tag: 'fan-art', count: 402 },
    { tag: 'discussion', count: 317 },
  ];
}
