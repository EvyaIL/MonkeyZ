/**
 * Language utilities for Hebrew/English support
 */

export const LANGUAGES = {
  EN: 'en',
  HE: 'he'
};

export const DIRECTIONS = {
  LTR: 'ltr',
  RTL: 'rtl'
};

/**
 * Get current language from localStorage or default to English
 */
export const getCurrentLanguage = () => {
  try {
    return localStorage.getItem('language') || LANGUAGES.EN;
  } catch (error) {
    console.warn('Cannot access localStorage for language preference');
    return LANGUAGES.EN;
  }
};

/**
 * Set language in localStorage and update document attributes
 */
export const setLanguage = (language) => {
  try {
    localStorage.setItem('language', language);
    updateDocumentLanguage(language);
    return true;
  } catch (error) {
    console.error('Failed to set language:', error);
    return false;
  }
};

/**
 * Update document lang and dir attributes
 */
export const updateDocumentLanguage = (language) => {
  const direction = language === LANGUAGES.HE ? DIRECTIONS.RTL : DIRECTIONS.LTR;
  
  document.documentElement.lang = language;
  document.documentElement.dir = direction;
  document.body.className = document.body.className
    .replace(/\b(lang-en|lang-he|dir-ltr|dir-rtl)\b/g, '')
    .trim();
  
  document.body.classList.add(`lang-${language}`, `dir-${direction}`);
};

/**
 * Check if current language is RTL
 */
export const isRTL = () => {
  return getCurrentLanguage() === LANGUAGES.HE;
};

/**
 * Get opposite language for language switcher
 */
export const getOppositeLanguage = () => {
  return getCurrentLanguage() === LANGUAGES.EN ? LANGUAGES.HE : LANGUAGES.EN;
};

/**
 * Format text based on language direction
 */
export const formatTextDirection = (text, language = getCurrentLanguage()) => {
  if (!text) return '';
  
  if (language === LANGUAGES.HE) {
    // Ensure Hebrew text has proper RTL markers
    return `\u202B${text}\u202C`;
  }
  
  return text;
};

/**
 * Initialize language on app startup
 */
export const initializeLanguage = () => {
  const currentLanguage = getCurrentLanguage();
  updateDocumentLanguage(currentLanguage);
  
  // Add font loading for Hebrew if needed
  if (currentLanguage === LANGUAGES.HE) {
    loadHebrewFonts();
  }
  
  return currentLanguage;
};

/**
 * Load Hebrew fonts if not already loaded
 */
const loadHebrewFonts = () => {
  if (document.querySelector('link[href*="hebrew-fonts"]')) {
    return; // Already loaded
  }
  
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Heebo:wght@100;200;300;400;500;600;700;800;900&family=Assistant:wght@200;300;400;500;600;700;800&display=swap';
  link.id = 'hebrew-fonts';
  document.head.appendChild(link);
};

/**
 * Language-aware number formatting
 */
export const formatNumber = (number, language = getCurrentLanguage()) => {
  const locale = language === LANGUAGES.HE ? 'he-IL' : 'en-US';
  return new Intl.NumberFormat(locale).format(number);
};

/**
 * Language-aware currency formatting
 */
export const formatCurrency = (amount, currency = 'ILS', language = getCurrentLanguage()) => {
  const locale = language === LANGUAGES.HE ? 'he-IL' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency
  }).format(amount);
};

/**
 * Language-aware date formatting
 */
export const formatDate = (date, language = getCurrentLanguage()) => {
  const locale = language === LANGUAGES.HE ? 'he-IL' : 'en-US';
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(date));
};
