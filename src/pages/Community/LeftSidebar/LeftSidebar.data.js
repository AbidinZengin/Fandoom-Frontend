// LeftSidebar'ın veri erişim katmanı — gerçek backend'e bağlı (mock DEĞİL):
// profil ve özel listeler zaten hazır /api/me/* uçlarını kullanıyor
// (Account.data.js'teki desenin küçük alt-kümesi — burada sadece meta,
// tam enrichment ProfileCard/ListsNav için gerekmiyor).
import { getMyProfile } from '../../../shared/api/account';
import { getMyPortals } from '../../../shared/api/community';
import { getStoredAuth } from '../../../shared/api/authStorage';
import { getCustomLists } from '../../Account/Account.data';

export function hasStoredSession() {
  return Boolean(getStoredAuth()?.token);
}

export async function getSidebarProfile() {
  return getMyProfile();
}

export async function getSidebarLists() {
  return getCustomLists();
}

// GET /api/me/portals — üye olunan portallar (Portallarım).
export async function getSidebarPortals() {
  return getMyPortals();
}
