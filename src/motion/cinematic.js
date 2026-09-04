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

// ---------------------------------------------------------------------------
// Dive Deeper (RelatedContent) → /blog/:slug "kesintisiz devir" geçişi.
//
// Mekanik: büyüyen görsel React'in DIŞINDA, document.body'ye eklenmiş bir
// klondur — bu yüzden route değişiminde UNMOUNT OLMAZ, ekranda durmaya devam
// eder. Genişleme tamamlanınca navigate edilir; BlogPost mount olup kendi
// kutusunu TAM AYNI geometride çizer ve klonu kaldırır. İki kare arasında
// görsel fark olmadığı için sayfa değişimi hiç algılanmaz.
// ---------------------------------------------------------------------------

/**
 * Genişlemiş kutunun ölçüsü — referans component'in birebir formülü
 * (300+1250 / 400+400, %95vw / %85vh tavanlı). İKİ TARAF da bunu kullanır:
 * kaynak (RelatedContent) buraya büyütür, hedef (BlogPost) buradan devralır.
 * Tek kaynak olmazsa iki sayfa arasında birkaç piksellik sıçrama olur.
 */
export function blogExpandedBox() {
  const isMobile = window.innerWidth <= 900;
  return {
    width: Math.min(window.innerWidth * 0.95, 300 + (isMobile ? 650 : 1250)),
    height: Math.min(window.innerHeight * 0.85, 400 + (isMobile ? 200 : 400)),
  };
}

let blogFlip = null;
let blogFlipArmedAt = 0;

/**
 * Genişleme tamamlanıp navigate edilmeden hemen önce çağrılır.
 * @param {{imageUrl: string, originRect: {top,left,width,height}, returnPath: string}} payload
 *   originRect GERİ DÖNÜŞ için: kullanıcı Blog'da en üstte yukarı scroll
 *   edince kutu tam bu dikdörtgene geri küçülür. Rect pin aralığı boyunca
 *   GEÇERLİDİR — pin görüntüyü dondurduğu için kart, aralığın başında da
 *   sonunda da ekranda aynı yerdedir.
 */
export function armBlogFlip(payload) {
  blogFlip = payload;
  blogFlipArmedAt = performance.now();
}

/** PageTransition: bu geçiş bir devir mi (genel sayfa fade'i ATLANMALI)? */
export function isBlogFlipArmed() {
  return blogFlipArmedAt > 0 && performance.now() - blogFlipArmedAt < ARM_WINDOW_MS;
}

/** BlogPost mount'unda: kutuyu devralıyor muyuz, hangi verilerle? */
export function readBlogFlip() {
  return isBlogFlipArmed() ? blogFlip : null;
}

// Geri dönüş (Blog → bölüm sayfası). BlogPost klonu küçültmeye başlar ve
// AYNI ANDA navigate eder. Kaynak sayfa açılınca RelatedContent kendi
// ScrollTrigger'ını kurup scroll'u pin aralığının BAŞINA taşır — kart orada
// klonun ineceği rect'te durur ve progress 0 olduğu için rakip bir klon
// kurulmaz (aralığın SONUNA dönmek progress≈1 verip ikinci klon yaratıyordu).
let blogReturnArmedAt = 0;
let blogReturnPayload = null;

/**
 * Geri dönüş başlarken, navigate'ten hemen önce çağrılır.
 * @param {{scrollLeft: number, scrollY: number, originRect: {top,left,width,height}}} payload
 *   scrollLeft/scrollY: kaynak sayfanın bırakıldığı hâli — remount olduğu
 *   için ikisi de elle geri konur, yoksa "sıfırdan yüklenmiş" gibi görünür.
 *   originRect: küçülmenin ineceği kart dikdörtgeni. Küçülme Blog sayfasında
 *   DEĞİL, kaynak sayfa yerine oturduktan SONRA orada oynatılır — ancak
 *   böylece açılışın tam aynası olur (perde kaynak sayfayı açarak sönerken
 *   kutu kartına iner).
 */
export function armBlogReturn(payload) {
  blogReturnPayload = payload ?? null;
  blogReturnArmedAt = performance.now();
}

/** Kaynak sayfa: geri dönüş verisi (yoksa null). */
export function readBlogReturn() {
  return isBlogReturnArmed() ? blogReturnPayload : null;
}

/**
 * Kaynak sayfa: bu açılış bir geri dönüş mü? Diğer bayraklarla AYNI desen —
 * tüketilmez, yalnız zaman penceresiyle sönümlenir (StrictMode effect'i iki
 * kez çağırıyor; tüketilse hayatta kalan ikinci örnek yanlış negatif görür).
 */
export function isBlogReturnArmed() {
  return blogReturnArmedAt > 0 && performance.now() - blogReturnArmedAt < ARM_WINDOW_MS;
}

// DÜZELTME (manuel): FeaturedCarousel → Breaking Bad Hero "kesintisiz devir"
// flip'i (armHeroFlip/isHeroFlipArmed/readHeroFlip/breakingBadHeroBox)
// kaldırıldı — hedef geometri eski OldHero'nun `.hero__figure` (21:9 kart)
// düzenine göre hesaplanıyordu, yeni PageBuilder Hero'su tam farklı bir
// tam-genişlik düzen kullanıyor VE klonu temizleyen kod (takeOver/drop)
// yalnızca OldHero'daydı — o artık render edilmediği için devir sonrası
// ekranda kalıcı siyah perde + büyümüş poster klonu kalıyordu (kullanıcı
// raporu). Breaking Bad artık GoT ile aynı, kanıtlanmış imza-şerit
// (armCinematic) geçişini kullanıyor — bkz. FeaturedCarousel.jsx
// CINEMATIC_SLUGS, Hero.jsx isCinematicArmed() dalı. NOT: OldHero.jsx
// (bilerek silinmemiş, kullanılmayan eski dosya) hâlâ readHeroFlip import
// ediyor — o dosya hiçbir yerden import edilmediği için bu artık ölü
// referans, ama dosyayı canlandırmak istenirse burası da geri gelmeli.
