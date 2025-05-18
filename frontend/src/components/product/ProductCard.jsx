import { useNavigate } from "react-router-dom";
import PrimaryButton from "../buttons/PrimaryButton";
import { useGlobalProvider } from "../../context/GlobalProvider";
import { useTranslation } from "react-i18next";

const ProductCard = ({ product, otherStyle }) => {
  const navigate = useNavigate();
  const { addItemToCart } = useGlobalProvider();
  const { i18n } = useTranslation();
  const lang = i18n.language || "he";

  // Support both {en, he} object and plain string
  const displayName = typeof product.name === "object" ? (product.name[lang] || product.name.en) : product.name;
  const displayDesc = typeof product.description === "object" ? (product.description[lang] || product.description.en) : product.description;

  return (
    <div
      className={`bg-secondary border rounded-lg border-primary shadow-lg shadow-primary p-6 w-64 h-auto flex flex-col items-center hover:scale-105 hover:z-10 z-0 transition-all ${otherStyle}`}
      tabIndex={0}
      role="region"
      aria-label={`Product card for ${displayName}`}
    >
      {/* Clickable area for navigation */}
      <div
        className="w-full cursor-pointer"
        onClick={() => navigate(`/product/${displayName}`)}
        aria-label={`View details for ${displayName}`}
        tabIndex={0}
        role="button"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") navigate(`/product/${displayName}`);
        }}
      >
        <h2 className="text-accent font-semibold text-lg mb-3 text-center">
          {displayName}
        </h2>
        <div className="flex items-center justify-center w-full h-44 border border-gray-600 bg-gray-800 text-white rounded-lg overflow-hidden">
          {product?.image ? (
            <img
              src={product.image}
              alt={displayName}
              className="object-cover w-full h-full"
            />
          ) : (
            <span className="text-gray-400">No Image</span>
          )}
        </div>
        <p className="mt-3 text-white text-sm text-center leading-relaxed">
          {displayDesc}
        </p>
      </div>
      {/* Add to cart button is outside the clickable area */}
      <div className="flex items-center justify-between w-full mt-4">
        <p className="text-lg font-medium text-white">${product?.price}</p>
        <PrimaryButton
          title={lang === "he" ? "הוסף לעגלה" : "Add to cart"}
          ariaLabel={`${lang === "he" ? "הוסף" : "Add"} ${displayName} ${lang === "he" ? "לעגלה" : "to cart"}`}
          onClick={(e) => {
            e.stopPropagation();
            addItemToCart(product.id, 1, product);
          }}
        />
      </div>
    </div>
  );
};

export default ProductCard;
