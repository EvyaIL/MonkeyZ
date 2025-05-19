import { useState, useEffect, useRef, useMemo } from "react"; // Added useMemo
import SecondaryButton from "../buttons/SecondaryButton";
import PrimaryButton from "../buttons/PrimaryButton";
import PointButton from "../buttons/PointButton";
import { useNavigate } from "react-router-dom";
import { useGlobalProvider } from "../../context/GlobalProvider";
import { useTranslation } from "react-i18next";
import Spinner from "../Spinner";

const ProductShowcase = ({ products, title }) => {

  const validProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(p => p && typeof p === 'object' && p.id !== null && p.id !== undefined);
  }, [products]);

  const navigate = useNavigate();
  const { addItemToCart } = useGlobalProvider();
  const { i18n, t } = useTranslation();
  const lang = i18n.language || "he";

  const [currentIndex, setCurrentIndex] = useState(0);
  const timeoutRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const resetTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  useEffect(() => {
    if (products && Array.isArray(products) && !isLoaded) {
      setIsLoaded(true);
    }
    if (!products && isLoaded) {
        setIsLoaded(false);
        setCurrentIndex(0);
    }
  }, [products, isLoaded]);

  useEffect(() => {
    resetTimeout();
    if (isLoaded && validProducts && validProducts.length > 1) {
      timeoutRef.current = setTimeout(
        () =>
          setCurrentIndex((prevIndex) => (prevIndex + 1) % validProducts.length),
        5000
      );
    }
    return () => {
      resetTimeout();
    };
  }, [currentIndex, validProducts, isLoaded]);

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

  if (!isLoaded) {
    return (
      <div className="bg-secondary border border-gray-700 rounded-lg shadow-lg p-6 w-full max-w-6xl text-center text-white">
        <h2 className="text-center text-accent font-bold text-2xl mb-4">
          {title}
        </h2>
        <Spinner />
      </div>
    );
  }

  if (validProducts.length === 0) {
    return (
      <div className="bg-secondary border border-gray-700 rounded-lg shadow-lg p-6 w-full max-w-6xl text-center text-white">
        <h2 className="text-center text-accent font-bold text-2xl mb-4">
          {title}
        </h2>
        <p>{t("no_products_to_display")}</p>
      </div>
    );
  }

  return (
    <div className="bg-secondary border border-gray-700 rounded-lg shadow-lg p-6 w-full max-w-6xl overflow-hidden">
      <h2 className="text-center text-accent font-bold text-2xl mb-4">
        {title}
      </h2>
      <>
        <div className="relative overflow-hidden h-[300px] mb-4">
          <div
            className="flex transition-transform duration-700 ease-in-out h-full"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {validProducts.map((product, index) => { 
              
              const p = product; 
              const productName = typeof p.name === "object" ? (p.name[lang] || p.name.en) : p.name;
              const productDesc = typeof p.description === "object" ? (p.description[lang] || p.description.en) : p.description;
              
              const nameToDisplay = productName || t("product_name_unavailable", "Name unavailable");
              const descToDisplay = productDesc || t("product_description_unavailable", "Description unavailable");
              const priceToDisplay = p.price !== undefined ? p.price : t("price_unavailable", "N/A");
              const imageUrl = p.image || null;
              const productId = p.id;

              return (
                <div
                  key={productId || `product-slide-${index}`}
                  className="min-w-full h-full flex flex-col md:flex-row gap-6 items-center p-4 box-border"
                  onClick={() => productId && navigate(`/product/${productId}`)}
                  tabIndex={0}
                  role="group"
                  aria-label={`${t("showcase_for", "Showcase for")} ${nameToDisplay}`}
                >
                  <div className="w-full md:w-1/2 h-full rounded-lg border border-gray-600 bg-gray-800 flex items-center justify-center overflow-hidden">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={nameToDisplay}
                        className="object-contain w-full h-full"
                      />
                    ) : (
                      <span className="text-white text-lg">{t("no_image_available", "No image available")}</span>
                    )}
                  </div>

                  <div className="flex-1 text-white p-2 md:p-0">
                    <h3 className="text-start text-accent font-bold text-xl mb-2 md:mb-4">
                      {nameToDisplay}
                    </h3>
                    <p className="break-words text-base md:text-lg leading-relaxed line-clamp-3 md:line-clamp-4">
                      {descToDisplay}
                    </p>
                    <p className="text-lg font-semibold text-accent mt-2 md:mt-4">
                      ₪{priceToDisplay}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          {(() => {
              const currentProductForButton = validProducts[currentIndex] || {}; 
              const cp = currentProductForButton;
              const currentProductName = typeof cp.name === "object" ? (cp.name[lang] || cp.name.en) : cp.name;
              const nameForButton = currentProductName || "";
              return (
                  <PrimaryButton
                    title={lang === "he" ? "הוסף לעגלה" : t("add_to_cart")}
                    ariaLabel={`${lang === "he" ? "הוסף" : t("add") } ${nameForButton} ${lang === "he" ? "לעגלה" : t("to_cart")}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (cp.id) {
                         addItemToCart(cp.id, 1, cp);
                      }
                    }}
                    disabled={!cp.id}
                  />
              );
          })()}
        </div>

        <div className={`flex justify-center items-center mt-6 ${lang === "he" ? "flex-row-reverse" : ""} space-x-3`}>
          <SecondaryButton
            title="‹"
            onClick={prevProduct}
            ariaLabel={lang === "he" ? "מוצר קודם" : t("previous_product")}
            otherStyle="px-3 py-1 text-lg"
          />
          <div className={`flex items-center ${lang === "he" ? "flex-row-reverse" : ""} p-1 gap-x-2`}>
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
                      : (lang === "he" ? `${t("go_to_slide", {num: ""})} ${index + 1} (${productNameForDot})` : t("go_to_slide", { num: index + 1, context: productNameForDot }))
                  }
                  slideNumber={index + 1} // Pass slide number (1-based)
                  productName={product.name || 'Product'} // Pass product name for ARIA label
                  otherStyle="focus:outline-none focus:ring-2 focus:ring-accent-dark"
                />
              );
            })}
          </div>
          <SecondaryButton
            title="›"
            onClick={nextProduct}
            ariaLabel={lang === "he" ? "מוצר הבא" : t("next_product")}
            otherStyle="px-3 py-1 text-lg"
          />
        </div>
      </>
    </div>
  );
};

export default ProductShowcase;
