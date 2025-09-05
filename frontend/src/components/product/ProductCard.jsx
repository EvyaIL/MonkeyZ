import { useNavigate } from "react-router-dom";
import { useGlobalProvider } from "../../context/GlobalProvider";
import { useTranslation } from "react-i18next";
import LazyImage from '../LazyImage';
import { memo, useCallback, useMemo } from 'react';

const ProductCard = memo(({ product, otherStyle }) => {
  const navigate = useNavigate();
  const { addItemToCart, notify } = useGlobalProvider();
  const { t, i18n } = useTranslation();
  
  // Memoize language and display values to prevent unnecessary recalculations
  const lang = useMemo(() => i18n.language || "he", [i18n.language]);
  
  const displayData = useMemo(() => {
    const imageSource = product.imageUrl || product.image;
    const displayName = typeof product.name === "object" ? (product.name[lang] || product.name.en) : product.name;
    const displayDesc = typeof product.description === "object" ? (product.description[lang] || product.description.en) : product.description;
    
    return {
      imageSource,
      displayName,
      displayDesc: displayDesc?.length > 100 ? displayDesc.substring(0, 97) + "..." : displayDesc
    };
  }, [product, lang]);
  
  // Handle adding to cart with useCallback to prevent re-renders
  const handleAddToCart = useCallback((e) => {
    e.stopPropagation();
    
    // Ensure we have a valid product ID - handle both MongoDB _id and id formats
    const productId = product.id || product._id;
    if (!productId) {
      console.error("Cannot add to cart: Product missing ID", product);
      notify({
        message: t("errors.missingProductId", "Cannot add product to cart - missing ID"),
        type: "error"
      });
      return;
    }
    
    addItemToCart(productId, 1, product);
    
    // Show feedback animation (optional)
    const button = e.currentTarget;
    button.classList.add("scale-110");
    setTimeout(() => {
      button.classList.remove("scale-110");
    }, 200);

    notify({
      message: `${displayData.displayName} ${t("added_to_cart_suffix", "added to cart")}`,
      type: "success"
    });
  }, [product, displayData.displayName, addItemToCart, notify, t]);

  // Navigate to product details with useCallback
  const goToProductDetails = useCallback(() => {
    if (!displayData.displayName) {
      console.error("Product name is missing, cannot navigate:", product);
      notify({
        message: t("errors.productLinkError", "Cannot open product page, product name is missing."),
        type: "error"
      });
      return;
    }
    navigate(`/product/${encodeURIComponent(displayData.displayName)}`);
  }, [displayData.displayName, product, navigate, notify, t]);

  return (
    <div
      className={`bg-white dark:bg-dark-secondary border border-accent/20 dark:border-dark-border rounded-xl shadow-sm dark:shadow-lg p-4 w-full flex flex-col transition-all duration-300 hover:shadow-md hover:border-accent/40 dark:hover:border-dark-accent group ${otherStyle}`}
      tabIndex={0}
      role="region"
      aria-label={`Product card for ${displayData.displayName}`}
    >
      <div
        className="w-full cursor-pointer flex flex-col flex-grow"
        onClick={goToProductDetails}
        tabIndex={0}
        role="button"
        aria-label={`View details for ${displayData.displayName}`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            goToProductDetails();
          }
        }}
  >        <div className="w-full aspect-[4/3] relative rounded-lg overflow-hidden mb-4 bg-accent/5 dark:bg-dark-primary border border-accent/10 dark:border-dark-border group-hover:border-accent/30 dark:group-hover:border-dark-accent transition-colors duration-300">
          <LazyImage
            src={displayData.imageSource}
            alt={displayData.displayName}
            className="group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            threshold={0.1}
          />
          
          {/* Tags Container - Top Right */}
          <div className="absolute top-2 right-2 flex flex-col items-end gap-1.5 z-10">
            {product.is_new && (
              <span className="bg-emerald-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-md">
                {t("new", "NEW")}
              </span>
            )}
            {product.percent_off > 0 && (
              <span className="bg-rose-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-md">
                {product.percent_off}% {t("off", "OFF")}
              </span>
            )}
          </div>

          {/* Price Tag - Top Left */}
          <div className="absolute top-2 left-2 bg-accent text-white px-2 py-1 rounded-md font-semibold shadow-md text-sm" dir={lang === "he" ? "rtl" : "ltr"}>
            ₪{product.price.toFixed(2)}
          </div>
        </div>

  <h3 className={`font-semibold text-lg text-gray-900 dark:text-dark-text-primary text-${lang === "he" ? "right" : "left"} group-hover:text-accent dark:group-hover:text-dark-accent transition-colors duration-300`}>{displayData.displayName}</h3>
  <p className={`text-accent/70 dark:text-dark-text-secondary text-sm mt-2 line-clamp-3 flex-grow text-${lang === "he" ? "right" : "left"}`}>
          {displayData.displayDesc}
        </p>
      </div>

      <div className={`mt-4 w-full flex ${lang === "he" ? "flex-row-reverse" : ""} justify-between gap-2`}>
        <button
          className="flex-1 bg-accent/5 dark:bg-dark-tertiary text-accent dark:text-dark-text-primary border border-accent/30 dark:border-dark-border py-2 px-3 rounded-md hover:bg-accent/10 dark:hover:bg-dark-secondary transition-all duration-200 font-medium"
          onClick={goToProductDetails}
          aria-label={`View details for ${displayData.displayName}`}
        >
          {t("details")}
        </button>
        <button
          className="flex-1 bg-accent dark:bg-dark-accent text-white py-2 px-3 rounded-md hover:bg-accent/80 dark:hover:bg-dark-accent-light transition-all duration-200 font-medium shadow-sm"
          onClick={handleAddToCart}
          aria-label={`Add ${displayData.displayName} to cart`}
        >
          {t("add_to_cart")}
        </button>
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;
