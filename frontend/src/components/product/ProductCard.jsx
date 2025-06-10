import { useNavigate } from "react-router-dom";
import { useGlobalProvider } from "../../context/GlobalProvider";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import placeholderImage from '../../assets/placeholder-product.svg';

const ProductCard = ({ product, otherStyle }) => {
  const navigate = useNavigate();
  const { addItemToCart, notify } = useGlobalProvider();
  const { t, i18n } = useTranslation();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const lang = i18n.language || "he";

  // Support both {en, he} object and plain string
  const displayName = typeof product.name === "object" ? (product.name[lang] || product.name.en) : product.name;
  const displayDesc = typeof product.description === "object" ? (product.description[lang] || product.description.en) : product.description;

  // Handle adding to cart
  const handleAddToCart = (e) => {
    e.stopPropagation();
    addItemToCart(product.id, 1, product);
    
    // Show feedback animation (optional)
    const button = e.currentTarget;
    button.classList.add("scale-110");
    setTimeout(() => {
      button.classList.remove("scale-110");
    }, 200);

    notify({
      message: `${displayName} ${t("added_to_cart_suffix", "added to cart")}`,
      type: "success"
    });
  };

  // Navigate to product details
  const goToProductDetails = () => {
    // Ensure we're using a string version of the name
    const nameToUse = typeof product.name === "object" 
      ? (product.name[lang] || product.name.en || "") 
      : product.name || "";
    navigate(`/product/${encodeURIComponent(nameToUse)}`);
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 border border-accent/30 dark:border-accent/30 rounded-lg shadow-lg p-4 w-full flex flex-col transition-all duration-300 hover:shadow-xl backdrop-blur-sm group ${otherStyle}`}
      tabIndex={0}
      role="region"
      aria-label={`Product card for ${displayName}`}
    >
      <div
        className="w-full cursor-pointer flex flex-col flex-grow"
        onClick={goToProductDetails}
        tabIndex={0}
        role="button"
        aria-label={`View details for ${displayName}`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            goToProductDetails();
          }
        }}
      >
        <div className="w-full aspect-[4/3] relative rounded-lg overflow-hidden mb-4 bg-accent/5 dark:bg-gray-900 border border-accent/10 dark:border-accent/10 group-hover:border-accent/30 transition-colors duration-300">
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-pulse w-8 h-8 rounded-full bg-accent/50"></div>
            </div>
          )}
          
          <img
            src={product.image || placeholderImage}
            alt={displayName}
            loading="lazy"
            className={`w-full h-full object-contain transition-all duration-300 ${
              imageLoaded && !imageError ? "opacity-100 scale-100" : "opacity-0 scale-95"
            } group-hover:scale-105`}
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              setImageError(true);
              e.target.src = placeholderImage;
              setImageLoaded(true);
            }}
          />
          
          {/* Tags Container */}
          <div className="absolute top-2 right-2 flex flex-col items-end gap-1 z-10">
            {product.is_new && (
              <span className="px-2 py-0.5 bg-green-500 text-white text-[10px] font-semibold rounded-full shadow-md">
                {t("new", "NEW")}
              </span>
            )}
            {product.percent_off > 0 && (
              <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-semibold rounded-full shadow-md">
                {product.percent_off}% {t("off", "OFF")}
              </span>
            )}
          </div>

          {/* Price Tag - moved to top-left */}
          <div className="absolute top-2 left-2 bg-accent text-white px-2 py-1 rounded-md font-semibold shadow-md text-sm" dir={lang === "he" ? "rtl" : "ltr"}>
            ₪{product.price.toFixed(2)}
          </div>
        </div>

        <h3 className={`font-semibold text-lg text-gray-900 dark:text-white text-${lang === "he" ? "right" : "left"} group-hover:text-accent transition-colors duration-300`}>{displayName}</h3>        <p className={`text-accent/70 dark:text-gray-300 text-sm mt-2 line-clamp-3 flex-grow text-${lang === "he" ? "right" : "left"}`}>
          {displayDesc?.length > 100 ? displayDesc.substring(0, 97) + "..." : displayDesc}
        </p>
      </div>

      <div className={`mt-4 w-full flex ${lang === "he" ? "flex-row-reverse" : ""} justify-between gap-2`}>
        <button
          className="flex-1 bg-accent/5 dark:bg-gray-700 text-accent dark:text-white border border-accent/30 py-2 px-3 rounded-md hover:bg-accent/10 dark:hover:bg-gray-600 transition-all duration-200 font-medium"
          onClick={goToProductDetails}
          aria-label={`View details for ${displayName}`}
        >
          {t("details")}
        </button>
        <button
          className="flex-1 bg-accent text-white py-2 px-3 rounded-md hover:bg-accent/80 transition-all duration-200 font-medium shadow-sm"
          onClick={handleAddToCart}
          aria-label={`Add ${displayName} to cart`}
        >
          {t("add_to_cart")}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
