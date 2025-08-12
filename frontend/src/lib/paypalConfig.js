// PayPal Environment Configuration and Debugging Utilities

export const PAYPAL_CONFIG = {
  // Environment detection
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  
  // PayPal Client ID validation
  clientId: process.env.REACT_APP_PAYPAL_CLIENT_ID,
  
  // Currency and locale settings
  currency: 'ILS',
  locale: 'he_IL',
  
  // Security settings
  csp: {
    enabled: true,
    useNonce: true,
    allowedDomains: [
      '*.paypal.com',
      '*.paypalobjects.com', 
      '*.venmo.com'
    ]
  },
  
  // Performance settings
  performance: {
    enableLazyLoading: true,
    preloadScripts: false,
    cacheTimeout: 300000 // 5 minutes
  }
};

// Debug helper for PayPal configuration
export const debugPayPalConfig = () => {
  const issues = [];
  
  // Check client ID
  if (!PAYPAL_CONFIG.clientId) {
    issues.push('❌ REACT_APP_PAYPAL_CLIENT_ID environment variable is missing');
  } else if (PAYPAL_CONFIG.clientId.startsWith('sb-')) {
    console.log('✅ Using PayPal Sandbox environment');
  } else {
    console.log('⚠️ Using PayPal Production environment');
  }
  
  // Check CSP headers
  const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  if (!cspMeta) {
    issues.push('❌ Content-Security-Policy meta tag is missing');
  } else {
    const content = cspMeta.getAttribute('content');
    PAYPAL_CONFIG.csp.allowedDomains.forEach(domain => {
      if (!content.includes(domain)) {
        issues.push(`❌ CSP missing domain: ${domain}`);
      }
    });
  }
  
  // Check COOP header
  const coopMeta = document.querySelector('meta[http-equiv="Cross-Origin-Opener-Policy"]');
  if (!coopMeta || coopMeta.getAttribute('content') !== 'same-origin-allow-popups') {
    issues.push('❌ Cross-Origin-Opener-Policy header not set correctly');
  }
  
  // Report results
  if (issues.length === 0) {
    console.log('✅ PayPal configuration looks good!');
    return true;
  } else {
    console.group('🔧 PayPal Configuration Issues:');
    issues.forEach(issue => console.log(issue));
    console.groupEnd();
    return false;
  }
};

// Common PayPal error messages and solutions
export const PAYPAL_ERROR_SOLUTIONS = {
  'MISSING_EXPECTED_PARAMETER': {
    message: 'Required parameter is missing',
    solution: 'Check that all required fields (email, name, phone) are filled'
  },
  'INVALID_REQUEST': {
    message: 'The request is malformed',
    solution: 'Verify cart items have valid product IDs and prices'
  },
  'AUTHENTICATION_FAILURE': {
    message: 'PayPal authentication failed',
    solution: 'Check your PayPal client ID and secret credentials'
  },
  'INSTRUMENT_DECLINED': {
    message: 'Payment method was declined',
    solution: 'Try a different payment method or contact your bank'
  },
  'INSUFFICIENT_FUNDS': {
    message: 'Insufficient funds in account',
    solution: 'Try a different payment method or add funds to your account'
  },
  'CSP_VIOLATION': {
    message: 'Content Security Policy blocked PayPal scripts',
    solution: 'Update CSP headers to allow PayPal domains'
  }
};

// Get user-friendly error message
export const getPayPalErrorMessage = (error) => {
  const errorCode = error?.details?.[0]?.issue || error?.name || 'UNKNOWN_ERROR';
  const solution = PAYPAL_ERROR_SOLUTIONS[errorCode];
  
  return {
    code: errorCode,
    message: solution?.message || 'An unexpected error occurred',
    solution: solution?.solution || 'Please try again or contact support',
    original: error
  };
};
