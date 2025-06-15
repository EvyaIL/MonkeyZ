import React, { useState, useEffect, useCallback, useRef } from 'react';
import placeholderImage from '../assets/placeholder-product.svg';

// Image cache to store loaded images
const imageCache = new Map();

// Preload function to load images in background
const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    if (imageCache.has(src)) {
      resolve(src);
      return;
    }

    const img = new Image();
    img.onload = () => {
      imageCache.set(src, true);
      resolve(src);
    };
    img.onerror = reject;
    img.src = src;
  });
};

// Hook for intersection observer (lazy loading)
const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, {
      threshold: 0.1,
      rootMargin: '50px',
      ...options
    });

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [options]);

  return [ref, isIntersecting];
};

const OptimizedImage = ({ 
  src, 
  alt, 
  className = '', 
  placeholder = placeholderImage,
  lazy = true,
  preload = false,
  onLoad,
  onError,
  ...props 
}) => {
  const [currentSrc, setCurrentSrc] = useState(placeholder);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(!lazy);
  
  const [intersectionRef, isIntersecting] = useIntersectionObserver();

  // Determine if we should start loading
  useEffect(() => {
    if (!lazy || isIntersecting) {
      setShouldLoad(true);
    }
  }, [lazy, isIntersecting]);

  // Handle image loading
  useEffect(() => {
    if (!shouldLoad || !src || hasError) return;

    // Check if image is already cached
    if (imageCache.has(src)) {
      setCurrentSrc(src);
      setIsLoaded(true);
      onLoad?.();
      return;
    }

    // Load image
    preloadImage(src)
      .then(() => {
        setCurrentSrc(src);
        setIsLoaded(true);
        onLoad?.();
      })
      .catch(() => {
        setHasError(true);
        setCurrentSrc(placeholder);
        onError?.();
      });
  }, [shouldLoad, src, hasError, placeholder, onLoad, onError]);

  // Preload images in background if requested
  useEffect(() => {
    if (preload && src && !imageCache.has(src)) {
      preloadImage(src).catch(() => {
        // Silently fail for preloading
      });
    }
  }, [preload, src]);

  return (
    <div ref={intersectionRef} className={`relative overflow-hidden ${className}`}>
      {/* Loading indicator */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <div className="animate-pulse w-8 h-8 rounded-full bg-accent/50"></div>
        </div>
      )}
        {/* Main image */}
      <img
        src={currentSrc}
        alt={alt}
        className={`w-full h-full object-cover optimized-image transition-all duration-300 ${
          isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        loading={lazy ? 'lazy' : 'eager'}
        decoding="async"
        {...props}
      />
    </div>
  );
};

export default OptimizedImage;
