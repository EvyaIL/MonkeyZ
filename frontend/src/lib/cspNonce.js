// PayPal CSP Nonce Generator
// This utility generates a secure nonce for Content Security Policy

export const generateNonce = () => {
  const array = new Uint8Array(16);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array);
  } else {
    // Fallback for older browsers
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return btoa(String.fromCharCode.apply(null, array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

// Store the nonce for the session
let currentNonce = null;

export const getCurrentNonce = () => {
  if (!currentNonce) {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isProduction = process.env.NODE_ENV === 'production';
    
    // In production, CSP nonce is typically handled by server headers
    // We still generate a nonce for PayPal SDK compatibility
    if (isProduction) {
      // Generate a nonce for PayPal compatibility even in production
      currentNonce = generateNonce();
      return currentNonce;
    }
    
    if (isDevelopment) {
      // Check if the current CSP allows unsafe-inline
      const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
      if (cspMeta) {
        const content = cspMeta.getAttribute('content');
        if (content.includes("'unsafe-inline'")) {
          // No nonce needed in development with unsafe-inline
          return null;
        }
      }
    }
    
    // Try to get nonce from existing CSP meta tag first
    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (cspMeta) {
      const content = cspMeta.getAttribute('content');
      const nonceMatch = content.match(/nonce-([A-Za-z0-9+/=_-]+)/);
      if (nonceMatch && nonceMatch[1] !== 'PLACEHOLDER') {
        currentNonce = nonceMatch[1];
        return currentNonce;
      }
    }
    
    // Generate new nonce as fallback
    currentNonce = generateNonce();
  }
  return currentNonce;
};

// Set nonce in meta tag for CSP (production use)
export const setCSPNonce = (nonce = null) => {
  const nonceToUse = nonce || getCurrentNonce();
  
  // Skip if no nonce needed (development with unsafe-inline)
  if (!nonceToUse) return null;
  
  // Update CSP meta tag if it exists
  const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  if (cspMeta) {
    const content = cspMeta.getAttribute('content');
    const updatedContent = content
      .replace(/nonce-PLACEHOLDER/g, `nonce-${nonceToUse}`)
      .replace(/nonce-[A-Za-z0-9+/=_-]+/g, `nonce-${nonceToUse}`);
    cspMeta.setAttribute('content', updatedContent);
  }
  
  return nonceToUse;
};

// Check if PayPal and Google OAuth domains are allowed in CSP
export const verifyPayPalCSP = () => {
  // In production, CSP is often set via HTTP headers, not meta tags
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  
  if (!cspMeta) {
    if (isProduction) {
      // In production, this is normal - CSP is set via server headers
      console.log('No CSP meta tag found. This is normal in production where CSP is set via HTTP headers.');
      return true; // Assume CSP is handled by server in production
    } else if (isDevelopment && isLocalhost) {
      // In development on localhost, CSP is typically not enforced
      console.log('Development mode on localhost - CSP not enforced, PayPal integration should work.');
      return true; // Allow PayPal to work in development
    } else {
      console.warn('CSP meta tag not found. PayPal and Google OAuth integration may be blocked.');
      return false;
    }
  }

  const content = cspMeta.getAttribute('content');
  const requiredPayPalDomains = ['paypal.com', 'paypalobjects.com', 'venmo.com'];
  const requiredGoogleDomains = ['accounts.google.com'];
  
  const missingPayPalDomains = requiredPayPalDomains.filter(domain => 
    !content.includes(`*.${domain}`)
  );
  
  const missingGoogleDomains = requiredGoogleDomains.filter(domain => 
    !content.includes(domain)
  );
  
  if (missingPayPalDomains.length > 0) {
    console.warn('Missing PayPal domains in CSP:', missingPayPalDomains);
    return false;
  }
  
  if (missingGoogleDomains.length > 0) {
    console.warn('Missing Google OAuth domains in CSP:', missingGoogleDomains);
    return false;
  }
  
  // Check for style violations in development
  if (isDevelopment && !content.includes("'unsafe-inline'")) {
    console.warn('Development mode requires unsafe-inline for CSS-in-JS libraries');
  }
  
  // Reduced logging - only log errors, not success
  return true;
};

// Development helper to fix common CSP issues
export const fixDevelopmentCSP = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  if (!isDevelopment) return;
  
  const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  if (!cspMeta) return;
  
  const content = cspMeta.getAttribute('content');
  
  // Add necessary domains for development
  let updatedContent = content;
  
  // Add Google domains for authentication if not present
  if (!content.includes('accounts.google.com')) {
    updatedContent = updatedContent.replace(
      /script-src ([^;]+)/,
      'script-src $1 https://accounts.google.com https://apis.google.com'
    );
    updatedContent = updatedContent.replace(
      /connect-src ([^;]+)/,
      'connect-src $1 https://accounts.google.com'
    );
    updatedContent = updatedContent.replace(
      /frame-src ([^;]+)/,
      'frame-src $1 https://accounts.google.com'
    );
    updatedContent = updatedContent.replace(
      /style-src ([^;]+)/,
      'style-src $1 https://accounts.google.com'
    );
  }
  
  // Ensure unsafe-inline is present for development
  if (!content.includes("'unsafe-inline'")) {
    updatedContent = updatedContent.replace(
      /style-src ([^;]+)/,
      "style-src $1 'unsafe-inline'"
    );
  }
  
  if (updatedContent !== content) {
    cspMeta.setAttribute('content', updatedContent);
    console.log('Development CSP updated to fix common issues');
  }
};
