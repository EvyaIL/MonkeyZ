import React, { useState, useEffect, useRef, useCallback } from 'react';
import ProductCard from '../product/ProductCard';
import { isRTL } from '../../utils/language';
import './ProductCarousel.css';

const ProductCarousel = ({ 
  products = [], 
  title = "Featured Products", 
  autoPlay = true, 
  autoPlayInterval = 4000,
  showDots = true,
  showArrows = true,
  itemsPerView = 3
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isHovered, setIsHovered] = useState(false);
  const intervalRef = useRef(null);
  const carouselRef = useRef(null);

  const totalSlides = Math.ceil(products.length / itemsPerView);
  const isRTLLayout = isRTL();

  // Auto-play functionality
  useEffect(() => {
    if (isPlaying && !isHovered && totalSlides > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % totalSlides);
      }, autoPlayInterval);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isPlaying, isHovered, totalSlides, autoPlayInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const goToSlide = useCallback((index) => {
    setCurrentIndex(index);
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const toggleAutoPlay = () => {
    setIsPlaying(!isPlaying);
  };

  if (!products.length) {
    return null;
  }

  const translateX = isRTLLayout 
    ? `translateX(${currentIndex * 100}%)`
    : `translateX(-${currentIndex * 100}%)`;

  return (
    <div className={`product-carousel ${isRTLLayout ? 'rtl' : 'ltr'}`}>
      <div className="carousel-header">
        <h2 className="carousel-title">{title}</h2>
        <div className="carousel-controls">
          {autoPlay && (
            <button 
              className={`auto-play-btn ${isPlaying ? 'playing' : 'paused'}`}
              onClick={toggleAutoPlay}
              aria-label={isPlaying ? 'Pause carousel' : 'Play carousel'}
            >
              {isPlaying ? '⏸️' : '▶️'}
            </button>
          )}
        </div>
      </div>

      <div 
        className="carousel-container"
        ref={carouselRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {showArrows && totalSlides > 1 && (
          <>
            <button 
              className="carousel-arrow prev"
              onClick={prevSlide}
              aria-label="Previous products"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
              </svg>
            </button>
            <button 
              className="carousel-arrow next"
              onClick={nextSlide}
              aria-label="Next products"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
              </svg>
            </button>
          </>
        )}

        <div className="carousel-track">
          {Array.from({ length: totalSlides }).map((_, slideIndex) => (
            <div 
              key={slideIndex}
              className="carousel-slide"
              style={{ transform: translateX }}
            >
              <div className="products-grid">
                {products
                  .slice(slideIndex * itemsPerView, (slideIndex + 1) * itemsPerView)
                  .map((product, productIndex) => (
                    <div key={product.id || product._id || productIndex} className="carousel-product">
                      <ProductCard product={product} />
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>

        {showDots && totalSlides > 1 && (
          <div className="carousel-dots">
            {Array.from({ length: totalSlides }).map((_, index) => (
              <button
                key={index}
                className={`carousel-dot ${index === currentIndex ? 'active' : ''}`}
                onClick={() => goToSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Progress bar for auto-play */}
        {isPlaying && !isHovered && (
          <div className="carousel-progress">
            <div 
              className="progress-bar"
              style={{ 
                animationDuration: `${autoPlayInterval}ms`,
                animationPlayState: isPlaying && !isHovered ? 'running' : 'paused'
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCarousel;
