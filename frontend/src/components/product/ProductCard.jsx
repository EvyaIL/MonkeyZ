import { useNavigate } from "react-router-dom";
import PrimaryButton from "../buttons/PrimaryButton";
import { useGlobalProvider } from "../../context/GlobalProvider";

const ProductCard = ({ product, otherStyle }) => {
<<<<<<< Updated upstream
    const navigate = useNavigate();
    const { addItemToCart } = useGlobalProvider();
    const isOutOfStock = product?.stock < 1; 
=======
  const navigate = useNavigate();
  const { addItemToCart } = useGlobalProvider();
  const { t, i18n } = useTranslation();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const lang = i18n.language || "he";
>>>>>>> Stashed changes

    return (
        <div 
            className={`relative bg-secondary border rounded-lg border-primary shadow-lg shadow-primary p-6 w-64 h-auto flex flex-col items-center transition-all 
                ${isOutOfStock ? "opacity-50 cursor-not-allowed" : "hover:scale-105 hover:z-10 z-0 cursor-pointer"}  
                ${otherStyle}`}
            onClick={() => !isOutOfStock && navigate(`/product/${product?.name}`)}
        >
            {isOutOfStock && (
                <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-lg">
                    Out of Stock
                </div>
            )}

            <h2 className="text-accent font-semibold text-lg mb-3 text-center">{product?.name}</h2>

<<<<<<< Updated upstream
            <div className={` flex  items-center justify-center w-full h-44 border border-gray-600 bg-gray-800 text-white rounded-lg  ${!product.image?.data && product.image == "" &&"animate-pulse"}`}>
                {product.image ? (
                    <img src={product?.image?.data} alt={product?.image?.filename} className="object-cover w-full h-full rounded-lg" />
                ) : (
                    <span className="text-white text-lg ">Image</span>
                )}
            </div>

            <p className="mt-3 text-white text-sm text-center leading-relaxed">
                {product?.description}
            </p>

            <div className="flex items-center justify-between w-full mt-4">
                <p className="text-lg font-medium text-white">${product?.price}</p>
                <PrimaryButton 
                    title={isOutOfStock ? "Out of Stock" : "Add to Cart"} 
                    onClick={(e) => {
                        e.stopPropagation();
                        addItemToCart(product.id, 1, product);
                    }} 
                    disabled={isOutOfStock}
                />
=======
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
>>>>>>> Stashed changes
            </div>
        </div>
<<<<<<< Updated upstream
    );
=======

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
>>>>>>> Stashed changes
};

export default ProductCard;
