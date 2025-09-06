// Enhanced Performance and Console Optimization Utility
// This script provides comprehensive performance optimizations for MonkeyZ

// Advanced Performance Cache and Observer Management
const performanceCache = new Map();
const observers = new Map();
let isInitialized = false;

// Console optimization for development
if (process.env.NODE_ENV === 'development') {
  const originalConsoleWarn = console.warn;
  console.warn = (...args) => {
    const message = args.join(' ');
    
    // Suppress known deprecation warnings that we can't control
    if (message.includes('-ms-high-contrast') || 
        message.includes('Deprecation') ||
        message.includes('Images loaded lazily') ||
        message.includes('Each child in a list should have a unique "key" prop') ||
        message.includes('Refused to load the stylesheet') ||
        message.includes('Content Security Policy directive') ||
        message.includes('Refused to frame')) {
      return;
    }
    
    originalConsoleWarn.apply(console, args);
  };
}

// Enhanced Intersection Observer for lazy loading
export const setupLazyLoading = () => {
  if (!('IntersectionObserver' in window) || observers.has('lazyImages')) {
    return observers.get('lazyImages');
  }

  const lazyImageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          const newImg = new Image();
          newImg.onload = () => {
            img.src = img.dataset.src;
            img.classList.remove('lazy');
            img.classList.add('loaded');
          };
          newImg.onerror = () => {
            img.classList.add('error');
          };
          newImg.src = img.dataset.src;
          lazyImageObserver.unobserve(img);
        }
      }
    });
  }, {
    rootMargin: '100px 0px',
    threshold: 0.01
  });

  observers.set('lazyImages', lazyImageObserver);
  return lazyImageObserver;
};

// Optimized image loading
export const optimizeImageLoading = () => {
  const lazyObserver = setupLazyLoading();
  
  const images = document.querySelectorAll('img[data-src], img[loading="lazy"]');
  images.forEach(img => {
    const rect = img.getBoundingClientRect();
    
    // For images in viewport or near it
    if (rect.top < window.innerHeight * 1.5) {
      if (img.dataset.src && !img.src) {
        lazyObserver.observe(img);
      }
      
      // Prioritize images above the fold
      if (img.loading === 'lazy' && rect.top < window.innerHeight * 0.5) {
        img.loading = 'eager';
      }
    }
  });
};

// Critical resource preloading
export const preloadCriticalResources = () => {
  const criticalResources = [
    { href: '/api/product/best-sellers', as: 'fetch' },
    { href: '/api/product/homepage', as: 'fetch' },
    { href: '/static/css/main.css', as: 'style' },
    { href: '/static/js/main.js', as: 'script' }
  ];

  criticalResources.forEach(({ href, as }) => {
    if (!document.querySelector(`link[href="${href}"]`)) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = href;
      link.as = as;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    }
  });
};

// API Response Caching
export const cacheAPIResponse = (key, data, ttl = 300000) => {
  performanceCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  });
};

export const getCachedAPIResponse = (key) => {
  const cached = performanceCache.get(key);
  if (!cached) return null;
  
  if (Date.now() - cached.timestamp > cached.ttl) {
    performanceCache.delete(key);
    return null;
  }
  
  return cached.data;
};

// Optimized scroll handling
let scrollTicking = false;
let lastScrollTime = 0;

const handleScroll = () => {
  const now = Date.now();
  if (now - lastScrollTime > 16 && !scrollTicking) { // 60fps throttling
    requestAnimationFrame(() => {
      optimizeImageLoading();
      scrollTicking = false;
      lastScrollTime = now;
    });
    scrollTicking = true;
  }
};

// Service Worker setup
export const setupServiceWorker = () => {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('SW registered:', registration);
        })
        .catch(error => {
          console.log('SW registration failed:', error);
        });
    });
  }
};

// Bundle splitting helper
export const loadChunk = async (chunkName) => {
  try {
    const module = await import(/* webpackChunkName: "[request]" */ `../components/${chunkName}`);
    return module.default;
  } catch (error) {
    console.error(`Failed to load chunk ${chunkName}:`, error);
    return null;
  }
};

// Memory optimization
export const optimizeMemory = () => {
  // Clean up performance cache periodically
  setInterval(() => {
    if (performanceCache.size > 100) {
      const entries = Array.from(performanceCache.entries());
      const oldEntries = entries.slice(0, 50);
      oldEntries.forEach(([key]) => performanceCache.delete(key));
    }
  }, 60000); // Every minute

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    observers.forEach(observer => observer.disconnect());
    performanceCache.clear();
  });
};

// Main performance optimization function
export const optimizeReactPerformance = () => {
  if (isInitialized) return;
  
  // Reduce console logging in production
  if (process.env.NODE_ENV === 'production') {
    console.log = () => {};
    console.info = () => {};
    console.debug = () => {};
  }
  
  // Setup critical optimizations
  preloadCriticalResources();
  setupLazyLoading();
  optimizeMemory();
  
  // Setup optimized scroll handling
  window.addEventListener('scroll', handleScroll, { passive: true });
  
  // Initial image optimization
  setTimeout(() => {
    optimizeImageLoading();
  }, 100);
  
  isInitialized = true;
};

// Route change optimization
let lastPath = window.location.pathname;
const optimizeOnRouteChange = () => {
  if (window.location.pathname !== lastPath) {
    lastPath = window.location.pathname;
    setTimeout(() => {
      optimizeImageLoading();
      preloadCriticalResources();
    }, 100);
  }
};

// Initialize all performance optimizations
export const initPerformanceOptimizations = () => {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      optimizeReactPerformance();
      setupServiceWorker();
    });
  } else {
    optimizeReactPerformance();
    setupServiceWorker();
  }
  
  // Monitor route changes
  setInterval(optimizeOnRouteChange, 250);
};

// Export default
export default initPerformanceOptimizations;
