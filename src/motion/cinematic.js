// Carousel → seri sayfası "cinematic" geçiş bayrağı.
// Router state yerine modül bayrağı: sayfa yenilenince sıfırlanır (reveal
// yalnızca carousel'den gelişte oynar), history'de iz bırakmaz. Zaman
// pencereli okuma StrictMode'un çift effect çağrısına dayanıklıdır —
// tek seferlik "consume" bayrağı ikinci çağrıda yanlış negatif verirdi.
const ARM_WINDOW_MS = 1500;

let armedAt = 0;

/** Kart tıklamasında, navigasyondan hemen önce çağrılır. */
export function armCinematic() {
  armedAt = performance.now();
}

/** Hedef sayfa mount'unda: geçiş carousel'den mi tetiklendi? */
export function isCinematicArmed() {
  return armedAt > 0 && performance.now() - armedAt < ARM_WINDOW_MS;
}

// Navbar App kökünde TEK SEFER mount olur (route değişiminde yeniden mount
// olmaz, bkz. App.jsx) — bir sayfanın giriş animasyonu sırasında navbar'ı
// geri çekmesi için prop/context değil, Navbar'ın kendi geri-alınabilir
// hideAnim'ini burada kayıt eden ince bir callback köprüsü yeterli.
let navbarHideFn = null;

/** Navbar mount'unda kendi gizleme tween'ini kaydeder. */
export function registerNavbarHide(fn) {
  navbarHideFn = fn;
}

/**
 * Bir sayfa giriş animasyonu başlarken navbar'ı geri çeker.
 * @param {number} [duration] verilirse normal scroll-hide'dan yavaş, ayrı bir tween.
 */
export function hideNavbar(duration) {
  navbarHideFn?.(duration);
}

// AYNI sayfa içinde route param değişimi (bölüm/sezon değiştirme). URL —
// dolayısıyla pathname — değiştiği için App'teki PageTransition normalde
// TÜM sayfayı opacity 0'dan fade'ler; sayfa aslında yerinde durduğundan bu
// bir "yanıp sönme" olarak okunur ve component'in kendi crossfade'iyle
// çakışır. isCinematicArmed ile AYNI zaman-pencereli desen (bkz. yukarıdaki
// yorum) — StrictMode'un çift effect çağrısına dayanıklı.
let inPageNavAt = 0;

/** Sayfa içi bölüm/sezon geçişinde, navigate'ten hemen önce çağrılır. */
export function armInPageNav() {
  inPageNavAt = performance.now();
}

/** PageTransition: bu geçiş sayfa içi param değişimi mi? */
export function isInPageNavArmed() {
  return inPageNavAt > 0 && performance.now() - inPageNavAt < ARM_WINDOW_MS;
}
