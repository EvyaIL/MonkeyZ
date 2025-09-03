import React, { useState, useEffect, useRef, useMemo } from "react";
import SecondaryButton from "../buttons/SecondaryButton";
import PrimaryButton from "../buttons/PrimaryButton";
import PointButton from "../buttons/PointButton";
import { useNavigate } from "react-router-dom";
import { useGlobalProvider } from "../../context/GlobalProvider";
import { useTranslation } from "react-i18next";
import Spinner from "../Spinner";
import placeholderImage from '../../assets/placeholder-product.svg';
import { isRTL, formatTextDirection } from "../../utils/language";
import './ProductShowcase.css';

const ProductShowcase = React.memo(({ products, title }) => {
  // Filter out invalid products
  const validProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(p => p && typeof p === 'object' && p.id !== null && p.id !== undefined);
  }, [products]);

  const navigate = useNavigate();
  const { addItemToCart, notify } = useGlobalProvider();
  const { i18n, t } = useTranslation();
  const lang = i18n.language || "he";

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isMobileView, setIsMobileView] = useState(false);
  const timeoutRef = useRef(null);
  const showcaseRef = useRef(null);

  // Reset timeout when component unmounts or when we change slides
  const resetTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  // Handle products loading state
  useEffect(() => {
    if (products && Array.isArray(products) && !isLoaded) {
      setIsLoaded(true);
    }
    if (!products && isLoaded) {
      setIsLoaded(false);
      setCurrentIndex(0);
    }
  }, [products, isLoaded]);

  // Handle auto-rotation of products
  useEffect(() => {
    resetTimeout();
    
    // Only auto-rotate if there are multiple products, showcase is loaded, and not paused
    if (isLoaded && validProducts && validProducts.length > 1 && !isPaused) {
      timeoutRef.current = setTimeout(
        () => setCurrentIndex((prevIndex) => (prevIndex + 1) % validProducts.length),
        5000
      );
    }
    
    return () => {
      resetTimeout();
    };
  }, [currentIndex, validProducts, isLoaded, isPaused]);

  // Check for mobile view
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Navigation functions
  const handleNavigation = (newIndex) => {
    resetTimeout();
    setCurrentIndex(newIndex);
  };

  const nextProduct = () => {
    if (!validProducts || validProducts.length === 0) return;
    handleNavigation((currentIndex + 1) % validProducts.length);
  };

  const prevProduct = () => {
    if (!validProducts || validProducts.length === 0) return;
    handleNavigation((currentIndex - 1 + validProducts.length) % validProducts.length);
  };

  const goToSlide = (index) => {
    handleNavigation(index);
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
    setIsPaused(true); // Pause auto-rotation when user is interacting
  };
  
  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
    const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    
    if (isLeftSwipe) {
      lang === "he" ? prevProduct() : nextProduct();
    }
    
    if (isRightSwipe) {
      lang === "he" ? nextProduct() : prevProduct();
    }
    
    // Reset states
    setTouchStart(0);
    setTouchEnd(0);
    
    // Resume auto-rotation after a short delay
    setTimeout(() => setIsPaused(false), 1000);
  };  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === "ArrowLeft") {
      lang === "he" ? nextProduct() : prevProduct();
      e.preventDefault();
    } else if (e.key === "ArrowRight") {
      lang === "he" ? prevProduct() : nextProduct();
      e.preventDefault();
    }
  };

  // Add to cart with notification
  const handleAddToCart = (product) => {
    if (!product.id) return;
    
    addItemToCart(product.id, 1, product);
    
    const productName = typeof product.name === "object" 
      ? (product.name[lang] || product.name.en) 
      : product.name;
      
    notify({
      message: `${productName} ${t("added_to_cart_suffix", "added to cart")}`,
      type: "success"
    });
  };

  // Loading state
  if (!isLoaded) {
    return (
      <div className={`product-showcase ${isRTL() ? 'rtl' : 'ltr'}`}>
        <h2 className="showcase-title">
          {formatTextDirection(title)}
        </h2>
        <div className="showcase-loading">
          <Spinner />
          <p className="showcase-loading-text">
            {formatTextDirection(t("loading_products", "Loading products..."))}
          </p>
        </div>
      </div>
    );
  }
  // No products state
  if (validProducts.length === 0) {
    return (
      <div className={`product-showcase ${isRTL() ? 'rtl' : 'ltr'}`}>
        <h2 className="showcase-title">
          {formatTextDirection(title)}
        </h2>
        <div className="showcase-empty">
          <svg className="showcase-empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
          </svg>
          <p className="showcase-empty-text">{formatTextDirection(t("no_products_to_display", "No products to display."))}</p>
          <p className="showcase-empty-subtitle">{formatTextDirection(t("check_back_later", "Please check back later for our featured products."))}</p>
        </div>
      </div>
    );
  }  const getSlideTransform = () => {
    if (lang === "he") {
      return `translateX(${currentIndex * 100}%)`;
    }
    return `translateX(-${currentIndex * 100}%)`;
  };

  return (
    <div 
      className={`product-showcase ${isRTL() ? 'rtl' : 'ltr'}`}
      ref={showcaseRef}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onKeyDown={handleKeyDown}
      tabIndex="0"
      role="region"
      aria-label={title}
    >
      <h2 className="showcase-title">
        {formatTextDirection(title)}
      </h2>
      <>
        {/* Product Carousel */}
        <div 
          className="showcase-carousel"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          dir={isRTL() ? "rtl" : "ltr"}
        >
          <div
            className="showcase-slides"
            style={{ transform: getSlideTransform() }}
            aria-live="polite"
          >
            {validProducts.map((product, index) => { 
              
              const p = product; 
              const productName = typeof p.name === "object" ? (p.name[lang] || p.name.en) : p.name;
              const productDesc = typeof p.description === "object" ? (p.description[lang] || p.description.en) : p.description;
              
              const nameToDisplay = productName || t("product_name_unavailable", "Name unavailable");
              const descToDisplay = productDesc || t("product_description_unavailable", "Description unavailable");
              const priceToDisplay = p.price !== undefined ? p.price.toFixed(2) : t("price_unavailable", "N/A");
              // Prioritize imageUrl, then image, then null
              const imageToDisplay = p.imageUrl || p.image || null;
              const productId = p.id;
              const isActive = index === currentIndex;

              return (
                <div
                  key={productId || `product-slide-${index}`}
                  className={`showcase-slide ${isActive ? 'active' : 'inactive'}`}
                  onClick={() => {
                    if (!productId) return;
                    const navigateToName = typeof nameToDisplay === 'object' ? (nameToDisplay.en || Object.values(nameToDisplay)[0]) : nameToDisplay;
                    if (!navigateToName) {
                      console.error("Product name is missing for navigation in showcase:", p);
                      notify({
                        message: t("errors.productLinkError", "Cannot open product page, product name is missing."),
                        type: "error"
                      });
                      return;
                    }
                    navigate(`/product/${encodeURIComponent(navigateToName)}`);
                  }}
                  tabIndex={isActive ? 0 : -1}
                  role="group"
                  aria-label={`${t("showcase_for", "Showcase for")} ${nameToDisplay}`}
                  aria-hidden={!isActive}
                  dir={isRTL() ? "rtl" : "ltr"}
                >
                  <div className="showcase-image-container">
                    {imageToDisplay ? (
                      <img
                        src={imageToDisplay}
                        alt={nameToDisplay}
                        className="showcase-image"
                        loading="lazy"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = placeholderImage;
                        }}
                      />
                    ) : (
                      <img src={placeholderImage} alt={nameToDisplay} className="showcase-image" />
                    )}
                  </div>

                  <div className="showcase-content">
                    <h3 className="showcase-product-title">
                      {formatTextDirection(nameToDisplay)}
                    </h3>
                    <p className="showcase-product-description">
                      {formatTextDirection(descToDisplay)}
                    </p>
                    <div className="showcase-product-details">
                      <p className="showcase-price">
                        ₪{priceToDisplay}
                      </p>
                      {p.percent_off > 0 && (
                        <span className="showcase-badge discount">
                          {p.percent_off}% {formatTextDirection(t("off", "OFF"))}
                        </span>
                      )}
                      {p.inStock === false && (
                        <span className="showcase-badge out-of-stock">
                          {formatTextDirection(t("out_of_stock", "Out of Stock"))}
                        </span>
                      )}
                      {p.is_new && (
                        <span className="showcase-badge new">
                          {formatTextDirection(t("new", "NEW"))}
                        </span>
                      )}
                    </div>
                    
                    {/* Show Add to Cart button on mobile view */}
                    {isMobileView && (
                      <div style={{ marginTop: 'var(--spacing-3)' }}>
                        <button
                          className="showcase-badge"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(p);
                          }}
                          disabled={!p.id || p.inStock === false}
                          style={{ 
                            background: 'var(--color-brand-primary)',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          {formatTextDirection(t("add_to_cart"))}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Navigation controls */}
          <div className="showcase-controls">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                prevProduct();
              }}
              className="showcase-nav-btn"
              aria-label={t("previous_product")}
              disabled={validProducts.length <= 1}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
              </svg>
            </button>
            
            <div className="showcase-indicators">
              {validProducts.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`showcase-indicator ${index === currentIndex ? 'active' : ''}`}
                  aria-label={`${t("go_to_slide")} ${index + 1}`}
                />
              ))}
            </div>
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                nextProduct();
              }}
              className="showcase-nav-btn"
              aria-label={t("next_product")}
              disabled={validProducts.length <= 1}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Desktop Add to Cart Button */}
        <div className="mt-4 flex justify-end">
          {!isMobileView && (() => {
              const currentProductForButton = validProducts[currentIndex] || {}; 
              const cp = currentProductForButton;
              const currentProductName = typeof cp.name === "object" ? (cp.name[lang] || cp.name.en) : cp.name;
              const nameForButton = currentProductName || "";
              const isOutOfStock = cp.inStock === false;
              return (
                  <PrimaryButton
                    title={isOutOfStock 
                      ? t("out_of_stock")
                      : t("add_to_cart")}
                    ariaLabel={isOutOfStock
                      ? t("out_of_stock")
                      : `${t("add")} ${nameForButton} ${t("to_cart")}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (cp.id && !isOutOfStock) {
                         handleAddToCart(cp);
                      }
                    }}
                    disabled={!cp.id || isOutOfStock}
                    otherStyle={isOutOfStock ? "bg-gray-400 hover:bg-gray-400" : ""}
                  />
              );
          })()}
        </div>

        {/* Pagination dots */}        <div className={`flex justify-center items-center mt-6 ${lang === "he" ? "flex-row-reverse" : ""} space-x-3`}>          {/* Previous button (visible on mobile) */}
          <SecondaryButton
            title="‹"
            onClick={prevProduct}
            ariaLabel={t("previous_product")}
            otherStyle="px-3 py-1 text-lg md:hidden hover:bg-accent hover:text-white transition-colors duration-200"
          />
          
          {/* Dots */}
          <div className={`flex items-center ${lang === "he" ? "flex-row-reverse" : ""} p-1 gap-x-3`}>
            {validProducts.map((product, index) => { 
              const p_dot = product;
              const isCurrent = index === currentIndex;
              let productNameForDot = 'Product';
              if (p_dot && p_dot.name) {
                  if (typeof p_dot.name === "object") {
                      productNameForDot = p_dot.name[lang] || p_dot.name.en || 'Product';
                  } else {
                      productNameForDot = p_dot.name;
                  }
              }
              return (
                <PointButton
                  key={`dot-${p_dot.id}-${index}`}
                  onClick={() => goToSlide(index)}
                  current={isCurrent}
                  ariaLabel={
                    isCurrent
                      ? t("current_slide")
                      : `${t("go_to_slide")} ${index + 1} (${productNameForDot})`
                  }
                  slideNumber={index + 1}
                  productName={productNameForDot}
                  otherStyle="focus:outline-none focus:ring-2 focus:ring-accent-dark"
                />
              );
            })}
          </div>          {/* Next button (visible on mobile) */}
          <SecondaryButton
            title="›"
            onClick={nextProduct}
            ariaLabel={t("next_product")}
            otherStyle="px-3 py-1 text-lg md:hidden hover:bg-accent hover:text-white transition-colors duration-200"
          />
        </div>
      </>
    </div>
  );
});

// Set display name for debugging
ProductShowcase.displayName = 'ProductShowcase';

export default ProductShowcase;
