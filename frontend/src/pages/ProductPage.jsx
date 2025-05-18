import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiService } from "../lib/apiService";
import PrimaryButton from "../components/buttons/PrimaryButton";
import PrimaryInput from "../components/inputs/PrimaryInput";
import { useGlobalProvider } from "../context/GlobalProvider";
import { useTranslation } from "react-i18next";

const ProductPage = () => {
  const { name } = useParams();
  const { addItemToCart } = useGlobalProvider();
  const { i18n, t } = useTranslation();
  const lang = i18n.language || "he";

  const [product, setProduct] = useState({
    id: null,
    name: "",
    description: "",
    image: "",
    price: 0,
  });
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (name) {
      fetchProduct();
    }
    // eslint-disable-next-line
  }, [name]);

  const fetchProduct = async () => {
    setLoading(true);
    setErrorMsg("");
    // Try API first
    try {
      const { data, error } = await apiService.get(`/product/${name}`);
      if (data) {
        setProduct(data);
        setLoading(false);
        return;
      }
      // If not found in API, try fallback
      const fallbackProducts = [
        {
          id: 1,
          name: { en: "MonkeyZ Pro Key", he: "מפתח פרו של MonkeyZ" },
          description: {
            en: "Unlock premium features with the MonkeyZ Pro Key. Perfect for power users and businesses.",
            he: "פתחו תכונות פרימיום עם מפתח הפרו של MonkeyZ. מושלם למשתמשים מתקדמים ולעסקים.",
          },
          image: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80",
          price: 49.99,
        },
        {
          id: 2,
          name: { en: "MonkeyZ Cloud Storage", he: "אחסון ענן של MonkeyZ" },
          description: {
            en: "Secure, fast, and reliable cloud storage for all your important files.",
            he: "אחסון ענן מאובטח, מהיר ואמין לכל הקבצים החשובים שלך.",
          },
          image: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80",
          price: 19.99,
        },
        {
          id: 3,
          name: { en: "MonkeyZ VPN", he: "VPN של MonkeyZ" },
          description: {
            en: "Browse safely and anonymously with our high-speed VPN service.",
            he: "גלשו בבטחה ובאנונימיות עם שירות ה-VPN המהיר שלנו.",
          },
          image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80",
          price: 9.99,
        },
        {
          id: 4,
          name: { en: "MonkeyZ Antivirus", he: "אנטי וירוס של MonkeyZ" },
          description: {
            en: "Protect your devices from malware and viruses with real-time protection.",
            he: "הגנו על המכשירים שלכם מתוכנות זדוניות ווירוסים עם הגנה בזמן אמת.",
          },
          image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80",
          price: 14.99,
        },
        {
          id: 5,
          name: { en: "MonkeyZ Office Suite", he: "חבילת אופיס של MonkeyZ" },
          description: {
            en: "All-in-one office suite for productivity and collaboration.",
            he: "חבילת אופיס כוללת לכלי פרודוקטיביות ושיתוף פעולה.",
          },
          image: "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=400&q=80",
          price: 29.99,
        },
        {
          id: 6,
          name: { en: "MonkeyZ Password Manager", he: "מנהל סיסמאות של MonkeyZ" },
          description: {
            en: "Keep your passwords safe and secure with our easy-to-use manager.",
            he: "שמרו על הסיסמאות שלכם בטוחות ומאובטחות עם מנהל הסיסמאות הידידותי שלנו.",
          },
          image: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=400&q=80",
          price: 7.99,
        },
        {
          id: 7,
          name: { en: "MonkeyZ Photo Editor", he: "עורך תמונות של MonkeyZ" },
          description: {
            en: "Edit your photos like a pro with advanced tools and filters.",
            he: "ערכו את התמונות שלכם כמו מקצוענים עם כלים ופילטרים מתקדמים.",
          },
          image: "https://images.unsplash.com/photo-1465101178521-c1a9136a3b99?auto=format&fit=crop&w=400&q=80",
          price: 12.99,
        },
        {
          id: 8,
          name: { en: "MonkeyZ Music Studio", he: "אולפן מוזיקה של MonkeyZ" },
          description: {
            en: "Create, mix, and share your music with our powerful studio suite.",
            he: "צרו, ערכו ושתפו מוזיקה עם חבילת האולפן העוצמתית שלנו.",
          },
          image: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80",
          price: 24.99,
        },
      ];
      const fallback = fallbackProducts.find(
        (p) => {
          const n = typeof p.name === "object" ? (p.name[lang] || p.name.en) : p.name;
          return n.toLowerCase() === name.toLowerCase();
        }
      );
      if (fallback) {
        setProduct(fallback);
      } else {
        setErrorMsg(lang === "he" ? "המוצר לא נמצא." : "Product not found.");
      }
    } catch (err) {
      setErrorMsg(lang === "he" ? "אירעה שגיאה בלתי צפויה." : "Unexpected error occurred.");
    }
    setLoading(false);
  };

  const handleAddToCart = () => {
    if (!product.id) return;
    addItemToCart(product.id, quantity, product);
    setQuantity(1);
  };

  // Support both {en, he} object and plain string
  const displayName = typeof product.name === "object" ? (product.name[lang] || product.name.en) : product.name;
  const displayDesc = typeof product.description === "object" ? (product.description[lang] || product.description.en) : product.description;

  return (
    <div className="bg-primary p-9 flex flex-col items-center justify-center min-h-screen">
      <div className="bg-secondary border border-gray-700 rounded-lg shadow-lg p-6 w-full max-w-6xl mt-5">
        {loading ? (
          <p className="text-white text-center" aria-live="polite">
            {lang === "he" ? "טוען מוצר..." : "Loading product..."}
          </p>
        ) : errorMsg ? (
          <p className="text-red-500 text-center" role="alert">
            {errorMsg}
          </p>
        ) : (
          <>
            <h2
              className="text-center text-accent font-bold text-2xl mb-4"
              tabIndex={0}
            >
              {displayName || t("product_name")}
            </h2>

            <div className="flex flex-col md:flex-row gap-6 items-start p-4">
              <div className="w-full md:w-1/2 min-h-[250px] rounded-lg border border-gray-600 bg-gray-800 flex items-center justify-center">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={displayName || t("product_image")}
                    className="object-cover w-full h-full rounded-lg"
                  />
                ) : (
                  <span className="text-white text-lg">{lang === "he" ? "אין תמונה זמינה" : "No Image Available"}</span>
                )}
              </div>

              <div className="flex-1 text-white">
                <h2 className="text-start text-accent font-bold text-xl mb-4">
                  {displayName}
                </h2>
                <p className="text-lg leading-relaxed">
                  {displayDesc || (lang === "he" ? "אין תיאור זמין." : "No description available.")}
                </p>
                <p className="text-lg font-semibold text-accent mt-4">
                  ₪{product.price?.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="mt-4 flex justify-end items-center">
              <PrimaryInput
                type="number"
                min={1}
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                }
                otherStyle="w-20 mx-3 bg-gray-900 text-center h-10"
                aria-label={lang === "he" ? "כמות" : "Quantity"}
              />

              <PrimaryButton
                title={lang === "he" ? "הוסף לעגלה" : "Add to Cart"}
                otherStyle="h-11"
                onClick={handleAddToCart}
                disabled={!product.id}
                aria-label={lang === "he" ? "הוסף לעגלה" : "Add to cart"}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProductPage;
