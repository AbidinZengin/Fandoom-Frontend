// UserProfile'ın veri erişim katmanı — başkasının herkese açık profili.
// Backend sözleşmesi: docs/plans/2026-10-23-community-profile-api-contract.md
import { getStoredAuth } from '../../../shared/api/authStorage';
import { followUser, unfollowUser, getMyFollowingStatus } from '../../../shared/api/account';

export { getUserProfile, getMyProfile } from '../../../shared/api/account';

// Oturumsuzken uç 401 verir; istek hiç atılmaz, takip durumu "takip etmiyor"
// sayılır. Uç başka bir sebeple düşerse de sayfa düşmez.
export async function getFollowStatus(username) {
  if (!getStoredAuth()?.token) return { following: false };
  try {
    return await getMyFollowingStatus(username);
  } catch {
    return { following: false };
  }
}

export function setFollowing(username, following) {
  return following ? followUser(username) : unfollowUser(username);
}
