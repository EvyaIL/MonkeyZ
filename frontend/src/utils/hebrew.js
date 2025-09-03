/**
 * Enhanced Hebrew language support utilities
 */

export const HEBREW_TRANSLATIONS = {
  // Navigation
  'home': 'בית',
  'all_products': 'כל המוצרים',
  'about_us': 'אודותינו',
  'contact': 'צור קשר',
  'faq': 'שאלות נפוצות',
  'blog': 'בלוג',
  'cart': 'עגלת קניות',
  'login': 'התחברות',
  'register': 'הרשמה',
  'logout': 'התנתקות',
  
  // Product page
  'add_to_cart': 'הוסף לעגלה',
  'quantity': 'כמות',
  'price': 'מחיר',
  'category': 'קטגוריה',
  'description': 'תיאור',
  'related_products': 'מוצרים קשורים',
  'product_details': 'פרטי המוצר',
  'in_stock': 'במלאי',
  'out_of_stock': 'לא במלאי',
  
  // Checkout
  'checkout': 'תשלום',
  'order_summary': 'סיכום הזמנה',
  'subtotal': 'סכום ביניים',
  'discount': 'הנחה',
  'total': 'סה"כ',
  'customer_details': 'פרטי לקוח',
  'name': 'שם',
  'email': 'אימייל',
  'phone': 'טלפון',
  'coupon_code': 'קוד קופון',
  'apply_coupon': 'החל קופון',
  'place_order': 'בצע הזמנה',
  'processing_order': 'מעבד הזמנה...',
  
  // Search and filters
  'search': 'חיפוש',
  'search_products': 'חפש מוצרים...',
  'filters': 'מסננים',
  'sort_by': 'מיין לפי',
  'price_range': 'טווח מחירים',
  'categories': 'קטגוריות',
  'clear_filters': 'נקה מסננים',
  'no_products_found': 'לא נמצאו מוצרים',
  'showing_results': 'מציג תוצאות',
  
  // Common actions
  'save': 'שמור',
  'cancel': 'ביטול',
  'confirm': 'אישור',
  'edit': 'עריכה',
  'delete': 'מחיקה',
  'view': 'צפייה',
  'back': 'חזור',
  'next': 'הבא',
  'previous': 'הקודם',
  'close': 'סגור',
  'open': 'פתח',
  
  // Time and dates
  'today': 'היום',
  'yesterday': 'אתמול',
  'tomorrow': 'מחר',
  'this_week': 'השבוע',
  'last_week': 'השבוע שעבר',
  'this_month': 'החודש',
  'last_month': 'החודש שעבר',
  
  // Status messages
  'loading': 'טוען...',
  'error': 'שגיאה',
  'success': 'הצלחה',
  'warning': 'אזהרה',
  'info': 'מידע',
  'completed': 'הושלם',
  'pending': 'ממתין',
  'failed': 'נכשל',
  
  // FAQ
  'frequently_asked_questions': 'שאלות נפוצות',
  'find_answers': 'מצא תשובות לשאלות נפוצות על המוצרים והשירותים שלנו',
  'search_faq': 'חפש בשאלות נפוצות...',
  
  // Blog
  'latest_posts': 'פוסטים אחרונים',
  'read_more': 'קרא עוד',
  'posted_on': 'פורסם ב',
  'by_author': 'מאת',
  'in_category': 'בקטגוריה',
  'share_post': 'שתף פוסט',
  
  // Homepage
  'welcome_message': 'ברוכים הבאים ל-MonkeyZ',
  'hero_subtitle': 'המקום הטוב ביותר למוצרים דיגיטליים איכותיים',
  'best_sellers': 'רבי המכר',
  'featured_products': 'מוצרים מומלצים',
  'new_arrivals': 'הגעות חדשות',
  'special_offers': 'הצעות מיוחדות',
  
  // User account
  'my_account': 'החשבון שלי',
  'profile': 'פרופיל',
  'order_history': 'היסטוריית הזמנות',
  'favorites': 'מועדפים',
  'settings': 'הגדרות',
  'change_password': 'שנה סיסמה',
  'update_profile': 'עדכן פרופיל',
  
  // Validation messages
  'required_field': 'שדה חובה',
  'invalid_email': 'כתובת אימייל לא תקינה',
  'password_too_short': 'הסיסמה קצרה מדי',
  'passwords_not_match': 'הסיסמאות לא תואמות',
  'invalid_phone': 'מספר טלפון לא תקין',
  
  // Payment
  'payment_method': 'אמצעי תשלום',
  'credit_card': 'כרטיס אשראי',
  'paypal': 'PayPal',
  'bank_transfer': 'העברה בנקאית',
  'payment_successful': 'התשלום בוצע בהצלחה',
  'payment_failed': 'התשלום נכשל',
  'order_confirmed': 'ההזמנה אושרה',
  
  // Theme and language
  'light_mode': 'מצב בהיר',
  'dark_mode': 'מצב כהה',
  'auto_mode': 'מצב אוטומטי',
  'hebrew': 'עברית',
  'english': 'English',
  'switch_language': 'החלף שפה',
  'switch_theme': 'החלף ערכת נושא',
  
  // Contact
  'contact_us': 'צור קשר',
  'send_message': 'שלח הודעה',
  'your_message': 'ההודעה שלך',
  'subject': 'נושא',
  'message_sent': 'ההודעה נשלחה בהצלחה',
  'message_failed': 'שליחת ההודעה נכשלה',
  
  // About
  'about_monkeyz': 'אודות MonkeyZ',
  'our_story': 'הסיפור שלנו',
  'our_mission': 'המשימה שלנו',
  'our_values': 'הערכים שלנו',
  'meet_the_team': 'הכירו את הצוות',
  
  // Social media
  'follow_us': 'עקבו אחרינו',
  'share_on_facebook': 'שתף בפייסבוק',
  'share_on_twitter': 'שתף בטוויטר',
  'share_on_instagram': 'שתף באינסטגרם',
  'share_on_linkedin': 'שתף בלינקדאין',
  
  // Currency and formatting
  'currency_ils': '₪',
  'currency_usd': '$',
  'currency_eur': '€',
  'free': 'חינם',
  'sale': 'מבצע',
  'new': 'חדש',
  'popular': 'פופולרי',
  
  // Accessibility
  'skip_to_content': 'דלג לתוכן',
  'main_navigation': 'ניווט ראשי',
  'breadcrumb_navigation': 'ניווט פירורי לחם',
  'search_results': 'תוצאות חיפוש',
  'page_loading': 'הדף נטען',
  'image_alt_product': 'תמונת מוצר',
  'image_alt_logo': 'לוגו MonkeyZ',
};

