import React, { 
  memo, 
  useState, 
  useEffect, 
  useMemo, 
  useCallback, 
  useRef, 
  lazy, 
  Suspense,
  startTransition 
} from 'react';

// Ultra-fast React optimizations utility
export class ReactOptimizer {
  constructor() {
    this.componentCache = new Map();
    this.intersectionObserver = null;
    this.performanceMetrics = {
      renderTimes: [],
      memoryUsage: [],
      reRenders: {}
    };
    this.init();
  }

  init() {
    // Initialize intersection observer for lazy loading
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      this.intersectionObserver = new IntersectionObserver(
        this.handleIntersection.bind(this),
        {
          rootMargin: '50px 0px',
          threshold: [0, 0.1, 0.5, 1]
        }
      );
    }

    // Monitor performance
    this.startPerformanceMonitoring();
  }

  // HOC for automatic memo optimization
  optimizeComponent = (Component, compareProps = null) => {
    const OptimizedComponent = memo(Component, compareProps);
    
    // Add performance tracking
    return memo((props) => {
      const renderStart = performance.now();
      const componentName = Component.name || 'Anonymous';
      
      useEffect(() => {
        const renderTime = performance.now() - renderStart;
        this.trackRender(componentName, renderTime);
      });

      return <OptimizedComponent {...props} />;
    });
  };

  // Smart lazy loading with preloading
  createLazyComponent = (importFn, fallback = null) => {
    const LazyComponent = lazy(importFn);
    
    // Preload on hover or interaction
    const PreloadableComponent = (props) => {
      const [shouldPreload, setShouldPreload] = useState(false);
      
      const handleMouseEnter = useCallback(() => {
        if (!shouldPreload) {
          setShouldPreload(true);
          importFn(); // Preload the component
        }
      }, [shouldPreload]);

      return (
        <div onMouseEnter={handleMouseEnter}>
          <Suspense fallback={fallback || <div className="loading-skeleton" />}>
            <LazyComponent {...props} />
          </Suspense>
        </div>
      );
    };

    return memo(PreloadableComponent);
  };

  // Ultra-fast image component with multiple optimizations
  OptimizedImage = memo(({ 
    src, 
    alt, 
    className = '', 
    lazy = true, 
    webp = true,
    blur = true,
    ...props 
  }) => {
    const [loaded, setLoaded] = useState(false);
    const [inView, setInView] = useState(!lazy);
    const [error, setError] = useState(false);
    const imgRef = useRef();
    const [currentSrc, setCurrentSrc] = useState('');

    // Generate optimized image sources
    const imageSources = useMemo(() => {
      if (!src) return { original: '', webp: '', blur: '' };
      
      const baseSrc = src.replace(/\.[^/.]+$/, '');
      const ext = src.match(/\.[^/.]+$/)?.[0] || '.jpg';
      
      return {
        original: src,
        webp: webp ? `${baseSrc}.webp` : src,
        blur: blur ? `${baseSrc}_blur${ext}` : ''
      };
    }, [src, webp, blur]);

    // Intersection observer for lazy loading
    useEffect(() => {
      if (!lazy || !imgRef.current || inView) return;
      
      const observer = this.intersectionObserver;
      if (observer) {
        observer.observe(imgRef.current);
        
        const handleIntersection = (entries) => {
          entries.forEach(entry => {
            if (entry.target === imgRef.current && entry.isIntersecting) {
              setInView(true);
              observer.unobserve(entry.target);
            }
          });
        };
        
        // Store the handler to clean up later
        imgRef.current._intersectionHandler = handleIntersection;
      }
      
      return () => {
        if (imgRef.current && observer) {
          observer.unobserve(imgRef.current);
        }
      };
    }, [lazy, inView]);

    // Progressive loading with blur effect
    useEffect(() => {
      if (!inView || !src) return;
      
      const loadImage = async () => {
        try {
          // Load blur image first if available
          if (imageSources.blur && blur) {
            setCurrentSrc(imageSources.blur);
          }
          
          // Test WebP support and load appropriate format
          const supportsWebP = await this.checkWebPSupport();
          const targetSrc = supportsWebP && webp ? imageSources.webp : imageSources.original;
          
          const img = new Image();
          img.onload = () => {
            setCurrentSrc(targetSrc);
            setLoaded(true);
            setError(false);
          };
          img.onerror = () => {
            setError(true);
            if (targetSrc !== imageSources.original) {
              // Fallback to original format
              const fallbackImg = new Image();
              fallbackImg.onload = () => {
                setCurrentSrc(imageSources.original);
                setLoaded(true);
              };
              fallbackImg.src = imageSources.original;
            }
          };
          img.src = targetSrc;
        } catch (err) {
          setError(true);
        }
      };
      
      loadImage();
    }, [inView, src, imageSources, webp, blur]);

    if (!inView && lazy) {
      return (
        <div 
          ref={imgRef}
          className={`image-placeholder ${className}`}
          style={{ 
            backgroundColor: '#f0f0f0', 
            minHeight: '200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <span>Loading...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className={`image-error ${className}`}>
          <span>Image failed to load</span>
        </div>
      );
    }

    return (
      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        className={`optimized-image ${className} ${loaded ? 'loaded' : 'loading'}`}
        style={{
          opacity: loaded ? 1 : 0.7,
          filter: loaded ? 'none' : 'blur(5px)',
          transition: 'all 0.3s ease'
        }}
        loading={lazy ? 'lazy' : 'eager'}
        decoding="async"
        {...props}
      />
    );
  });

  // Smart list virtualization
  VirtualizedList = memo(({ 
    items, 
    renderItem, 
    itemHeight = 100, 
    containerHeight = 400,
    overscan = 5 
  }) => {
    const [scrollTop, setScrollTop] = useState(0);
    const containerRef = useRef();

    const visibleItems = useMemo(() => {
      const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
      const endIndex = Math.min(
        items.length,
        Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
      );
      
      return items.slice(startIndex, endIndex).map((item, index) => ({
        ...item,
        index: startIndex + index
      }));
    }, [items, scrollTop, itemHeight, containerHeight, overscan]);

    const handleScroll = useCallback((e) => {
      setScrollTop(e.target.scrollTop);
    }, []);

    const totalHeight = items.length * itemHeight;

    return (
      <div
        ref={containerRef}
        className="virtualized-list"
        style={{ height: containerHeight, overflowY: 'auto' }}
        onScroll={handleScroll}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          {visibleItems.map(item => (
            <div
              key={item.id || item.index}
              style={{
                position: 'absolute',
                top: item.index * itemHeight,
                left: 0,
                right: 0,
                height: itemHeight
              }}
            >
              {renderItem(item, item.index)}
            </div>
          ))}
        </div>
      </div>
    );
  });

  // Debounced search hook
  useDebounceSearch = (searchFn, delay = 300) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const debounceRef = useRef();

    const search = useCallback((searchQuery) => {
      setQuery(searchQuery);
      
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      if (!searchQuery.trim()) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      debounceRef.current = setTimeout(async () => {
        try {
          const searchResults = await searchFn(searchQuery);
          setResults(searchResults);
        } catch (error) {
          console.error('Search error:', error);
          setResults([]);
        } finally {
          setLoading(false);
        }
      }, delay);
    }, [searchFn, delay]);

    useEffect(() => {
      return () => {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }
      };
    }, []);

    return { query, results, loading, search };
  };

  // Performance monitoring
  startPerformanceMonitoring() {
    if (typeof window === 'undefined') return;

    // Monitor memory usage
    setInterval(() => {
      if (performance.memory) {
        this.performanceMetrics.memoryUsage.push({
          timestamp: Date.now(),
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize
        });

        // Keep only last 100 entries
        if (this.performanceMetrics.memoryUsage.length > 100) {
          this.performanceMetrics.memoryUsage = this.performanceMetrics.memoryUsage.slice(-50);
        }
      }
    }, 5000);

    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              console.warn(`Long task detected: ${entry.duration}ms`);
            }
          }
        });
        observer.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        // PerformanceObserver not supported
      }
    }
  }

  trackRender(componentName, renderTime) {
    if (!this.performanceMetrics.reRenders[componentName]) {
      this.performanceMetrics.reRenders[componentName] = [];
    }
    
    this.performanceMetrics.reRenders[componentName].push({
      timestamp: Date.now(),
      renderTime
    });

    // Log slow renders
    if (renderTime > 16) {
      console.warn(`Slow render detected: ${componentName} took ${renderTime}ms`);
    }
  }

  async checkWebPSupport() {
    return new Promise((resolve) => {
      const webP = new Image();
      webP.onload = webP.onerror = () => {
        resolve(webP.height === 2);
      };
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  }

  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.target._intersectionHandler) {
        entry.target._intersectionHandler([entry]);
      }
    });
  }

  // Get performance metrics
  getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      averageMemoryUsage: this.performanceMetrics.memoryUsage.length > 0
        ? this.performanceMetrics.memoryUsage.reduce((sum, m) => sum + m.used, 0) / this.performanceMetrics.memoryUsage.length
        : 0,
      componentRenderStats: Object.entries(this.performanceMetrics.reRenders).map(([name, renders]) => ({
        component: name,
        totalRenders: renders.length,
        averageRenderTime: renders.reduce((sum, r) => sum + r.renderTime, 0) / renders.length
      }))
    };
  }

  // Cleanup method
  cleanup() {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
  }
}

// Create singleton instance
export const reactOptimizer = new ReactOptimizer();

// Utility hooks for common optimizations
export const useOptimizedState = (initialValue) => {
  const [state, setState] = useState(initialValue);
  
  const setOptimizedState = useCallback((value) => {
    startTransition(() => {
      setState(value);
    });
  }, []);
  
  return [state, setOptimizedState];
};

export const useOptimizedEffect = (effect, deps = []) => {
  const memoizedEffect = useCallback(effect, deps);
  useEffect(memoizedEffect, deps);
};

// Export optimized components
export const OptimizedImage = reactOptimizer.OptimizedImage;
export const VirtualizedList = reactOptimizer.VirtualizedList;

export default reactOptimizer;
