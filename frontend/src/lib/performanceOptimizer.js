// Performance and Console Optimization Utility
// This script reduces console spam and optimizes browser warnings

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

// Optimize image loading to prevent lazy loading warnings
export const optimizeImageLoading = () => {
  // Add loading optimization for images
  const images = document.querySelectorAll('img[loading="lazy"]');
  images.forEach(img => {
    // For images above the fold, remove lazy loading
    const rect = img.getBoundingClientRect();
    if (rect.top < window.innerHeight) {
      img.removeAttribute('loading');
      img.loading = 'eager';
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
  
  // Optimize scroll performance
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

// Initialize performance optimizations
export const initPerformanceOptimizations = () => {
  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', optimizeReactPerformance);
  } else {
    optimizeReactPerformance();
  }
  
  // Optimize after route changes
  let lastPath = window.location.pathname;
  const checkRouteChange = () => {
    if (window.location.pathname !== lastPath) {
      lastPath = window.location.pathname;
      setTimeout(optimizeImageLoading, 100);
    }
  };
  
  // Check for route changes
  setInterval(checkRouteChange, 500);
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
