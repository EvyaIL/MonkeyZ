import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

// Performance thresholds
const THRESHOLDS = {
  FCP: 1800, // First Contentful Paint
  LCP: 2500, // Largest Contentful Paint
  FID: 100,  // First Input Delay
  CLS: 0.1,  // Cumulative Layout Shift
  TTFB: 800, // Time to First Byte
};

// Analytics endpoint (you can replace with your analytics service)
const sendToAnalytics = (metric) => {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    const threshold = THRESHOLDS[metric.name];
    const status = threshold && metric.value > threshold ? '🔴 POOR' : '🟢 GOOD';
    
    console.log(`%c${metric.name}: ${metric.value.toFixed(2)}ms ${status}`, 
      `color: ${threshold && metric.value > threshold ? 'red' : 'green'}; font-weight: bold`);
  }

  // Send to analytics service in production
  if (process.env.NODE_ENV === 'production') {
    // Example: Google Analytics 4
    if (window.gtag) {
      window.gtag('event', metric.name, {
        custom_parameter_1: metric.value,
        custom_parameter_2: metric.id,
        custom_parameter_3: metric.name,
      });
    }

    // Or send to your custom analytics endpoint
    const apiUrl = process.env.REACT_APP_API_URL || 'https://api.monkeyz.co.il';
    fetch(`${apiUrl}/api/analytics/vitals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metric: metric.name,
        value: metric.value,
        id: metric.id,
        url: window.location.href,
        timestamp: Date.now(),
      }),
    }).catch(console.error);
  }
};

// Enhanced performance tracking
export const initPerformanceMonitoring = () => {
  // Core Web Vitals
  getCLS(sendToAnalytics);
  getFID(sendToAnalytics);
  getFCP(sendToAnalytics);
  getLCP(sendToAnalytics);
  getTTFB(sendToAnalytics);

  // Custom performance tracking
  trackResourceLoadTimes();
  trackRouteChanges();
  trackAPIPerformance();
};

// Track resource loading times
const trackResourceLoadTimes = () => {
  if ('performance' in window && 'getEntriesByType' in window.performance) {
    const resources = window.performance.getEntriesByType('resource');
    
    resources.forEach(resource => {
      if (resource.duration > 1000) { // Track slow resources (>1s)
        console.warn(`Slow resource: ${resource.name} took ${resource.duration.toFixed(2)}ms`);
      }
    });
  }
};

// Track route change performance
export const trackRouteChange = (routeName) => {
  const startTime = performance.now();
  
  // Use requestIdleCallback to measure when route is fully rendered
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      const routeLoadTime = performance.now() - startTime;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`%cRoute ${routeName}: ${routeLoadTime.toFixed(2)}ms`, 
          'color: blue; font-weight: bold');
      }
      
      // Send to analytics
      if (process.env.NODE_ENV === 'production' && window.gtag) {
        window.gtag('event', 'route_change', {
          route_name: routeName,
          load_time: routeLoadTime,
        });
      }
    });
  }
};

// Track API call performance
const trackAPIPerformance = () => {
  const originalFetch = window.fetch;
  
  window.fetch = async (...args) => {
    const startTime = performance.now();
    const url = args[0];
    
    try {
      const response = await originalFetch(...args);
      const duration = performance.now() - startTime;
      
      // Log slow API calls
      if (duration > 2000) {
        console.warn(`Slow API call: ${url} took ${duration.toFixed(2)}ms`);
      }
      
      // Track in production
      if (process.env.NODE_ENV === 'production' && duration > 1000) {
        if (window.gtag) {
          window.gtag('event', 'slow_api_call', {
            url: url,
            duration: duration,
            status: response.status,
          });
        }
      }
      
      return response;
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`API call failed: ${url} after ${duration.toFixed(2)}ms`, error);
      throw error;
    }
  };
};

// Memory usage monitoring
export const trackMemoryUsage = () => {
  if ('memory' in window.performance) {
    const memory = window.performance.memory;
    const memoryUsage = {
      used: Math.round(memory.usedJSHeapSize / 1048576), // MB
      allocated: Math.round(memory.totalJSHeapSize / 1048576), // MB
      limit: Math.round(memory.jsHeapSizeLimit / 1048576), // MB
    };
    
    console.log('Memory usage:', memoryUsage);
    
    // Alert if memory usage is high
    if (memoryUsage.used > 100) { // Alert if > 100MB
      console.warn('High memory usage detected:', memoryUsage);
    }
    
    return memoryUsage;
  }
};

// Performance budget monitoring
export const checkPerformanceBudget = () => {
  if ('performance' in window && 'getEntriesByType' in window.performance) {
    const navigation = window.performance.getEntriesByType('navigation')[0];
    
    const metrics = {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      totalPageLoad: navigation.loadEventEnd - navigation.fetchStart,
    };
    
    // Check against budget
    const budget = {
      domContentLoaded: 1500, // 1.5s
      loadComplete: 3000,     // 3s
      totalPageLoad: 4000,    // 4s
    };
    
    Object.entries(metrics).forEach(([metric, value]) => {
      const budgetValue = budget[metric];
      const overBudget = value > budgetValue;
      
      if (overBudget) {
        console.warn(`Performance budget exceeded for ${metric}: ${value.toFixed(2)}ms (budget: ${budgetValue}ms)`);
      }
    });
    
    return { metrics, budget, withinBudget: Object.entries(metrics).every(([key, value]) => value <= budget[key]) };
  }
};

export default {
  initPerformanceMonitoring,
  trackRouteChange,
  trackMemoryUsage,
  checkPerformanceBudget,
};
