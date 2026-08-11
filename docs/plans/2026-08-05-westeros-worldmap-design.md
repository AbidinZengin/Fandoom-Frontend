# Westeros World Map — Pinned Camera Section

**Durum:** Onaylandı (2026-08-05), implementasyona geçiliyor.

## Amaç

GameOfThrones sayfasına, GoT intro'nun "kamera" hissini taşıyan yeni bir
bölüm: tek bir Westeros haritası üzerinde scroll'a bağlı sanal kamera
(scale + pan) 7 anahtar lokasyona sırayla gezinir, her durakta o bölge
hakkında bilgi kartı açılır.

## Yerleşim

`src/pages/series/GameOfThrones/WorldMap/WorldMap.jsx (+.module.css
+.data.js)`. Sayfa akışı: `Hero → Intro → WorldMap → ScrollStepper →
TabExhibit → Footer`.

## Mimari (masaüstü)

- Section GSAP `ScrollTrigger` ile **pin: true** (bu depoda YENİ desen —
  Intro'da v3'te bilerek kaldırılmıştı, kullanıcı onayı alındı
  2026-08-05).
- Pinned viewport (100vh) içinde harita `<img>`; tek scrub'lı GSAP
  timeline `scale`+`x`/`y` (translate) değerlerini 7 durak arasında
  label'lı segmentlerle değiştirir (`ease:'none'`, `scrollTrigger.scrub`).
- Toplam pin mesafesi ~7 × 120vh (≈840vh).
- Her durakta kart crossfade eder: kamera hareket ederken kart YOK,
  durakta kart girer (ScrollStepper/Intro'daki mevcut süzülme dili
  yeniden kullanılır — yeni giriş/çıkış hissi icat edilmez).
- Durak noktasında küçük pulse/marker (`<span>`), harita ile birlikte
  sahnede sabit.

## Mobil (≤900px)

Pin YOK — 7 durak ScrollStepper benzeri doğal-akış kartları, her
kartın yanında o bölgeye zoom'lanmış statik crop (`object-position`).

## Reduced-motion

Kamera ilk durakta (Castle Black, genel görünüm) sabit; 7 kart statik
liste halinde alt alta.

## Veri modeli — `WorldMap.data.js`

```js
export function fetchWorldMapStops() {
  return Promise.resolve([
    {
      id: 'castle-black',
      title: 'Castle Black',
      house: "Night's Watch",
      description: '...',
      linkUrl: '/game-of-thrones/characters?filter=nights-watch', // opsiyonel
      camera: { x: 0.54, y: 0.08, scale: 2.2 }, // fraksiyon (0-1) + zoom
    },
    // Winterfell, The Twins/Riverlands, The Eyrie, Dragonstone,
    // King's Landing, Highgarden
  ]);
}
```

`camera.x/y` fraksiyon olarak tutulur, component içinde img boyutuna
göre px'e çevrilir (resize'da yeniden hesaplanır — dragon-path
desenindeki debounce dersi). Gerçek koordinatlar TAHMİNİ başlar,
component çalışır hale gelince `visual-verify` ile göz kararıyla tune
edilir.

## Durak listesi (kuzeyden güneye, onaylı)

1. Castle Black / The Wall
2. Winterfell
3. The Twins / Riverlands
4. The Eyrie
5. Dragonstone
6. King's Landing
7. Highgarden

## Kart UI

Sabit konum (kamera hareket ederken kart pozisyonu sabit, sadece
içerik crossfade eder) — rozet (house) + title + description + opsiyonel
"Keşfet →" linki. `aria-live="polite"`, `linkUrl` varsa gerçek `<Link>`.

## Asset

`public/got/world-map.png` (Bigjpg AI-upscale, 2304×4096, ~3MB) —
kaynak: peakpx dikey Westeros haritası. El yazısı yer adları upscale
sırasında bozulmuş (bilinen, kullanıcı kararıyla kabul edildi — kartlar
kendi tipografisiyle gösteriliyor, haritanın orijinal etiketlerine
dayanılmıyor). Build öncesi WebP dönüşümü + boyut karşılaştırması
yapılacak.

## Pipeline

Tasarım onaylandı → `component-dev` (statik iskelet, motion yok) →
onay → `motion-expert` (pin + kamera timeline) → `visual-verify`.

## Bilinen açık işler (2026-08-05)

- **Layout çakışması:** WorldMap pin'lendiğinde ÜSTTEKİ component
  (Intro) ile görsel olarak birbirine giriyor — kullanıcı raporu, henüz
  kök neden bulunmadı. Şüpheli alanlar: pin-spacer'ın Intro'nun kendi
  snap/ScrollTrigger'larıyla etkileşimi, ya da `.worldmap` section'ının
  ScrollTrigger ilk ölçümü sırasında (img henüz yüklenmeden)
  yanlış yükseklik alması. Bir sonraki oturumda önce ekran görüntüsüyle
  hangi bölgede/nasıl çakıştığı teşhis edilmeli.
- **Kamera koordinatları:** `camera.x/y/scale` değerleri hâlâ tahmini —
  gerçek durak konumlarıyla eşleşmiyor, tune edilmemiş.
