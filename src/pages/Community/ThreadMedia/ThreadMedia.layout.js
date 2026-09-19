// Medya mozaiğinin otomatik düzen algoritması (saf fonksiyon, DOM yok).
//
// Girdi: her medyanın en/boy oranı (w/h, sıra = yükleme sırası, korunur).
// Çıktı: iç içe satır/sütun ağacı + kutunun toplam oranı.
//
// Fikir (justified layout): bir SATIRDA (row) çocuklar aynı yüksekliği
// paylaşır → genişlikleri oranlarıyla orantılı, satırın oranı = oranların
// TOPLAMI. Bir SÜTUNDA (column) aynı genişliği paylaşırlar → yükseklikleri
// 1/oran ile orantılı, sütunun oranı = 1 / Σ(1/oran). Böylece her karo kendi
// oranını neredeyse hiç kırpılmadan doldurur. Adaylar (medya sayısına göre)
// üretilir, toplam oranı hedef kutu oranına (TARGET) en yakın olan seçilir:
// iki yatay görsel yan yana çok basık kutu verir → yığılır; iki dikey görsel
// yan yana çok uzun kutu vermez → yan yana kalır; vb.

// Hedef kutu oranı: hafif yatay, feed'de kartı ne şişirir ne basıklaştırır.
const TARGET_RATIO = 1.25;
// Aşırı panorama/afiş oranları hesabı bozmasın diye karo oranı kırpılır.
const TILE_MIN = 0.6;
const TILE_MAX = 2.2;
// Kutunun ekrana verilen oranı bu aralığa sıkıştırılır (kalan fark cover ile kırpılır).
const BOX_MIN = 0.75;
const BOX_MAX = 2;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const sum = (values) => values.reduce((total, value) => total + value, 0);

const tile = (index, ratio) => ({ kind: 'tile', index, ratio: clamp(ratio, TILE_MIN, TILE_MAX) });

function group(kind, children) {
  const ratio = kind === 'row' ? sum(children.map((c) => c.ratio)) : 1 / sum(children.map((c) => 1 / c.ratio));
  return { kind, children, ratio };
}

// Hedefe uzaklık log ölçeğinde: 2:1 ile 1:2 aynı ölçüde "uzak" sayılır.
const distance = (candidate) => Math.abs(Math.log(candidate.ratio / TARGET_RATIO));

function candidatesFor(tiles) {
  if (tiles.length === 2) {
    return [group('row', tiles), group('column', tiles)];
  }
  // 3 medya: ilk medya "kahraman" (yükleme sırası korunur).
  const [hero, ...rest] = tiles;
  return [
    group('row', tiles),
    group('column', tiles),
    group('row', [hero, group('column', rest)]),
    group('column', [hero, group('row', rest)]),
  ];
}

// ratios: en fazla 3 elemanlı en/boy oranı dizisi.
export function computeLayout(ratios) {
  const tiles = ratios.map((ratio, index) => tile(index, ratio));

  if (tiles.length === 1) {
    return { root: tiles[0], boxRatio: clamp(tiles[0].ratio, 0.8, BOX_MAX) };
  }

  const root = candidatesFor(tiles).reduce((best, candidate) => (distance(candidate) < distance(best) ? candidate : best));
  return { root, boxRatio: clamp(root.ratio, BOX_MIN, BOX_MAX) };
}
