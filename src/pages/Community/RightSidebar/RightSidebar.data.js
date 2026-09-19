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

export function getRecentActivity() {
  return [
    { id: 'ra1', username: 'flynn_theories', action: 'posted', threadId: '1', threadTitle: 'Walt Jr. always knew more than he let on', timeAgo: '25m' },
    { id: 'ra2', username: 'redwyrm_art', action: 'posted', threadId: '3', threadTitle: 'Caraxes mid-dive, Blackwater Bay below', timeAgo: '2h' },
    { id: 'ra3', username: 'macrodata_mike', action: 'commented', threadId: '4', threadTitle: 'The elevator itself is the real severance barrier', timeAgo: '3h' },
    { id: 'ra4', username: 'gate_theorist', action: 'commented', threadId: '10', threadTitle: 'Vecna needed Eleven specifically, not just any gifted kid', timeAgo: '1d' },
  ];
}

export function getWhoToFollow() {
  return [
    { username: 'gate_theorist', bio: 'Stranger Things lore, mostly Upside Down mechanics.', followerCount: 3400 },
    { username: 'macrodata_mike', bio: 'Severance theories, way too many spreadsheets.', followerCount: 2870 },
    { username: 'redwyrm_art', bio: 'Fan art, one dragon at a time.', followerCount: 1950 },
  ];
}
