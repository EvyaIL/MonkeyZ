import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import he from './locales/he.json';
import en from './locales/en.json';
import heAccount from './locales/he-account.json';

// Merge Hebrew translations with account translations
const mergedHe = { ...he, ...heAccount };

i18n
  .use(initReactI18next)
  .init({
    resources: {
      he: { translation: mergedHe },
      en: { translation: en },
    },
    lng: localStorage.getItem('language') || 'he', // Use saved language or default to Hebrew
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

export default i18n;
