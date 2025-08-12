import { useEffect, useRef } from 'react';

// Performance thresholds based on Core Web Vitals
const PERFORMANCE_THRESHOLDS = {
  FCP: 1800, // First Contentful Paint - 1.8s
  LCP: 2500, // Largest Contentful Paint - 2.5s
  FID: 100,  // First Input Delay - 100ms
  CLS: 0.1,  // Cumulative Layout Shift - 0.1
  TTFB: 800, // Time to First Byte - 800ms
};

// Memory usage alert threshold (MB)
const MEMORY_THRESHOLD = 50;

export const usePerformanceMonitoring = (componentName = 'Component') => {
  const startTimeRef = useRef(performance.now());
  const observerRef = useRef(null);
  
  useEffect(() => {
    // Monitor Core Web Vitals
    if ('web-vital' in window || 'PerformanceObserver' in window) {
      try {
        // Monitor Layout Shifts (CLS)
        observerRef.current = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.value > PERFORMANCE_THRESHOLDS.CLS) {
              console.warn(`⚠️ High CLS detected in ${componentName}:`, entry.value);
            }
          }
        });
        
        observerRef.current.observe({ entryTypes: ['layout-shift'] });
      } catch (error) {
        // Silently fail if not supported
      }
    }

    // Monitor memory usage
    const checkMemory = () => {
      if ('memory' in performance) {
        const memoryMB = performance.memory.usedJSHeapSize / 1024 / 1024;
        if (memoryMB > MEMORY_THRESHOLD) {
          console.warn(`🧠 High memory usage in ${componentName}: ${memoryMB.toFixed(1)}MB`);
        }
      }
    };

    const memoryInterval = setInterval(checkMemory, 30000); // Check every 30s

    // Component render time tracking
    const renderTime = performance.now() - startTimeRef.current;
    if (renderTime > 16) { // 16ms for 60fps
      console.log(`🐌 Slow render in ${componentName}: ${renderTime.toFixed(2)}ms`);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      clearInterval(memoryInterval);
    };
  }, [componentName]);

  // Measure component mount/unmount performance
  useEffect(() => {
    const mountTime = performance.now() - startTimeRef.current;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`⏱️ ${componentName} mounted in ${mountTime.toFixed(2)}ms`);
    }

    return () => {
      const unmountTime = performance.now();
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔄 ${componentName} unmounted after ${(unmountTime - startTimeRef.current).toFixed(0)}ms`);
      }
    };
  }, [componentName]);
};

// Performance metrics collection
export const collectPerformanceMetrics = () => {
  if (typeof window === 'undefined') return null;

  const navigation = performance.getEntriesByType('navigation')[0];
  const paint = performance.getEntriesByType('paint');
  
  const metrics = {
    // Navigation timing
    ttfb: navigation?.responseStart - navigation?.requestStart || 0,
    domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart || 0,
    loadComplete: navigation?.loadEventEnd - navigation?.loadEventStart || 0,
    
    // Paint timing
    fcp: paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
    
    // Memory (if available)
    memory: performance.memory ? {
      used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
      total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
      limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024),
    } : null,
  };

  // Log warnings for poor performance
  if (metrics.ttfb > PERFORMANCE_THRESHOLDS.TTFB) {
    console.warn('⚠️ Slow TTFB:', metrics.ttfb, 'ms');
  }
  
  if (metrics.fcp > PERFORMANCE_THRESHOLDS.FCP) {
    console.warn('⚠️ Slow FCP:', metrics.fcp, 'ms');
  }

  return metrics;
};

// Route performance tracking
export const trackRoutePerformance = (routeName) => {
  const startTime = performance.now();
  
  return () => {
    const endTime = performance.now();
    const loadTime = endTime - startTime;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`📄 Route "${routeName}" loaded in ${loadTime.toFixed(2)}ms`);
    }
    
    // Track slow routes
    if (loadTime > 1000) {
      console.warn(`🐌 Slow route load: ${routeName} took ${loadTime.toFixed(2)}ms`);
    }
  };
};

export default usePerformanceMonitoring;
