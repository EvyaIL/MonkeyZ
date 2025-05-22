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
    navigate(`/product/${encodeURIComponent(product.id)}`);
  };

  return (
    <div
      className={`bg-secondary border rounded-lg border-gray-700 shadow-lg p-4 w-full flex flex-col transition-all duration-300 hover:shadow-xl ${otherStyle}`}
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
        <div className="w-full aspect-[4/3] relative rounded-md overflow-hidden mb-4 bg-gray-800">
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-pulse w-8 h-8 rounded-full bg-accent/50"></div>
            </div>
          )}
          
          <img
            src={product.image || placeholderImage}
            alt={displayName}
            loading="lazy"
            className={`w-full h-full object-contain transition-opacity duration-300 ${
              imageLoaded && !imageError ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              setImageError(true);
              e.target.src = placeholderImage;
              setImageLoaded(true);
            }}
          />
          
          <div className="absolute top-2 right-2 bg-accent text-white px-2 py-1 rounded-md font-semibold shadow-md" dir={lang === "he" ? "rtl" : "ltr"}>
            ₪{product.price.toFixed(2)}
          </div>
        </div>

        <h3 className={`font-semibold text-lg text-white text-${lang === "he" ? "right" : "left"}`}>{displayName}</h3>
        <p className={`text-gray-300 text-sm mt-2 line-clamp-3 flex-grow text-${lang === "he" ? "right" : "left"}`}>
          {displayDesc?.length > 100 ? displayDesc.substring(0, 97) + "..." : displayDesc}
        </p>
      </div>

      <div className={`mt-4 w-full flex ${lang === "he" ? "flex-row-reverse" : ""} justify-between gap-2`}>
        <button
          className="flex-1 bg-secondary text-white border border-accent py-2 px-3 rounded-md hover:bg-secondary/80 transition-all duration-200"
          onClick={goToProductDetails}
          aria-label={`View details for ${displayName}`}
        >
          {t("details")}
        </button>
        <button
          className="flex-1 bg-accent text-white py-2 px-3 rounded-md hover:bg-accent/80 transition-all duration-200"
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
