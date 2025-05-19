import { useNavigate } from "react-router-dom";
// import PrimaryButton from "../buttons/PrimaryButton"; // Unused
import { useGlobalProvider } from "../../context/GlobalProvider";
import { useTranslation } from "react-i18next";
import { useState } from "react";

const ProductCard = ({ product, otherStyle }) => {
  const navigate = useNavigate();
  const { addItemToCart } = useGlobalProvider();
  const { t, i18n } = useTranslation();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
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
  };

  // Navigate to product details
  const goToProductDetails = () => {
    navigate(`/product/${encodeURIComponent(product.id)}`);
  };

  return (
    <div
      className={`bg-secondary border rounded-lg border-gray-200 dark:border-gray-700 shadow-lg p-4 w-full flex flex-col transition-all duration-300 card-hover-effect ${otherStyle}`}
      tabIndex={0}
      role="region"
      aria-label={`Product card for ${displayName}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Clickable area for navigation */}
      <div
        className="w-full cursor-pointer flex flex-col flex-grow"
        onClick={goToProductDetails}
        tabIndex={0}
        role="button"
        aria-label={`View details for ${displayName}`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") goToProductDetails();
        }}
      >
        {/* Image container with aspect ratio & loading states */}
        <div className="w-full aspect-[4/3] relative rounded-md overflow-hidden mb-4 bg-gray-100 dark:bg-gray-800">
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-pulse w-8 h-8 rounded-full bg-accent/50"></div>
            </div>
          )}
          
          <img
            src={product.image}
            alt={displayName}
            loading="lazy"
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              imageLoaded && !imageError ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              setImageError(true);
              e.target.src = "https://via.placeholder.com/300x200?text=MonkeyZ+Product";
              setImageLoaded(true);
            }}
          />
          
          {/* Price tag */}
          <div className="absolute top-2 right-2 bg-accent text-white px-2 py-1 rounded-md font-semibold shadow-md">
            ₪{product.price.toFixed(2)}
          </div>
        </div>

        {/* Product info */}
        <h3 className="font-semibold text-lg text-gray-800 dark:text-white transition-colors duration-300">{displayName}</h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm mt-2 line-clamp-3 flex-grow">
          {displayDesc?.length > 100 ? displayDesc.substring(0, 97) + "..." : displayDesc}
        </p>
      </div>

      {/* Action buttons */}
      <div className="mt-4 w-full flex justify-between gap-2">
        <button
          className="flex-1 bg-white dark:bg-secondary text-primary dark:text-white border border-primary dark:border-accent py-2 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-secondary/80 transition-all duration-200"
          onClick={goToProductDetails}
          aria-label={`View details for ${displayName}`}
        >
          {t("details")}
        </button>
        <button
          className={`flex-1 bg-primary dark:bg-accent text-white py-2 px-3 rounded-md hover:bg-primary/90 dark:hover:bg-accent/80 transition-all duration-200 ${isHovered ? 'animate-pulse-custom' : ''}`}
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
