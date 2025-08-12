import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

// Environment-based configuration
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Initialize Sentry for error tracking and performance monitoring
export const initializeMonitoring = () => {
  // Only initialize in production or when explicitly enabled
  if (!isProduction && !process.env.REACT_APP_ENABLE_SENTRY) {
    console.log('Monitoring disabled in development');
    return;
  }

  Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_DSN || "YOUR_SENTRY_DSN_HERE",
    environment: process.env.NODE_ENV || 'development',
    integrations: [
      new BrowserTracing({
        // Set up automatic route tracking in React Router v6
        routingInstrumentation: Sentry.reactRouterV6Instrumentation(
          React.useEffect,
          useLocation,
          useNavigationType,
          createRoutesFromChildren,
          matchRoutes
        ),
      }),
    ],
    
    // Performance Monitoring
    tracesSampleRate: isProduction ? 0.1 : 1.0, // Lower sample rate in production
    
    // Release information
    release: process.env.REACT_APP_VERSION || 'unknown',
    
    // Error filtering
    beforeSend(event, hint) {
      // Filter out development errors
      if (isDevelopment) {
        console.warn('Sentry Event (Dev Mode):', event);
      }
      
      // Filter out known non-critical errors
      const error = hint.originalException;
      if (error && error.message) {
        // Skip PayPal SDK errors that are not critical
        if (error.message.includes('paypal') && error.message.includes('script')) {
          return null;
        }
        
        // Skip chunk loading errors (common with code splitting)
        if (error.message.includes('Loading chunk') || error.message.includes('ChunkLoadError')) {
          // Log for monitoring but don't send to Sentry
          console.warn('Chunk loading error detected:', error.message);
          return null;
        }
      }
      
      return event;
    },
    
    // Additional options
    debug: isDevelopment,
    attachStacktrace: true,
    autoSessionTracking: true,
  });
  
  console.log('✅ Error tracking and performance monitoring initialized');
};

// Performance monitoring utilities
export const performanceMonitor = {
  // Measure component performance
  measureComponent: (componentName, fn) => {
    return Sentry.withProfiler(fn, { name: componentName });
  },
  
  // Track custom metrics
  trackMetric: (metricName, value, tags = {}) => {
    Sentry.addBreadcrumb({
      category: 'performance',
      message: `${metricName}: ${value}`,
      level: 'info',
      data: { value, ...tags }
    });
  },
  
  // Track user interactions
  trackUserAction: (action, details = {}) => {
    Sentry.addBreadcrumb({
      category: 'user',
      message: action,
      level: 'info',
      data: details
    });
  },
  
  // Track API performance
  trackApiCall: async (url, method, fn) => {
    const transaction = Sentry.startTransaction({
      name: `${method} ${url}`,
      op: 'http.client'
    });
    
    try {
      const result = await fn();
      transaction.setStatus('ok');
      return result;
    } catch (error) {
      transaction.setStatus('internal_error');
      Sentry.captureException(error);
      throw error;
    } finally {
      transaction.finish();
    }
  }
};

// Error boundary component
export const ErrorBoundary = Sentry.withErrorBoundary;

// Hook for tracking page views
export const usePageTracking = () => {
  React.useEffect(() => {
    // Track page view
    Sentry.addBreadcrumb({
      category: 'navigation',
      message: `Page viewed: ${window.location.pathname}`,
      level: 'info'
    });
  }, []);
};

// Production error reporter
export const reportError = (error, context = {}) => {
  if (isProduction) {
    Sentry.withScope((scope) => {
      scope.setContext('error_context', context);
      Sentry.captureException(error);
    });
  } else {
    console.error('Error:', error, 'Context:', context);
  }
};

// Set user context for error tracking
export const setUserContext = (user) => {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username || user.name
  });
};

export default {
  initializeMonitoring,
  performanceMonitor,
  ErrorBoundary,
  usePageTracking,
  reportError,
  setUserContext
};
