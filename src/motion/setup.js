// Lenis KALICI olarak devre dışı (kullanıcı kararı, 2. kez denendi ve
// reddedildi): scroll hissi tamamen native kalır, kontrol kullanıcıda.
// İzin verilen tek "otomatik" hareket, bir bölüme yaklaşırken CSS
// scroll-snap (proximity) çekilmesidir — o da JS değil, tarayıcı işi.
// ScrollTrigger native scroll ile çalışır.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Flip } from 'gsap/Flip';

gsap.registerPlugin(ScrollTrigger, Flip);

let lenis = null;
let initialized = false;

/**
 * Motion altyapısını başlatır. Idempotent: birden çok çağrı güvenlidir
 * (React StrictMode). Lenis kullanılmadığı için iş yapmaz; imza,
 * çağıran kod (App.jsx) değişmesin diye korunur.
 */
export function initMotion() {
  if (initialized) return lenis;
  initialized = true;
  return lenis;
}

export function getLenis() {
  return lenis;
}
