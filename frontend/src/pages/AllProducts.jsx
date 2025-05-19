import { useEffect, useState } from "react";
import ProductCard from "../components/product/ProductCard";
import { apiService } from "../lib/apiService";
import PrimaryButton from "../components/buttons/PrimaryButton";
import RangeInput from "../components/inputs/RangeInput";
import PrimaryInput from "../components/inputs/PrimaryInput";
import Spinner from "../components/Spinner";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet";

const AllProducts = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 0 });
  const [filterPriceRange, setFilterPriceRange] = useState({ min: 0, max: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const { i18n, t } = useTranslation();
  const lang = i18n.language || "he";

  useEffect(() => {
    fetchAllProducts();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    filterProducts();
    // eslint-disable-next-line
  }, [filterPriceRange, searchQuery, allProducts, lang]);

  useEffect(() => {
    document.title = t("all_products");
  }, [t, lang]);

  const fetchAllProducts = async () => {
    setLoading(true);
    setErrorMsg("");
    const { data, error } = await apiService.get("/product/all");

    if (error) {
      setErrorMsg(lang === "he" ? "טעינת המוצרים נכשלה. נסו שוב מאוחר יותר." : "Failed to load products. Please try again later.");
      setLoading(false);
      return;
    }

    // Fallback: If no products from API, use demo data
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

    const productData = data && data.length > 0 ? data : fallbackProducts;
    const prices = productData.map((item) => item.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    setAllProducts(productData);
    setPriceRange({ min: minPrice, max: maxPrice });
    setFilterPriceRange({ min: minPrice, max: maxPrice });
    setFilteredProducts(productData);
    setLoading(false);
  };

  const filterProducts = () => {
    const filtered = allProducts.filter((product) => {
      const name = typeof product.name === "object" ? (product.name[lang] || product.name.en) : product.name;
      return (
        product.price >= filterPriceRange.min &&
        product.price <= filterPriceRange.max &&
        name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
    setFilteredProducts(filtered);
  };

  return (
    <>
      <Helmet>
        <title>MonkeyZ - {t("all_products")}</title>
        <meta name="description" content={t("all_products_meta_description") || "Browse all MonkeyZ products. Find the best digital products and services for your needs."} />
        <meta property="og:title" content="MonkeyZ - {t('all_products')}" />
        <meta property="og:description" content={t("all_products_meta_description") || "Browse all MonkeyZ products. Find the best digital products and services for your needs."} />
      </Helmet>
      <div className="bg-primary min-h-screen flex flex-col items-center p-6">
        <h1 className="text-accent font-bold text-3xl mb-6" tabIndex={0}>
          {t("all_products")}
        </h1>

        <div className="bg-secondary border border-gray-700 rounded-lg shadow-lg p-6 w-full max-w-7xl flex flex-col md:flex-row gap-6">
          {/* Filters */}
          <section
            className="w-full md:w-1/4 bg-gray-800 p-4 rounded-lg"
            aria-label={t("product_filters")}
          >
            <h2 className="text-accent text-xl font-semibold mb-4">{t("filters")}</h2>
            <label
              className="block text-white text-sm font-medium mb-2"
              htmlFor="price-range"
            >
              {t("price_range")}: ₪{filterPriceRange.min} - ₪{filterPriceRange.max}
            </label>
            {priceRange.max > 0 && (
              <RangeInput
                id="price-range"
                min={priceRange.min}
                max={priceRange.max}
                value={filterPriceRange}
                onChange={setFilterPriceRange}
              />
            )}
            <PrimaryInput
              type="search"
              title={t("search")}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("search_products_placeholder")}
              value={searchQuery}
              otherStyle="bg-gray-900 mt-4"
              aria-label={t("search_products")}
            />
          </section>

          {/* Products */}
          <section className="w-full" aria-label={t("product_list")}> 
            <h2 className="text-center text-accent font-bold text-2xl mb-4">
              {t("new_products")}
            </h2>
            {loading ? (
              <Spinner />
            ) : errorMsg ? (
              <p className="text-red-500 text-center" role="alert">
                {errorMsg}
              </p>
            ) : filteredProducts.length === 0 ? (
              <p className="text-gray-400 text-center" aria-live="polite">
                {t("no_products_found")}
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    otherStyle="xl:scale-90"
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
};

export default AllProducts;
