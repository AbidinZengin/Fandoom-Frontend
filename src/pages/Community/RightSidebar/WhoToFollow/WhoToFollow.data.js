// WhoToFollow'un veri erişim katmanı — gerçek GET /api/community/users (public,
// `following` bayraklı) + kişi takibi POST/DELETE /api/me/following/{username}.
// Üye sayısı az olduğu için (12) hepsi tek istekle çekilir; sayı büyüyünce
// öneri/sıralama ucu ve sayfalama gerekir. Kendi hesabın listeden çıkarılır.
import { getUsers } from '../../../../shared/api/community';
import { followUser, unfollowUser } from '../../../../shared/api/account';
import { getStoredAuth } from '../../../../shared/api/authStorage';

export async function getPeopleToFollow() {
  const res = await getUsers({ size: 50 });
  const me = getStoredAuth()?.username;
  return res.content.filter((user) => user.username !== me);
}

export function setFollowing(username, following) {
  return following ? followUser(username) : unfollowUser(username);
}
