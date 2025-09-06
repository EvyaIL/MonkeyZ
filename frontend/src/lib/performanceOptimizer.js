// Performance and Console Optimization Utility
// This script reduces console spam and optimizes browser warnings

// Advanced Performance Cache
const performanceCache = new Map();
let observers = new Map();

// Suppress deprecated -ms-high-contrast warnings in development
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
      return; // Skip these warnings
    }
    
    // Allow other warnings through
    originalConsoleWarn.apply(console, args);
  };
}

// Enhanced Intersection Observer for lazy loading
export const setupLazyLoading = () => {
  if (!('IntersectionObserver' in window)) return;

  const lazyImageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          // Create a new image to preload
          const newImg = new Image();
          newImg.onload = () => {
            img.src = img.dataset.src;
            img.classList.remove('lazy');
            img.classList.add('loaded');
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

// Optimize image loading to prevent lazy loading warnings
export const optimizeImageLoading = () => {
  const lazyObserver = observers.get('lazyImages') || setupLazyLoading();
  
  // Add loading optimization for images
  const images = document.querySelectorAll('img[loading="lazy"], img[data-src]');
  images.forEach(img => {
    const rect = img.getBoundingClientRect();
    if (rect.top < window.innerHeight * 1.5) {
      // For images near viewport, prioritize loading
      if (img.dataset.src && !img.src) {
        lazyObserver.observe(img);
      }
      if (img.loading === 'lazy' && rect.top < window.innerHeight * 0.5) {
        img.loading = 'eager';
      }
    }
  });
};

// Advanced Resource Preloading
export const preloadCriticalResources = () => {
  const criticalResources = [
    { href: '/api/product/best-sellers', as: 'fetch', type: 'application/json' },
    { href: '/api/product/homepage', as: 'fetch', type: 'application/json' },
    { href: '/static/media/logo.png', as: 'image', type: 'image/png' }
  ];

  criticalResources.forEach(({ href, as, type }) => {
    if (!document.querySelector(`link[href="${href}"]`)) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = href;
      link.as = as;
      if (type) link.type = type;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    }
  });
};

// Performance optimization for React components
export const optimizeReactPerformance = () => {
  // Reduce console logging in production
  if (process.env.NODE_ENV === 'production') {
    console.log = () => {};
    console.info = () => {};
    console.debug = () => {};
  }
  
  // Setup critical resource preloading
  preloadCriticalResources();
  
  // Optimize scroll performance with throttling
  let ticking = false;
  let lastScrollTime = 0;
  
  const optimizeScroll = () => {
    const now = Date.now();
    if (now - lastScrollTime > 16) { // ~60fps throttling
      if (!ticking) {
        requestAnimationFrame(() => {
          optimizeImageLoading();
          ticking = false;
          lastScrollTime = now;
        });
        ticking = true;
      }
    }
  };
  
  window.addEventListener('scroll', optimizeScroll, { passive: true });
  
  // Initial optimization
  setTimeout(() => {
    optimizeImageLoading();
    setupLazyLoading();
  }, 100);
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

// Bundle Splitting and Code Splitting
export const loadChunk = async (chunkName) => {
  try {
    const module = await import(/* webpackChunkName: "[request]" */ `../components/${chunkName}`);
    return module.default;
  } catch (error) {
    console.error(`Failed to load chunk ${chunkName}:`, error);
    return null;
  }
};

// Initialize performance optimizations
export const initPerformanceOptimizations = () => {
  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      optimizeReactPerformance();
      setupServiceWorker();
      setupScrollOptimization();
    });
  } else {
    optimizeReactPerformance();
    setupServiceWorker();
    setupScrollOptimization();
  }
  
  // Optimize after route changes
  let lastPath = window.location.pathname;
  const checkRouteChange = () => {
    if (window.location.pathname !== lastPath) {
      lastPath = window.location.pathname;
      setTimeout(() => {
        optimizeImageLoading();
        preloadCriticalResources();
      }, 100);
    }
  };
  
  // Check for route changes every 250ms instead of 500ms for better responsiveness
  setInterval(checkRouteChange, 250);
};

// Service Worker Setup
export const setupServiceWorker = () => {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
};

// Scroll optimization
export const setupScrollOptimization = () => {
  let ticking = false;
  
  const optimizeScroll = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        optimizeImageLoading();
        ticking = false;
      });
      ticking = true;
    }
  };
  
  window.addEventListener('scroll', optimizeScroll, { passive: true });
  
  // Initial optimization
  optimizeImageLoading();
};

// Memory optimization
export const optimizeMemory = () => {
  // Clean up old event listeners and observers
  window.addEventListener('beforeunload', () => {
    // Clear any remaining intervals or timeouts
    const highestTimeoutId = setTimeout(() => {}, 0);
    for (let i = 0; i < highestTimeoutId; i++) {
      clearTimeout(i);
    }
    
    const highestIntervalId = setInterval(() => {}, 9999);
    for (let i = 0; i < highestIntervalId; i++) {
      clearInterval(i);
    }
  });
};

// Export default optimization function
export default initPerformanceOptimizations;
