// PayPal Environment Configuration and Performance Optimization

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
    // Disable debug mode to reduce console spam (enable only when troubleshooting)
    debug: false, // Set to true only when debugging PayPal issues
    // Disable unwanted funding sources but keep credit cards enabled
    // Available funding: paypal, venmo, credit, card, sepa, bancontact, giropay, ideal, eps, sofort, mybank, p24, zimpler, maxima, oxxo, boleto, boletobancario, multibanco, satispay, payu, blik, trustly, paylater
    'disable-funding': 'venmo,sepa,bancontact,giropay,ideal,eps,sofort,mybank,p24', // Keep PayPal, credit cards, and local Israeli payment methods
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
    commit: PAYPAL_CONFIG.scriptConfig.commit,
    'buyer-country': PAYPAL_CONFIG.scriptConfig['buyer-country']
  });
  
  // Add debug parameter in development
  if (PAYPAL_CONFIG.isDevelopment && PAYPAL_CONFIG.scriptConfig.debug) {
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
      console.log('PayPal script preloaded successfully');
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
        console.warn('Performance measurement failed:', error);
        return null;
      }
    }
  };
};

// Debug helper for PayPal configuration (minimal logging)
export const debugPayPalConfig = () => {
  const issues = [];
  
  // Only log critical issues and basic status
  if (!PAYPAL_CONFIG.clientId) {
    issues.push('❌ REACT_APP_PAYPAL_CLIENT_ID environment variable is missing');
    console.error('PayPal configuration error: Missing client ID');
    return false;
  }
  
  // Single summary log instead of multiple logs
  const environment = PAYPAL_CONFIG.clientId.startsWith('sb-') ? 'Sandbox' : 'Production';
  const paymentMethods = 'PayPal + Credit/Debit Cards';
  
  console.log(`� PayPal ${environment} | Methods: ${paymentMethods} | Performance: Optimized`);
  
  // Check for major CSP issues only
  const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  if (!cspMeta) {
    issues.push('❌ Content-Security-Policy meta tag is missing');
  }
  
  // Report only if there are issues
  if (issues.length > 0) {
    console.group('🔧 PayPal Configuration Issues:');
    issues.forEach(issue => console.log(issue));
    console.groupEnd();
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
