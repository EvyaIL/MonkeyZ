/**
 * Utility functions for digital key management
 */

interface GenerateKeyOptions {
  allowedCharacters?: string;
  length?: number;
}

interface CharacterSets {
  [key: string]: string;
}

const defaultChars: CharacterSets = {
  'X': 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  '0': '0123456789',
  'A': 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  'a': 'abcdefghijklmnopqrstuvwxyz',
  '?': 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz'
};

/**
 * Validates a key against a specified format pattern
 * @param {string} key - The key to validate
 * @param {string} format - The format pattern (e.g., "XXXXX-XXXXX-XXXXX")
 * @param {Object} options - Additional validation options
 * @returns {boolean} True if key is valid, false otherwise
 */
export const validateKeyFormat = (key: string, format: string, options: any = {}): boolean => {
  if (!key || !format) return false;

  // Convert format to regex pattern
  let pattern = format
    .replace(/X/g, '[A-Z0-9]')
    .replace(/0/g, '[0-9]')
    .replace(/A/g, '[A-Z]')
    .replace(/a/g, '[a-z]')
    .replace(/\?/g, '[A-Za-z0-9]');

  // Handle specific character sets if provided
  if (options.allowedCharacters) {
    pattern = pattern.replace(/\[.*?\]/g, `[${options.allowedCharacters}]`);
  }

  const regex = new RegExp(`^${pattern}$`);
  return regex.test(key);
};

/**
 * Generates a key based on the specified format
 * @param {string} format - The format pattern (e.g., "XXXXX-XXXXX-XXXXX")
 * @param {Object} options - Generation options
 * @returns {string} Generated key
 */
export function generateKey(format: string = 'XXXXX-XXXXX-XXXXX', options: GenerateKeyOptions = {}): string {
  const chars: CharacterSets = { ...defaultChars };
  
  if (options.allowedCharacters) {
    Object.keys(chars).forEach(key => {
      chars[key] = options.allowedCharacters || '';
    });
  }

  return format.split('').map(char => {
    if (char in chars) {
      const charSet = chars[char];
      return charSet[Math.floor(Math.random() * charSet.length)];
    }
    return char;
  }).join('');
}

/**
 * Generates multiple unique keys
 * @param {string} format - The format pattern
 * @param {number} count - Number of keys to generate
 * @param {Object} options - Generation options
 * @returns {string[]} Array of generated keys
 */
export const generateBulkKeys = (format: string, count: number, options: any = {}): string[] => {
  const keys = new Set<string>();
  const maxAttempts = count * 2; // Prevent infinite loop
  let attempts = 0;

  while (keys.size < count && attempts < maxAttempts) {
    const key = generateKey(format, options);
    keys.add(key);
    attempts++;
  }

  return Array.from(keys);
};

/**
 * Parses a text block into individual keys
 * @param {string} text - Block of text containing keys
 * @returns {string[]} Array of cleaned keys
 */
export const parseKeysFromText = (text: string): string[] => {
  return text
    .split(/[\\n,;]+/) // Split on newlines, commas, or semicolons
    .map(key => key.trim())
    .filter(key => key.length > 0);
};

/**
 * Formats a key according to the specified pattern
 * @param {string} key - Raw key string
 * @param {string} format - Format pattern
 * @returns {string} Formatted key
 */
export function formatKey(key: string, format: string = 'XXXXX-XXXXX-XXXXX'): string {
  // Remove any non-alphanumeric characters
  const cleanKey = key.replace(/[^a-zA-Z0-9]/g, '');
  let formattedKey = '';
  let keyIndex = 0;

  for (let i = 0; i < format.length; i++) {
    if (format[i] in defaultChars) {
      formattedKey += cleanKey[keyIndex++] || defaultChars[format[i]][0];
    } else {
      formattedKey += format[i];
    }
  }

  return formattedKey;
}
