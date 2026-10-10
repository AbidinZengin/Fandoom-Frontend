// "Geldiğin yere dön": oturum gerektiren bir yerden (yorum, kaydet butonu, admin
// paneli…) /account'a yönlenen kullanıcı giriş yapınca ayrıldığı sayfaya döner.
// Router her sayfa değişiminde konumu buraya bildirir (trackLocation); /account
// altındaki konumlar kaydedilmez, böylece "son içerik konumu" hep geldiğin yerdir.
const ACCOUNT_PATH = /^\/(?:[a-z]{2}\/)?account(?:\/|$)/;

let lastContentLocation = null;

export function trackLocation(path) {
  if (!ACCOUNT_PATH.test(path)) lastContentLocation = path;
}

// Giriş sonrası bir kez okunur; yoksa (doğrudan /account'a gelindiyse) null.
export function takeReturnTo() {
  const path = lastContentLocation;
  lastContentLocation = null;
  return path;
}
