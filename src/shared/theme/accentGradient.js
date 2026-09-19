import { PRODUCTION_BUTTON_GRADIENT } from './productionAccent';

// Dizi sayfası açıldığında o dizinin buton gradient renklerini (--accent-c1..c3)
// root'a yazar; dönen fonksiyon sayfadan çıkınca temizler (diğer sayfalara
// renk sızmasın, theme.css'teki accent-türevi değerlere dönülsün). Dizinin
// girdisi yoksa hiçbir şey yazmaz.
export function applyAccentGradient(slug) {
  const root = document.documentElement;
  PRODUCTION_BUTTON_GRADIENT[slug]?.forEach((color, index) => {
    root.style.setProperty(`--accent-c${index + 1}`, color);
  });

  return () => {
    [1, 2, 3].forEach((index) => root.style.removeProperty(`--accent-c${index}`));
  };
}
