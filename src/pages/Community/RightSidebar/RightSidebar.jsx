import { Universes } from './Universes/Universes';
import { TrendingTags } from './TrendingTags/TrendingTags';
import { RecentActivity } from './RecentActivity/RecentActivity';
import { WhoToFollow } from './WhoToFollow/WhoToFollow';
import { getTrendingTags, getRecentActivity, getWhoToFollow } from './RightSidebar.data';
import styles from './RightSidebar.module.css';

// ≤1200px'te tamamen gizlenir (CommunityLayout grid'i 2 koloma düşer) —
// bkz. RightSidebar.module.css. Universes eski UniverseBrowse şeridinin
// yerini alıyor (kullanıcı düzeltmesi, 2026-09-13).
export function RightSidebar() {
  return (
    <aside className={styles.rightSidebar}>
      <Universes />
      <TrendingTags tags={getTrendingTags()} />
      <RecentActivity items={getRecentActivity()} />
      <WhoToFollow people={getWhoToFollow()} />
    </aside>
  );
}
