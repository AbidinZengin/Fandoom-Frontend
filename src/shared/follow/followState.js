// Kişi takibi durumu — backend FollowState enum'u: NONE | FOLLOWING | REQUESTED.
// Takip/durum yanıtı { following, status }; liste satırları yalnız `following`
// boolean'ı taşır (bkz. FollowUserResponse), o yüzden ikisi de buradan çözülür.
export function toFollowStatus(source) {
  if (source?.status) return source.status;
  return source?.following ? 'FOLLOWING' : 'NONE';
}

// Buton etiketi i18n anahtarı. `followKey` yüzeye göre değişir (WhoToFollow'un
// kendi "Takip et" metni var).
export function followLabelKey(status, followKey = 'account.profile.follow') {
  if (status === 'FOLLOWING') return 'account.profile.following';
  if (status === 'REQUESTED') return 'account.profile.requested';
  return followKey;
}
