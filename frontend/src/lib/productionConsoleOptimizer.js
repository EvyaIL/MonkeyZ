// Production Console Optimizer
// Removes all console.log statements in production while keeping error reporting

const isProduction = process.env.NODE_ENV === 'production';

// Store original console methods
const originalMethods = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  info: console.info,
  debug: console.debug
};

// Initialize production console optimization
export const initProductionConsoleOptimizer = () => {
  if (!isProduction) {
    return; // Keep all console methods in development
  }

  // In production, disable console.log and console.debug to reduce bundle size
  console.log = () => {};
  console.debug = () => {};
  console.info = () => {};

  // Keep console.warn and console.error for critical issues
  console.warn = (...args) => {
    // Filter out known non-critical warnings
    const message = args.join(' ');
    
    // Skip PayPal warnings that don't affect functionality
    if (message.includes('paypal') && message.includes('zoid')) {
      return;
    }
    
    // Skip Material-UI warnings in production
    if (message.includes('Material-UI') || message.includes('MUI')) {
      return;
    }
    
    // Skip React warnings that are handled
    if (message.includes('Each child in a list should have a unique "key"')) {
      return;
    }
    
    // Allow other warnings through
    originalMethods.warn.apply(console, args);
  };

  console.error = (...args) => {
    // Filter out non-critical errors
    const message = args.join(' ');
    
    // Skip chunk loading errors (handled by our error boundary)
    if (message.includes('Loading chunk') || message.includes('ChunkLoadError')) {
      return;
    }
    
    // Skip PayPal SDK errors that don't affect core functionality
    if (message.includes('paypal') && message.includes('script')) {
      return;
    }
    
    // Allow critical errors through
    originalMethods.error.apply(console, args);
  };
};

// Bundle size optimization: Remove development utilities in production
export const optimizeForProduction = () => {
  if (!isProduction) {
    return;
  }

  // Remove React DevTools in production
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = undefined;
  }

  // Remove Redux DevTools in production
  if (window.__REDUX_DEVTOOLS_EXTENSION__) {
    window.__REDUX_DEVTOOLS_EXTENSION__ = undefined;
  }

  // Disable React error overlay in production
  if (window.__REACT_ERROR_OVERLAY_GLOBAL_HOOK__) {
    window.__REACT_ERROR_OVERLAY_GLOBAL_HOOK__ = undefined;
  }
};

// Performance optimization for console-heavy libraries
export const optimizeLibraryConsole = () => {
  if (!isProduction) {
    return;
  }

  // Suppress PayPal SDK console output
  const originalPayPalLog = window.paypal?.Buttons?.prototype?.log;
  if (originalPayPalLog) {
    window.paypal.Buttons.prototype.log = () => {};
  }

  // Suppress Google Analytics debug output
  const originalGtagConfig = window.gtag?.config;
  if (originalGtagConfig) {
    window.gtag.config = (...args) => {
      // Remove debug mode from gtag config
      if (args[1] && args[1].debug_mode) {
        delete args[1].debug_mode;
      }
      return originalGtagConfig.apply(window.gtag, args);
    };
  }
};

// Critical error reporter that works even with console disabled
export const reportCriticalError = (error, context = {}) => {
  // Always log critical errors even in production
  originalMethods.error('CRITICAL ERROR:', error, context);
  
  // Send to monitoring service
  if (window.Sentry) {
    window.Sentry.captureException(error, { extra: context });
  }
  
  // Send to custom error tracking
  if (window.gtag) {
    window.gtag('event', 'exception', {
      description: error.message || error,
      fatal: false,
      ...context
    });
  }
};

// Initialize all optimizations
export const initAllProductionOptimizations = () => {
  initProductionConsoleOptimizer();
  optimizeForProduction();
  optimizeLibraryConsole();
  
  if (isProduction) {
    console.log = originalMethods.log; // Temporarily restore for this message
    console.log('🚀 Production optimizations applied - console output minimized');
    console.log = () => {}; // Re-disable
  }
};

export default {
  initProductionConsoleOptimizer,
  optimizeForProduction,
  optimizeLibraryConsole,
  reportCriticalError,
  initAllProductionOptimizations
};
