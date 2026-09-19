// FeedCard ve ThreadBody arasında paylaşılan avatar rengi — username'den
// deterministik üretilir (gerçek profil fotoğrafı yok, initials-avatar
// standart UI kalıbı).
export function avatarColor(username) {
  let hash = 0;
  for (let i = 0; i < username.length; i += 1) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return `hsl(${Math.abs(hash) % 360}, 60%, 50%)`;
}
