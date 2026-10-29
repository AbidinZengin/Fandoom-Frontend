// SettingsSection'ın veri erişim katmanı — şimdilik yalnız gizli hesap
// anahtarı backend'e bağlı (PATCH /api/me/profile { isPrivate }).
import { getMyProfile, updateMyProfile } from '../../../../shared/api/account';

export async function getIsPrivate() {
  const profile = await getMyProfile();
  return Boolean(profile.isPrivate);
}

export function setIsPrivate(isPrivate) {
  return updateMyProfile({ isPrivate });
}
