/**
 * Performance Monitoring and Error Tracking
 * Ultra-fast monitoring without external dependencies
 */

// Environment-based configuration
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Performance metrics storage
let performanceMetrics = {
  pageLoadTime: 0,
  apiResponseTimes: [],
  errorCount: 0,
  lastError: null
};

// Error handling functions
const handleError = (event) => {
  performanceMetrics.errorCount++;
  performanceMetrics.lastError = {
    message: event.error?.message || event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    timestamp: Date.now()
  };
  
  if (isDevelopment) {
    console.error('[MonkeyZ] JavaScript Error:', event.error || event.message);
  }
};

const handleUnhandledRejection = (event) => {
  performanceMetrics.errorCount++;
  performanceMetrics.lastError = {
    message: event.reason?.message || 'Unhandled Promise Rejection',
    type: 'unhandledrejection',
    timestamp: Date.now()
  };
  
  if (isDevelopment) {
    console.error('[MonkeyZ] Unhandled Promise Rejection:', event.reason);
  }
};

// Initialize monitoring system
export const initializeMonitoring = () => {
  if (isDevelopment) {
    console.log('[MonkeyZ] Performance monitoring initialized');
  }
  
  // Set up performance observers
  if ('PerformanceObserver' in window) {
    // Monitor navigation timing
    const navObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          performanceMetrics.pageLoadTime = entry.loadEventEnd - entry.loadEventStart;
        }
      }
    });
    
    navObserver.observe({ entryTypes: ['navigation'] });
  }
  
  // Set up global error handling
  window.addEventListener('error', handleError);
  window.addEventListener('unhandledrejection', handleUnhandledRejection);
};

// Performance monitoring utilities
export const performanceMonitor = {
  // Start timing an operation
  startTimer: (name) => {
    const startTime = performance.now();
    return {
      end: () => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        if (isDevelopment) {
          console.log(`[MonkeyZ] ${name} took ${duration.toFixed(2)}ms`);
        }
        
        return duration;
      }
    };
  },
  
  // Track API response times
  trackApiCall: (url, duration, success = true) => {
    performanceMetrics.apiResponseTimes.push({
      url,
      duration,
      success,
      timestamp: Date.now()
    });
    
    // Keep only last 100 API calls
    if (performanceMetrics.apiResponseTimes.length > 100) {
      performanceMetrics.apiResponseTimes.shift();
    }
  },
  
  // Get current performance metrics
  getMetrics: () => ({...performanceMetrics}),
  
  // Mark performance milestone
  mark: (name) => {
    if ('performance' in window && performance.mark) {
      performance.mark(name);
    }
  },
  
  // Measure between two marks
  measure: (name, startMark, endMark) => {
    if ('performance' in window && performance.measure) {
      try {
        performance.measure(name, startMark, endMark);
        const measure = performance.getEntriesByName(name)[0];
        return measure.duration;
      } catch (error) {
        if (isDevelopment) {
          console.warn(`[MonkeyZ] Could not measure ${name}:`, error);
        }
        return 0;
      }
    }
    return 0;
  }
};

// Report error utility
export const reportError = (error, context = {}) => {
  performanceMetrics.errorCount++;
  performanceMetrics.lastError = {
    message: error?.message || error,
    context,
    timestamp: Date.now()
  };
  
  if (isDevelopment) {
    console.error('[MonkeyZ] Reported Error:', error, context);
  }
  
  // In production, could send to logging service
  if (isProduction && window.fetch) {
    // Placeholder for error reporting endpoint
    // fetch('/api/errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ error: error?.message || error, context })
    // }).catch(() => {}); // Silently fail if error reporting fails
  }
};

// Health check utilities
export const healthCheck = {
  // Check if monitoring is working
  isHealthy: () => {
    return {
      monitoring: true,
      performance: 'PerformanceObserver' in window,
      errorTracking: true,
      timestamp: Date.now()
    };
  },
  
  // Get system information
  getSystemInfo: () => {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      memory: performance.memory ? {
        used: Math.round(performance.memory.usedJSHeapSize / 1048576),
        total: Math.round(performance.memory.totalJSHeapSize / 1048576),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576)
      } : null
    };
  }
};

// Initialize automatically
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMonitoring);
  } else {
    initializeMonitoring();
  }
}

// Default export
export default {
  initializeMonitoring,
  performanceMonitor,
  reportError,
  healthCheck
};

