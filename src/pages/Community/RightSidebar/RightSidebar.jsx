import { TopPortals } from './TopPortals/TopPortals';
import { TrendingTags } from './TrendingTags/TrendingTags';
import { RecentActivity } from './RecentActivity/RecentActivity';
import { WhoToFollow } from './WhoToFollow/WhoToFollow';
import { getTrendingTags } from './RightSidebar.data';
import styles from './RightSidebar.module.css';

// ≤1200px'te tamamen gizlenir (CommunityLayout grid'i 2 koloma düşer) —
// bkz. RightSidebar.module.css. TopPortals (Portal = Oda, 2026-09-21) evren
// keşfi için eski Universes'in yerini aldı.
export function RightSidebar({ collapsed }) {
  return (
    <aside className={styles.rightSidebar} data-collapsed={collapsed || undefined}>
      <TopPortals />
      <TrendingTags tags={getTrendingTags()} />
      <RecentActivity />
      <WhoToFollow />
    </aside>
  );
}
