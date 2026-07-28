---
name: motion-expert
description: >-
  Onaylanmış statik iskelete GSAP/Lenis animasyon ve etkileşim fiziği
  ekler (giriş animasyonları, scroll-trigger, stagger, hover micro-
  feedback). Kullanıcı "animasyon ekle", "canlandır", "scroll efekti"
  dediğinde veya component-dev onayından sonra kullan. Yeni motion
  altyapısı KURMAZ — mevcut tek-Lenis + GSAP düzenini kullanır.
---

# Motion Expert — Animasyon ve Etkileşim Fiziği

## Ön koşul

Statik iskelet "yön doğru mu?" onayından geçmiş olmalı. Onaysız iskelete
motion eklenmez.

## Altyapı (değiştirme, kullan)

- `src/motion/setup.js`: tek app-wide Lenis, GSAP ticker'a bağlı,
  ScrollTrigger kayıtlı. `initMotion()` App'te zaten çağrılıyor;
  instance gerekirse `getLenis()`.
- Yeni GSAP plugin kaydı, ikinci Lenis, yeni animasyon kütüphanesi =
  desen kuran iş → uygulamadan önce KULLANICI ONAYI.

## Component içi desen

```jsx
useEffect(() => {
  const ctx = gsap.context(() => {
    // tween/timeline/ScrollTrigger burada
  }, rootRef);
  return () => ctx.revert(); // cleanup ZORUNLU — StrictMode çift çağırır
}, []);
```

- Seçiciler `gsap.context` scope'u içinden (`rootRef`) — global DOM
  seçicisi YASAK.
- ScrollTrigger `trigger` elemanı component'in kendi ağacından olmalı.

## Kalite standartları (The Polish)

- **Complete Cycles:** Her element sahneye girmeli (enter), "hold"
  anında kalmalı ve gerekiyorsa sahneden tamamen çıkmalı (exit) —
  hiçbir şey yarıda kesilmemeli.
- **Organic Motion:** Robotik, lineer hareket YASAK — anticipation
  (küçük geri çekilme), overshoot (hedefi biraz geçip dönme) ve settle
  (yerleşme) için GSAP ease'leri kullan (`back.out`, `power2.inOut`,
  `elastic` — ölçülü).
- **Staggering:** Elementler aynı anda değil, kademeli (cascade) girer —
  `stagger` parametresi; toplu robotik giriş FAIL sebebidir.
- **Subtle Life:** Sahne sabit dururken hafif yaşam belirtisi
  değerlendir: floating, soft pulse, yavaş shine sweep — abartmadan.
- **Minimalist Geometry:** Işık parlamaları, ince çizgiler, glow/bloom
  tercih et; emoji ve ucuz clip-art parçacıkları YASAK.
- **Payoff Moment:** Vurgu anlarında (öne çıkan kart, sonuç) küçük bir
  kutlama anı: scale pop + glow.
- **Okunabilirlik:** Yoğun görsel üzerine metin yazılacaksa scrim /
  drop-shadow / backing shape ZORUNLU; ana metinler kenarlardan içeride
  (title-safe); tek baskın odak, destekleyiciler küçük.

## Katı kurallar

- CSS transition'larda süre token'ları: `--duration-micro/fast/base/slow`.
  GSAP süreleri JS'te kalır; tutarlılık için aynı ritmi izle
  (micro 0.2 / fast 0.3 / base 0.6 / slow 0.9).
- `prefers-reduced-motion` desteği ZORUNLU: `gsap.matchMedia()` ile
  reduced'da animasyonu atla veya anlık geçişe indir; CSS'te
  `@media (prefers-reduced-motion: reduce)` bloğu.
- Animasyon SADECE `transform` ve `opacity` üzerinde (layout tetikleyen
  width/height/top animasyonu yasak — performans).
- Uzun süreli `will-change` bırakma; gerekiyorsa animasyon bitiminde
  temizle.

## Çıktı

`npm run lint` temiz. `npm run capture` ile screenshot al (script
scroll'u gezerek trigger'ları tetikler); scroll-driven ara durumlar
için `visual-verify`'daki uyarıyı izle. Konsolda ScrollTrigger uyarısı
olmadığını dev sunucu çıktısından doğrula.

## Handoff

→ `visual-verify` Mod 2 (screenshot ↔ referans döngüsü, maks 2-3 tur).
Frame-by-frame scroll scrub (image sequence) gerekiyorsa →
`scroll-sequence` skill'i.
