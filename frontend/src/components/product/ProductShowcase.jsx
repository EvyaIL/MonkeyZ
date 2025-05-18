import { useState } from "react";
import SecondaryButton from "../buttons/SecondaryButton";
import PrimaryButton from "../buttons/PrimaryButton";
import PointButton from "../buttons/PointButton";
import { useNavigate } from "react-router-dom";
import { useGlobalProvider } from "../../context/GlobalProvider";
import { useTranslation } from "react-i18next";

const ProductShowcase = ({ products, title }) => {
  const navigate = useNavigate();
  const { addItemToCart } = useGlobalProvider();
  const { i18n, t } = useTranslation();
  const lang = i18n.language || "he";

  const [currentIndex, setCurrentIndex] = useState(0);

  const nextProduct = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % products.length);
  };

  const prevProduct = () => {
    setCurrentIndex(
      (prevIndex) => (prevIndex - 1 + products.length) % products.length,
    );
  };

  const currentProduct = products[currentIndex] || {};
  const displayName = typeof currentProduct.name === "object" ? (currentProduct.name[lang] || currentProduct.name.en) : currentProduct.name;
  const displayDesc = typeof currentProduct.description === "object" ? (currentProduct.description[lang] || currentProduct.description.en) : currentProduct.description;

  return (
    <div className="bg-secondary border border-gray-700 rounded-lg shadow-lg p-6 w-full max-w-6xl overflow-hidden">
      <h2 className="text-center text-accent font-bold text-2xl mb-4">
        {title}
      </h2>

      <div className="relative overflow-hidden h-[300px]">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {products.map((product, index) => {
            const name = typeof product.name === "object" ? (product.name[lang] || product.name.en) : product.name;
            const desc = typeof product.description === "object" ? (product.description[lang] || product.description.en) : product.description;
            return (
              <div
                key={product.id || index}
                className="min-w-full flex flex-col md:flex-row gap-6 items-start p-4 cursor-pointer"
                onClick={() => navigate(`/product/${name}`)}
                tabIndex={0}
                role="group"
                aria-label={`Showcase for ${name}`}
              >
                <div className="w-full md:w-1/2 min-h-[250px] rounded-lg border border-gray-600 bg-gray-800 flex items-center justify-center">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={name}
                      className="object-cover w-full h-full rounded-lg"
                    />
                  ) : (
                    <span className="text-white text-lg">No Image</span>
                  )}
                </div>

                <div className="flex-1 text-white">
                  <h2 className="text-start text-accent font-bold text-xl mb-4">
                    {name}
                  </h2>
                  <p className="break-words text-lg leading-relaxed">
                    {desc}
                  </p>
                  <p className="text-lg font-semibold text-accent mt-4">
                    ₪{product.price}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <PrimaryButton
          title={lang === "he" ? "הוסף לעגלה" : t("add_to_cart")}
          ariaLabel={`${lang === "he" ? "הוסף" : t("add") } ${displayName} ${lang === "he" ? "לעגלה" : t("to_cart")}`}
          onClick={(e) => {
            e.stopPropagation();
            addItemToCart(currentProduct.id, 1, currentProduct);
          }}
        />
      </div>

      <div className={`flex justify-center items-center mt-6 ${lang === "he" ? "flex-row-reverse space-x-reverse" : ""} space-x-2`}>
        <SecondaryButton
          title="<"
          onClick={prevProduct}
          ariaLabel={lang === "he" ? "מוצר קודם" : t("previous_product")}
        />
        <div className={`flex ${lang === "he" ? "flex-row-reverse space-x-reverse" : "space-x-2"}`}>
          {products.map((_, index) => (
            <PointButton
              key={index}
              onClick={() => setCurrentIndex(index)}
              current={index === currentIndex}
              ariaLabel={
                index === currentIndex
                  ? (lang === "he" ? "שקופית נוכחית" : t("current_slide"))
                  : (lang === "he" ? `עבור לשקופית ${index + 1}` : t("go_to_slide", { num: index + 1 }))
              }
            />
          ))}
        </div>
        <SecondaryButton
          title=">"
          onClick={nextProduct}
          ariaLabel={lang === "he" ? "מוצר הבא" : t("next_product")}
        />
      </div>
    </div>
  );
};

export default ProductShowcase;
