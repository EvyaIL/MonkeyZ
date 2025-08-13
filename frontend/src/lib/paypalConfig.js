// PayPal Environment Configuration and Performance Optimization

export const PAYPAL_CONFIG = {
  // PayPal Client ID validation
  clientId: process.env.REACT_APP_PAYPAL_CLIENT_ID,
  
  // Environment detection
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  
  // Currency and locale settings
  currency: 'ILS',
  locale: 'en_US', // Changed to English to show "PayPal" instead of Hebrew text
  
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
  
  // Performance settings (PayPal Best Practice)
  performance: {
    // Use instant render for immediate page loads
    instantRender: true,
    // Pre-load script for better performance
    enablePreload: true,
    // Use async loading
    asyncLoading: true,
    // Cache timeout
    cacheTimeout: 300000, // 5 minutes
    // Loading strategy
    loadingStrategy: 'immediate', // 'immediate' | 'delayed' | 'on-demand'
    // Render strategy
    renderStrategy: 'instant' // 'instant' | 'delayed' | 'hidden'
  },
  
  // PayPal Script Configuration (Performance Optimized)
  scriptConfig: {
    // Only load required components
    components: 'buttons',
    // Disable debug mode in production
    debug: false,
    // Disable unwanted funding sources and separate credit card button
    // This removes the separate "Pay with Credit Card" button but still allows credit cards through PayPal
    'disable-funding': 'credit,card,venmo,sepa,bancontact,giropay,ideal,eps,sofort,mybank,p24',
    // Intent for immediate capture
    intent: 'capture',
    // Commit for Pay Now button
    commit: true,
    // Buyer country for optimization
    'buyer-country': 'IL'
  }
};

// Performance-optimized script URL builder
export const buildPayPalScriptURL = () => {
  const baseURL = 'https://www.paypal.com/sdk/js';
  const params = new URLSearchParams({
    'client-id': PAYPAL_CONFIG.clientId,
    currency: PAYPAL_CONFIG.currency,
    locale: PAYPAL_CONFIG.locale,
    components: PAYPAL_CONFIG.scriptConfig.components,
    intent: PAYPAL_CONFIG.scriptConfig.intent,
    commit: PAYPAL_CONFIG.scriptConfig.commit
  });
  
  // Only add buyer-country in development/sandbox mode  
  // This parameter is NOT allowed in PayPal live/production environment
  const isUsingLiveClient = PAYPAL_CONFIG.clientId && !PAYPAL_CONFIG.clientId.startsWith('sb-') && !PAYPAL_CONFIG.clientId.startsWith('AYbpBUAq');
  if (PAYPAL_CONFIG.isDevelopment && !isUsingLiveClient) {
    params.append('buyer-country', PAYPAL_CONFIG.scriptConfig['buyer-country']);
  }
  
  // Add debug parameter in development only with sandbox
  if (PAYPAL_CONFIG.isDevelopment && !isUsingLiveClient && PAYPAL_CONFIG.scriptConfig.debug) {
    params.append('debug', 'true');
  }
  
  // Add disable-funding if specified
  if (PAYPAL_CONFIG.scriptConfig['disable-funding']) {
    params.append('disable-funding', PAYPAL_CONFIG.scriptConfig['disable-funding']);
  }
  
  return `${baseURL}?${params.toString()}`;
};

// Pre-load PayPal script for performance (PayPal Best Practice)
export const preloadPayPalScript = () => {
  return new Promise((resolve, reject) => {
    // Check if script is already loaded
    const existingScript = document.querySelector('script[src*="paypal.com/sdk/js"]');
    if (existingScript) {
      resolve(true);
      return;
    }
    
    // Create preload link for better performance
    const preloadLink = document.createElement('link');
    preloadLink.rel = 'preload';
    preloadLink.as = 'script';
    preloadLink.href = buildPayPalScriptURL();
    preloadLink.crossOrigin = 'anonymous';
    document.head.appendChild(preloadLink);
    
    // Load the actual script asynchronously
    const script = document.createElement('script');
    script.src = buildPayPalScriptURL();
    script.async = true;
    script.crossOrigin = 'anonymous';
    
    script.onload = () => {
      resolve(true);
    };
    
    script.onerror = (error) => {
      console.error('PayPal script preload failed:', error);
      reject(error);
    };
    
    document.head.appendChild(script);
  });
};

// Performance monitoring
export const measurePayPalPerformance = () => {
  if (!window.performance || !window.performance.mark) return;
  
  const marks = {
    scriptStart: 'paypal-script-start',
    scriptEnd: 'paypal-script-end',
    renderStart: 'paypal-render-start',
    renderEnd: 'paypal-render-end'
  };
  
  return {
    markScriptStart: () => performance.mark(marks.scriptStart),
    markScriptEnd: () => performance.mark(marks.scriptEnd),
    markRenderStart: () => performance.mark(marks.renderStart),
    markRenderEnd: () => performance.mark(marks.renderEnd),
    
    getMetrics: () => {
      try {
        const scriptTime = performance.measure('paypal-script-load', marks.scriptStart, marks.scriptEnd);
        const renderTime = performance.measure('paypal-render-time', marks.renderStart, marks.renderEnd);
        
        return {
          scriptLoadTime: scriptTime.duration,
          renderTime: renderTime.duration,
          total: scriptTime.duration + renderTime.duration
        };
      } catch (error) {
        return null;
      }
    }
  };
};

// Debug helper for PayPal configuration (production-ready, minimal logging)
export const debugPayPalConfig = () => {
  // Only check for critical configuration issues
  if (!PAYPAL_CONFIG.clientId) {
    console.error('PayPal configuration error: Missing client ID');
    return false;
  }
  
  return true;
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
  'INVALID_RESOURCE_ID': {
    message: 'PayPal configuration error',
    solution: 'This is usually a PayPal environment mismatch. Try refreshing the page or contact support if the issue persists.'
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
  },
  'SCRIPT_LOAD_TIMEOUT': {
    message: 'PayPal script failed to load in time',
    solution: 'Check internet connection and try reloading the page'
  },
  'CURRENCY_NOT_SUPPORTED': {
    message: 'The selected currency is not supported',
    solution: 'The currency may not be supported for your PayPal account region. Contact support for assistance.'
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
