---
name: scroll-sequence
description: >-
  Scroll'a bağlı frame-by-frame canvas animasyonu (image sequence scrub)
  kurar — video karelerini ScrollTrigger scrub'ına bağlı bir <canvas>'a
  çizer. Kullanıcı "scroll video", "scrub sahne", "kaydırdıkça oynayan
  animasyon", "Apple tarzı sekans" dediğinde kullan. motion-expert'in
  özel durumudur; ağır asset hazırlığı gerektirir ve ilk kurulumu
  kullanıcı onayına tabidir.
---

# Scroll Sequence — Frame-by-Frame Canvas Scrub

## Ön koşul

- Statik iskelet "yön doğru mu?" onayından geçmiş olmalı.
- Frame seti hazır olmalı: `public/<konu>/frames/0001.webp ...`
  (tek boyut standardı, WebP tercih). Frame yoksa kullanıcıdan kaynak
  video/kare seti iste — placeholder ile scrub sahnesi KURULMAZ
  (learned-rules: scroll bölümü statik görselle geçiştirilmez).
- Desen kuran iş sayılır → sayfadaki İLK scrub sahnesi kurulmadan önce
  kullanıcı onayı (CLAUDE.md kapsam kuralı).

## Mimari (GSAP ScrollTrigger + tek Lenis)

1. **Pin:** Section GSAP ile pinlenir — `ScrollTrigger.create({ pin:
   true, scrub: true, ... })`. CSS `sticky` yerine GSAP pin kullan;
   mevcut Lenis kurulumuyla (`src/motion/setup.js`) uyumlu desen budur.
2. **Progress → frame:** `self.progress` (0-1) × (frameCount − 1) →
   `Math.round` ile `frameIndex`. Scrub, pin bitmeden ~0.85-0.9
   progress'te son kareye ulaşacak şekilde eşlenir; kalan pin son karede
   "hold" yapar.
3. **Çizim rAF'ta:** `onUpdate` yalnızca `frameIndex`'i bir ref'e yazar;
   `ctx.drawImage` çağrısı `gsap.ticker`/rAF döngüsünde ve YALNIZCA
   index bir öncekinden farklıysa yapılır — scroll event'i içinde
   doğrudan çizim YASAK (gereksiz GPU/CPU).
4. **Ölçekleme:** `resize`'da canvas boyutu ve cover-fit `drawImage`
   hesabı güncellenir — en-boy oranı bozulmadan ekranı kaplar.

## Preload & bellek

- Mount'ta tüm kareler `new Image()` ile arka planda önbelleğe alınır;
  ilk kare çizilene kadar poster (ilk frame'in `<img>`'i) gösterilir —
  siyah ekran/stutter kabul edilmez.
- Unmount cleanup ZORUNLU: `ctx.revert()` (ScrollTrigger/pin dahil) +
  resize listener kaldırılır + image array referansı bırakılır.
- Kare bütçesi: toplam boyut belirgin şekilde büyükse (≈15 MB+) veya
  kare sayısı 150'yi aşıyorsa kullanıcıya bildir — mobil bellek ve ilk
  yükleme maliyeti kullanıcı kararıdır.

## Kalite kuralları (kaynak: learned-rules)

- Görsel ekranı dolduracak büyüklükte olmalı (küçük ortalanmış kutu
  değil) ve scrub boyunca hafif bir scale eşliği almalı.
- Ardışık scrub sahneleri tam ekran başlık fazıyla BÖLÜNMEZ — metin
  animasyonun yanında akar.
- İç içe geçen animasyonlar ayrı pinned bölümler olarak alt alta konmaz
  — TEK pinned sahnede katmanlar crossfade ile devir teslim yapar.
- `prefers-reduced-motion`: scrub devre dışı — ilk/son kare statik
  gösterilir, pin kaldırılır veya kısaltılır.

## Çıktı & handoff

`npm run lint` temiz. → `visual-verify` Mod 2 — scroll-driven uyarısını
izle: ara durumlar tek fullPage screenshot'ta görünmez, kritik anlar
için birden fazla capture al.
