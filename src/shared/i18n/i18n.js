import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import tr from './locales/tr.json';

// Dil URL'den gelir (bkz. LangGate) — tarayıcı algılaması kullanılmaz,
// URL tek doğruluk kaynağıdır.
i18next.use(initReactI18next).init({
  resources: { en: { translation: en }, tr: { translation: tr } },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18next;
