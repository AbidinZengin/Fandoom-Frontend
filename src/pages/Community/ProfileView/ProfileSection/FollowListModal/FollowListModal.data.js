// FollowListModal'ın veri erişim katmanı — takipçi/takip edilen listesi ve
// satır takip butonu. Backend sözleşmesi:
// docs/plans/2026-10-23-community-profile-api-contract.md
import { getFollowers, getFollowing } from '../../../../../shared/api/account';

export { setFollowing } from '../../../UserProfile/UserProfile.data';

const PAGE_SIZE = 20;

export function getFollowList(kind, username, page) {
  const fetchList = kind === 'followers' ? getFollowers : getFollowing;
  return fetchList(username, { page, size: PAGE_SIZE });
}
