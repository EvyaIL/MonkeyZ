import { useState, useEffect, useRef, useMemo } from "react";
import SecondaryButton from "../buttons/SecondaryButton";
import PrimaryButton from "../buttons/PrimaryButton";
import PointButton from "../buttons/PointButton";
import { useNavigate } from "react-router-dom";
import { useGlobalProvider } from "../../context/GlobalProvider";
import { useTranslation } from "react-i18next";
import Spinner from "../Spinner";

const ProductShowcase = ({ products, title }) => {
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
      nextProduct();
    }
    
    if (isRightSwipe) {
      prevProduct();
    }
    
    // Reset states
    setTouchStart(0);
    setTouchEnd(0);
    
    // Resume auto-rotation after a short delay
    setTimeout(() => setIsPaused(false), 1000);
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === "ArrowLeft") {
      prevProduct();
      e.preventDefault();
    } else if (e.key === "ArrowRight") {
      nextProduct();
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
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md p-6 w-full max-w-6xl text-center text-gray-800 dark:text-white">
        <h2 className="text-center text-primary dark:text-accent font-bold text-2xl mb-6">
          {title}
        </h2>
        <div className="flex justify-center items-center h-[200px]">
          <Spinner />
        </div>
      </div>
    );
  }

  // No products state
  if (validProducts.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md p-6 w-full max-w-6xl text-center text-gray-800 dark:text-white">
        <h2 className="text-center text-primary dark:text-accent font-bold text-2xl mb-6">
          {title}
        </h2>
        <div className="py-8 flex flex-col items-center">
          <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
          </svg>
          <p className="text-lg">{t("no_products_to_display", "No products to display.")}</p>
          <p className="text-sm text-gray-500 mt-2">{t("check_back_later", "Please check back later for our featured products.")}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md p-4 md:p-6 w-full max-w-6xl overflow-hidden"
      ref={showcaseRef}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onKeyDown={handleKeyDown}
      tabIndex="0"
      role="region"
      aria-label={title}
    >
      <h2 className="text-center text-primary dark:text-accent font-bold text-2xl mb-6">
        {title}
      </h2>
      <>
        {/* Product Carousel */}
        <div 
          className="relative overflow-hidden h-[280px] md:h-[300px] mb-6"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="flex transition-transform duration-700 ease-in-out h-full"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            aria-live="polite"
          >
            {validProducts.map((product, index) => { 
              
              const p = product; 
              const productName = typeof p.name === "object" ? (p.name[lang] || p.name.en) : p.name;
              const productDesc = typeof p.description === "object" ? (p.description[lang] || p.description.en) : p.description;
              
              const nameToDisplay = productName || t("product_name_unavailable", "Name unavailable");
              const descToDisplay = productDesc || t("product_description_unavailable", "Description unavailable");
              const priceToDisplay = p.price !== undefined ? p.price.toFixed(2) : t("price_unavailable", "N/A");
              const imageUrl = p.image || null;
              const productId = p.id;
              const isActive = index === currentIndex;

              return (
                <div
                  key={productId || `product-slide-${index}`}
                  className={`min-w-full h-full flex flex-col md:flex-row gap-4 md:gap-6 items-center p-3 md:p-4 box-border transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-0'} cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/20 rounded-lg transition-colors`}
                  onClick={() => productId && navigate(`/product/${encodeURIComponent(productId)}`)}
                  tabIndex={isActive ? 0 : -1} // Only allow focus on current slide
                  role="group"
                  aria-label={`${t("showcase_for", "Showcase for")} ${nameToDisplay}`}
                  aria-hidden={!isActive}
                >
                  <div className="w-full md:w-1/2 h-[140px] md:h-full rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden shadow-sm transition-transform hover:scale-[1.02] duration-200">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={nameToDisplay}
                        className="object-contain w-full h-full p-2"
                        loading="lazy"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://via.placeholder.com/300x200?text=MonkeyZ";
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-4 text-center">
                        <svg className="w-10 h-10 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        <span className="text-gray-500 dark:text-white text-sm">{t("no_image_available", "No image available")}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 text-gray-800 dark:text-white p-2 md:p-0">
                    <h3 className="text-start text-accent font-bold text-lg md:text-xl mb-2">
                      {nameToDisplay}
                    </h3>
                    <p className="break-words text-sm md:text-base leading-relaxed line-clamp-3 md:line-clamp-4">
                      {descToDisplay}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <p className="text-lg font-semibold text-accent">
                        ₪{priceToDisplay}
                      </p>
                      {p.discountPercentage > 0 && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 text-xs font-semibold rounded">
                          {p.discountPercentage}% {t("off", "OFF")}
                        </span>
                      )}
                      {p.inStock === false && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 text-xs font-semibold rounded">
                          {t("out_of_stock", "Out of Stock")}
                        </span>
                      )}
                      {p.isNew && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-xs font-semibold rounded">
                          {t("new", "NEW")}
                        </span>
                      )}
                    </div>
                    
                    {/* Show Add to Cart button on mobile view */}
                    {isMobileView && (
                      <div className="mt-3">
                        <PrimaryButton
                          title={t("add_to_cart")}
                          ariaLabel={`${t("add")} ${nameToDisplay} ${t("to_cart")}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(p);
                          }}
                          disabled={!p.id || p.inStock === false}
                          otherStyle="text-sm py-1.5 px-3"
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Left/Right arrows for larger screens */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              prevProduct();
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-accent/80 hover:bg-accent text-white rounded-full p-2 hidden md:block transition-colors duration-200 shadow-md"
            aria-label={t("previous_product")}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              nextProduct();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-accent/80 hover:bg-accent text-white rounded-full p-2 hidden md:block transition-colors duration-200 shadow-md"
            aria-label={t("next_product")}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
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
                      ? lang === "he" ? "אזל מהמלאי" : t("out_of_stock") 
                      : lang === "he" ? "הוסף לעגלה" : t("add_to_cart")}
                    ariaLabel={isOutOfStock
                      ? lang === "he" ? "אזל מהמלאי" : t("out_of_stock")
                      : `${lang === "he" ? "הוסף" : t("add") } ${nameForButton} ${lang === "he" ? "לעגלה" : t("to_cart")}`}
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

        {/* Pagination dots */}
        <div className={`flex justify-center items-center mt-6 ${lang === "he" ? "flex-row-reverse" : ""} space-x-3`}>
          {/* Previous button (visible on mobile) */}
          <SecondaryButton
            title="‹"
            onClick={prevProduct}
            ariaLabel={lang === "he" ? "מוצר קודם" : t("previous_product")}
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
                      ? (lang === "he" ? "שקופית נוכחית" : t("current_slide"))
                      : (lang === "he" ? `עבור לשקופית ${index + 1} (${productNameForDot})` : `Go to slide ${index + 1} (${productNameForDot})`)
                  }
                  slideNumber={index + 1}
                  productName={productNameForDot}
                  otherStyle="focus:outline-none focus:ring-2 focus:ring-accent-dark"
                />
              );
            })}
          </div>
          
          {/* Next button (visible on mobile) */}
          <SecondaryButton
            title="›"
            onClick={nextProduct}
            ariaLabel={lang === "he" ? "מוצר הבא" : t("next_product")}
            otherStyle="px-3 py-1 text-lg md:hidden hover:bg-accent hover:text-white transition-colors duration-200"
          />
        </div>
      </>
    </div>
  );
};

export default ProductShowcase;
