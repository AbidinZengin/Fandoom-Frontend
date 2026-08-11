// Explore hub'ının veri erişim katmanı. Tema WorldMap.jsx tarafından zaten
// basılıyor (Explore onun altında render olan bir çocuk) — burada ayrıca
// theme effect'i kurulmaz.
export { theme } from '../../GameOfThrones.data';

import { fetchBlogHub } from '../../../../../shared/api/blogs';

// Featured (sidebar) ve Dive Deeper (alt şerit) AYNI havuzu paylaşır,
// kullanıcı kararıyla farklı dilim halinde: component ilk 3'ü Featured'a,
// kalanını Dive Deeper'a ayırır. CHARACTER formatıyla sınırlanmaz (Characters
// sayfasındaki getCharacterAnalysisBlogs'un aksine) — bu hub'ın kapsamı tüm
// Westeros/ASOIAF içeriği.
export function fetchExploreBlogs() {
  return fetchBlogHub({ franchise: 'a-song-of-ice-and-fire', size: 20 }).then((res) => res.content);
}

// Bölümün üst bandı artık KÜÇÜK bir künye değil, TAM GENİŞLİK bir banner
// (kullanıcı düzeltmesi, ikinci tur): koskoca yatay atmosfer görseli
// arkada, logo + kicker + başlık + açıklama hepsi görselin ÖNÜNDE/ÜSTÜNDE
// tek bir overlay bloğu olarak durur — Hero.jsx'teki "full-bleed görsel +
// alt köşeye yaslı metin" dilinin küçük bir varyantı.
export const EXPLORE_INTRO = {
  banner: '/got/throne.webp',
  logo: '/got/logo.webp',
  description:
    "Yedi Krallık'ın sekiz bin yıllık tarihinden büyük hanelerin kadim mottolarına, dizinin sezon sezon kronolojisinden Demir Taht'ın etrafında dönen efsanevi eşyalara kadar — Westeros'u tek bir sayfada, kendi hızınızda keşfedin. İlk İnsanlar'dan Aegon'un Fethi'ne, Kral Katili'nden son Kışa, Stark'ın kurdundan Targaryen'in ejderine kadar bu kıtanın anlattığı her hikâye burada bir araya geliyor — ister sırayla okuyun, ister aklınıza takılan haneden başlayın.",
};

// History/Timeline — backend'de henüz karşılığı olan bir "lore" varlığı yok
// (WorldMap durakları gibi bilinçli sabit mock, bkz. WorldMap.data.js üstü
// yorum). Timeline'ın (Highlights'ın "Seasons" kartıyla aynı asset) görseli
// var, History salt metin — wireframe'deki ayrım (metin bloğu vs. görsel
// bloğu) korunuyor. Paragraflar kullanıcı isteğiyle (ikinci tur) uzatıldı —
// kısa-copy kuralı burada UI chrome değil, editöryel teaser sayıldı.
// `to`: History sayfası gerçek backend'e bağlanınca (2026-08-11) CTA'lar
// artık gerçek <Link> — Timeline AYRI sayfa değil, History'nin final
// sahnesine (#history-finale) yönlenir (bkz. GoT History planı, "Timeline
// kartının konusu History'nin son bölümüne eritildi").
export const EXPLORE_TEASERS = [
  {
    id: 'history',
    label: 'History',
    title: 'Sekiz Bin Yıllık Bir Kıta',
    description:
      "İlk İnsanlar Dar Deniz'i geçip Westeros'a ayak bastığında kıta çoktan Çocuklar'ın topraklarıydı; aradan geçen bin yıllar Endor Savaşları'nı, Valyria'nın yükselişini ve külleşmesini, Targaryen fethini ve nihayet Yedi Krallık'ın kuruluşunu getirdi. Her hane kendi efsanesini bu zincire ekledi — Stark'ların Kuzey'i, Lannister'ların altını, Targaryen'lerin ejderlerini. Robert'ın İsyanı, tacı bir kez daha el değiştirtip hikâyenin bugün izlediğimiz perdesini açtı.",
    to: '/series/game-of-thrones/history',
  },
  {
    id: 'timeline',
    label: 'Timeline',
    title: 'Sezon Sezon Kronoloji',
    description:
      "Kral Katili'nin Deli Kral'ı sırtından hançerlediği o taht odasından, Kışın son kez Yedi Krallık'ı sardığı ana kadar — sekiz sezon, yetmiş üç bölüm, tek bir kesintisiz zaman çizelgesi. Her dönüm noktası (Kral Katili, Kırmızı Düğün, Duvar'ın düşüşü, Taht'ın erimesi) burada kronolojik sırasıyla işaretli; hangi hanenin hangi anda nerede olduğunu tek bakışta görün.",
    image: '/got/exhibit-seasons.jpg',
    to: '/series/game-of-thrones/history#history-finale',
  },
];

// Artifacts — backend'de karşılığı olmayan yeni bir keşif bloğu (Houses gibi
// bilinçli sabit mock). `image` alanı GEÇİCİ: elimizde ikonik eşya görseli
// yok, WorldMap'in lokasyon fotoğrafları placeholder olarak ödünç alındı —
// gerçek görsel kaynağı ayrı bir web-researcher turu gerektirir (teslim
// özetinde bildirildi).
export const ARTIFACTS = [
  {
    id: 'ice',
    title: 'Buz (Ice)',
    description: "Stark ailesinin Valyrian çeliğinden kadim büyük kılıcı.",
    image: '/got/locations/winterfell.jpg',
  },
  {
    id: 'iron-throne',
    title: 'Demir Taht',
    description: 'Bin kılıçtan dövülmüş, Yedi Krallık gücünün simgesi.',
    image: '/got/locations/kings-landing.jpg',
  },
  {
    id: 'dragonglass-dagger',
    title: 'Ejder Camı Hançeri',
    description: 'Beyaz Yürüyüşçüler’e karşı kullanılan, gökcisminden dövülmüş kama.',
    image: '/got/locations/castle-black.jpg',
  },
  {
    id: 'longclaw',
    title: 'Longclaw',
    description: "Mormont ailesinden Jon Snow'a geçen Valyrian çeliği pala.",
    image: '/got/locations/dragonstone.jpg',
  },
];
