// Performance Optimization Utilities
import { lazy } from 'react';

// Lazy load components with better error boundaries
export const createLazyComponent = (importFunc, fallback = null) => {
  return lazy(() => 
    importFunc().catch(error => {
      console.warn('Component lazy loading failed:', error);
      // Return a fallback component instead of crashing
      return { 
        default: () => fallback || (
          <div className="p-4 text-center text-gray-500">
            Component temporarily unavailable
          </div>
        )
      };
    })
  );
};

// Debounce function for search and input handlers
export const debounce = (func, wait, immediate = false) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
};

// Throttle function for scroll and resize handlers
export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Image optimization utility
export const optimizeImageUrl = (url, width = 400, quality = 80) => {
  if (!url) return '/placeholder.png';
  
  // If it's already optimized or is a placeholder, return as-is
  if (url.includes('placeholder') || url.includes('?w=') || url.includes('quality=')) {
    return url;
  }
  
  // Add optimization parameters if the service supports it
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}w=${width}&quality=${quality}&auto=format,compress`;
};

// Preload critical resources
export const preloadResource = (href, as = 'script', crossorigin = true) => {
  if (typeof window === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  if (crossorigin) link.crossOrigin = 'anonymous';
  
  document.head.appendChild(link);
  
  return () => {
    if (link && link.parentNode) {
      link.parentNode.removeChild(link);
    }
  };
};

// Memory optimization for large lists
export const createVirtualScrollConfig = (itemHeight = 60, containerHeight = 400) => ({
  height: containerHeight,
  itemSize: itemHeight,
  overscanCount: 5, // Render 5 extra items outside viewport
  useIsScrolling: true // Enable optimizations during scrolling
});

// Performance monitoring utilities
export const measurePerformance = (name, fn) => {
  return async (...args) => {
    const start = performance.now();
    try {
      const result = await fn(...args);
      const end = performance.now();
      
      if (process.env.NODE_ENV === 'development' && (end - start) > 100) {
        console.log(`⚠️ Slow operation "${name}": ${(end - start).toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const end = performance.now();
      console.error(`❌ Operation "${name}" failed after ${(end - start).toFixed(2)}ms:`, error);
      throw error;
    }
  };
};

// Bundle optimization - Dynamic imports with retry logic
export const dynamicImport = async (importFunc, retries = 3) => {
  let lastError;
  
  for (let i = 0; i <= retries; i++) {
    try {
      return await importFunc();
    } catch (error) {
      lastError = error;
      
      // If it's a chunk loading error, wait and retry
      if (error.name === 'ChunkLoadError' && i < retries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        continue;
      }
      
      throw error;
    }
  }
  
  throw lastError;
};

// CSS optimization - Remove unused styles
export const optimizeCSSClasses = (classes) => {
  return classes
    .split(' ')
    .filter(Boolean)
    .filter((cls, index, arr) => arr.indexOf(cls) === index) // Remove duplicates
    .join(' ');
};

// Event listener optimization
export const optimizeEventListener = (element, event, handler, options = {}) => {
  const optimizedHandler = throttle(handler, options.throttle || 16); // 60fps default
  const finalOptions = {
    passive: true, // Better scroll performance
    ...options
  };
  
  element.addEventListener(event, optimizedHandler, finalOptions);
  
  return () => element.removeEventListener(event, optimizedHandler, finalOptions);
};

// Intersection Observer optimization
export const createOptimizedObserver = (callback, options = {}) => {
  const defaultOptions = {
    rootMargin: '50px', // Start loading before element is visible
    threshold: 0.1,
    ...options
  };
  
  return new IntersectionObserver(
    throttle(callback, 100), // Throttle callback
    defaultOptions
  );
};

// React memo optimization helper
export const createMemoComponent = (Component, areEqual) => {
  const MemoizedComponent = React.memo(Component, areEqual);
  MemoizedComponent.displayName = `Memo(${Component.displayName || Component.name})`;
  return MemoizedComponent;
};

// Cache management for API responses
export const createResponseCache = (maxSize = 50, ttl = 5 * 60 * 1000) => {
  const cache = new Map();
  
  const set = (key, value) => {
    // Remove oldest entries if cache is full
    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    cache.set(key, {
      value,
      timestamp: Date.now()
    });
  };
  
  const get = (key) => {
    const item = cache.get(key);
    if (!item) return null;
    
    // Check if expired
    if (Date.now() - item.timestamp > ttl) {
      cache.delete(key);
      return null;
    }
    
    return item.value;
  };
  
  const clear = () => cache.clear();
  
  return { set, get, clear, size: () => cache.size };
};

// Performance budget checker
export const checkPerformanceBudget = () => {
  if (typeof window === 'undefined' || !window.performance) return null;
  
  const navigation = performance.getEntriesByType('navigation')[0];
  const paint = performance.getEntriesByType('paint');
  
  const metrics = {
    // Core Web Vitals thresholds
    FCP: paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
    domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart || 0,
    loadComplete: navigation?.loadEventEnd - navigation?.loadEventStart || 0,
    
    // Performance budgets (in ms)
    budgets: {
      FCP: 1800, // First Contentful Paint
      domContentLoaded: 1500,
      loadComplete: 3000
    }
  };
  
  // Check against budgets
  const results = {};
  Object.keys(metrics.budgets).forEach(metric => {
    const value = metrics[metric];
    const budget = metrics.budgets[metric];
    results[metric] = {
      value,
      budget,
      withinBudget: value <= budget,
      ratio: value / budget
    };
  });
  
  return results;
};

export default {
  createLazyComponent,
  debounce,
  throttle,
  optimizeImageUrl,
  preloadResource,
  createVirtualScrollConfig,
  measurePerformance,
  dynamicImport,
  optimizeCSSClasses,
  optimizeEventListener,
  createOptimizedObserver,
  createMemoComponent,
  createResponseCache,
  checkPerformanceBudget
};