/**
 * Get Hebrew translation for a given key
 */
export const getHebrewTranslation = (key, fallback = key) => {
  return HEBREW_TRANSLATIONS[key] || fallback;
};

/**
 * Check if text contains Hebrew characters
 */
export const containsHebrew = (text) => {
  if (!text) return false;
  const hebrewRegex = /[\u0590-\u05FF]/;
  return hebrewRegex.test(text);
};

/**
 * Format Hebrew text with proper RTL markers
 */
export const formatHebrewText = (text) => {
  if (!text || !containsHebrew(text)) return text;
  
  // Add RTL override for mixed content
  return `\u202B${text}\u202C`;
};

/**
 * Get text direction based on content
 */
export const getTextDirection = (text) => {
  if (!text) return 'ltr';
  return containsHebrew(text) ? 'rtl' : 'ltr';
};

/**
 * Format Hebrew numbers and dates
 */
export const formatHebrewNumber = (number) => {
  if (typeof number !== 'number') return number;
  
  // Use Hebrew locale for number formatting
  return new Intl.NumberFormat('he-IL').format(number);
};

/**
 * Format Hebrew currency
 */
export const formatHebrewCurrency = (amount, currency = 'ILS') => {
  if (typeof amount !== 'number') return amount;
  
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

/**
 * Format Hebrew date
 */
export const formatHebrewDate = (date, options = {}) => {
  if (!date) return '';
  
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options
  };
  
  return new Intl.DateTimeFormat('he-IL', defaultOptions).format(new Date(date));
};

