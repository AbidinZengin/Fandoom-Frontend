// SeriesHero'nun yapım slug'ına göre değişen görsel ayarları. Series ve Movies
// hub'ı aynı Hero'yu kullanır, bu yüzden tek harita ikisini de kapsar. Backend
// yapım şemasına alan eklenmedi (ortak veri sözleşmesi dokunulmaz), ayarlar
// frontend'de burada tutulur.
import bbLogo from '../../../assets/logos/breaking-bad.svg';
import hotdLogo from '../../../assets/logos/house-of-the-dragon.webp';
import gotLogo from '../../../assets/logos/got.webp';

export const KNOWN_LOGOS = {
  'breaking-bad': bbLogo,
  'house-of-the-dragon': hotdLogo,
  'game-of-thrones': gotLogo,
};

// Her yapımın logosu KENDİ Hero'sunda farklı yerde/boyutta durur (bkz. eski
// PageBuilder referansları), birebir korundu.
export const LOGO_LAYOUT = {
  'house-of-the-dragon': { top: 'calc(72px + 2%)', left: '50%', width: '58%', transform: 'translateX(-50%)' },
  'game-of-thrones': { top: 'calc(72px + 2%)', left: '50%', width: '50%', transform: 'translateX(-50%)' },
  'breaking-bad': { top: '10%', left: '6.3%', width: '30%', transform: 'none' },
};

// Cover görselinin kırpılırken odaklanacağı nokta (object-position). Tam ekran
// sahnede, özellikle dikey telefon ekranında, varsayılan "center" konu ortada
// değilse yanlış yeri gösterir. Yapıma özel: { desktop, mobile }, ikisi de
// opsiyonel; mobile yoksa desktop değeri, o da yoksa "center" kullanılır.
// Örnek: 'black-swan': { desktop: 'center 30%', mobile: '30% 20%' }
export const COVER_POSITION = {
  'black-swan': { mobile: '74% center' },
  interstellar: { mobile: '92% center' },
};
