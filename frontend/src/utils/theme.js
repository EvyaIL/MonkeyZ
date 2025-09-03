/**
 * Theme utilities for light/dark mode support
 */

export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto'
};

/**
 * Get current theme from localStorage or default to auto
 */
export const getCurrentTheme = () => {
  try {
    return localStorage.getItem('theme') || THEMES.AUTO;
  } catch (error) {
    console.warn('Cannot access localStorage for theme preference');
    return THEMES.AUTO;
  }
};

/**
 * Set theme in localStorage and update document attributes
 */
export const setTheme = (theme) => {
  try {
    localStorage.setItem('theme', theme);
    updateDocumentTheme(theme);
    return true;
  } catch (error) {
    console.error('Failed to set theme:', error);
    return false;
  }
};

/**
 * Update document data-theme attribute
 */
export const updateDocumentTheme = (theme) => {
  let actualTheme = theme;
  
  if (theme === THEMES.AUTO) {
    // Check system preference
    actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches 
      ? THEMES.DARK 
      : THEMES.LIGHT;
  }
  
  document.documentElement.setAttribute('data-theme', actualTheme);
  document.body.className = document.body.className
    .replace(/\b(theme-light|theme-dark|theme-auto)\b/g, '')
    .trim();
  
  document.body.classList.add(`theme-${theme}`);
};

/**
 * Check if current theme is dark
 */
export const isDarkMode = () => {
  return document.documentElement.getAttribute('data-theme') === THEMES.DARK;
};

/**
 * Toggle between light and dark themes
 */
export const toggleTheme = () => {
  const currentTheme = getCurrentTheme();
  const newTheme = currentTheme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT;
  setTheme(newTheme);
  return newTheme;
};

/**
 * Initialize theme on app startup
 */
export const initializeTheme = () => {
  const currentTheme = getCurrentTheme();
  updateDocumentTheme(currentTheme);
  
  // Listen for system theme changes if auto theme is selected
  if (currentTheme === THEMES.AUTO) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (getCurrentTheme() === THEMES.AUTO) {
        updateDocumentTheme(THEMES.AUTO);
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    // Return cleanup function
    return () => mediaQuery.removeEventListener('change', handleChange);
  }
  
  return currentTheme;
};

/**
 * Get theme label for UI display
 */
export const getThemeLabel = (theme) => {
  switch (theme) {
    case THEMES.LIGHT:
      return 'Light';
    case THEMES.DARK:
      return 'Dark';
    case THEMES.AUTO:
      return 'Auto';
    default:
      return 'Auto';
  }
};

/**
 * Get next theme in cycle (Light → Dark → Auto → Light)
 */
export const getNextTheme = () => {
  const currentTheme = getCurrentTheme();
  switch (currentTheme) {
    case THEMES.LIGHT:
      return THEMES.DARK;
    case THEMES.DARK:
      return THEMES.AUTO;
    case THEMES.AUTO:
      return THEMES.LIGHT;
    default:
      return THEMES.LIGHT;
  }
};