/**
 * Hebrew month names
 */
export const HEBREW_MONTHS = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
];

/**
 * Hebrew day names
 */
export const HEBREW_DAYS = [
  'ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'
];

/**
 * Convert English digit to Hebrew
 */
export const englishToHebrewDigits = (text) => {
  if (!text) return text;
  
  const englishDigits = '0123456789';
  const hebrewDigits = '٠١٢٣٤٥٦٧٨٩';
  
  return text.replace(/[0-9]/g, (digit) => {
    const index = englishDigits.indexOf(digit);
    return index !== -1 ? hebrewDigits[index] : digit;
  });
};

/**
 * Hebrew keyboard layout support
 */
export const HEBREW_KEYBOARD_MAP = {
  'q': '/', 'w': "'", 'e': 'ק', 'r': 'ר', 't': 'א', 'y': 'ט', 'u': 'ו', 'i': 'ן', 'o': 'ם', 'p': 'פ',
  'a': 'ש', 's': 'ד', 'd': 'ג', 'f': 'כ', 'g': 'ע', 'h': 'י', 'j': 'ח', 'k': 'ל', 'l': 'ך', ';': 'ף',
  'z': 'ז', 'x': 'ס', 'c': 'ב', 'v': 'ה', 'b': 'נ', 'n': 'מ', 'm': 'צ', ',': 'ת', '.': 'ץ'
};

/**
 * Hebrew text utilities for forms and validation
 */
export const validateHebrewInput = (text, options = {}) => {
  const { 
    minLength = 0, 
    maxLength = Infinity, 
    allowNumbers = true, 
    allowEnglish = false,
    allowPunctuation = true 
  } = options;
  
  if (!text) return { valid: false, error: 'שדה חובה' };
  
  if (text.length < minLength) {
    return { valid: false, error: `טקסט קצר מדי (מינימום ${minLength} תווים)` };
  }
  
  if (text.length > maxLength) {
    return { valid: false, error: `טקסט ארוך מדי (מקסימום ${maxLength} תווים)` };
  }
  
  // Check for allowed characters
  const hebrewPattern = /[\u0590-\u05FF]/;
  const englishPattern = /[a-zA-Z]/;
  const numberPattern = /[0-9]/;
  const punctuationPattern = /[.,!?;:'"()\-\s]/;
  
  const hasHebrew = hebrewPattern.test(text);
  const hasEnglish = englishPattern.test(text);
  const hasNumbers = numberPattern.test(text);
  const hasPunctuation = punctuationPattern.test(text);
  
  if (!allowEnglish && hasEnglish) {
    return { valid: false, error: 'אותיות לטיניות אינן מורשות' };
  }
  
  if (!allowNumbers && hasNumbers) {
    return { valid: false, error: 'מספרים אינם מורשים' };
  }
  
  if (!allowPunctuation && hasPunctuation) {
    return { valid: false, error: 'סימני פיסוק אינם מורשים' };
  }
  
  return { valid: true };
};

export default {
  HEBREW_TRANSLATIONS,
  getHebrewTranslation,
  containsHebrew,
  formatHebrewText,
  getTextDirection,
  formatHebrewNumber,
  formatHebrewCurrency,
  formatHebrewDate,
  HEBREW_MONTHS,
  HEBREW_DAYS,
  englishToHebrewDigits,
  HEBREW_KEYBOARD_MAP,
  validateHebrewInput
};
