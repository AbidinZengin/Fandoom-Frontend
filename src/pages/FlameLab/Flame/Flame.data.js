// ALEV RENK DURAKLARI — tonları buradan ayarla.
// Sıra soğuktan sıcağa: alevin dış uçlarından çekirdeğine doğru.
// Bunlar marka token'ı DEĞİL fiziksel değerlerdir (blackbody sıcaklık
// rampası: sıcaklık arttıkça kırmızıdan beyaza), o yüzden bilerek
// theme.css skalasının dışında.
export const FIRE_STOPS = {
  ember: '#3d370b', // en dış uçlar — koyu, dumanlı hardal/zeytin (yanık sarı)
  mid: '#8a8117',   // gövde — kirli kimyasal sarı
  hot: '#e3d822',   // sıcak bölge — zehirli parlak sarı (hazmat sarısı)
  core: '#fcfadd',  // çekirdek — sarımsı sıcak beyaz
};