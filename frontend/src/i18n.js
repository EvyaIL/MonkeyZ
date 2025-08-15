import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import he from './locales/he.json';
import en from './locales/en.json';
import heAccount from './locales/he-account.json';

// Merge Hebrew translations with account translations
const mergedHe = { ...he, ...heAccount };

const savedLanguage = localStorage.getItem('i18nextLng');

i18n
  .use(initReactI18next)
  .init({
    resources: {
      he: { translation: mergedHe },
      en: { translation: en },
    },
    lng: savedLanguage || 'en', // Use saved language or default to English
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

// Save language choice when it changes
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('i18nextLng', lng);
});

export default i18n;
