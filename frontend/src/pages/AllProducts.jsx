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
  // Always use 0-200 for price range and filter
  const [priceRange, setPriceRange] = useState({ min: 0, max: 200 });
  const [filterPriceRange, setFilterPriceRange] = useState({ min: 0, max: 200 });
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const { i18n, t } = useTranslation();
  const lang = i18n.language || "he";

  useEffect(() => {
    fetchAllProducts();
    setPriceRange({ min: 0, max: 200 });
    setFilterPriceRange({ min: 0, max: 200 });
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    filterProducts();
    // eslint-disable-next-line
  }, [filterPriceRange, searchQuery, allProducts, lang, selectedCategories]);

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
        category: "Utility"
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
        category: "Cloud"
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
        category: "VPN"
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
        category: "Security"
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
        category: "Office"
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
        category: "Security"
      },
      {
        id: 7,
        name: { en: "Microsoft Office 365", he: "Microsoft Office 365" },
        description: {
          en: "Subscription to Microsoft Office applications.",
          he: "מנוי ליישומי Microsoft Office.",
        },
        image: "https://images.unsplash.com/photo-1600132806370-bf17e65e942f?auto=format&fit=crop&w=400&q=80",
        price: 69.99,
        category: "Microsoft"
      },
      {
        id: 8,
        name: { en: "Windows 11 Pro Key", he: "מפתח Windows 11 Pro" },
        description: {
          en: "Genuine license key for Windows 11 Professional.",
          he: "מפתח רישיון מקורי ל-Windows 11 Professional.",
        },
        image: "https://images.unsplash.com/photo-1611242320536-f12d3541249b?auto=format&fit=crop&w=400&q=80",
        price: 129.99,
        category: "Microsoft"
      }
    ];

    const productData = data && data.length > 0 ? data.map(p => ({...p, category: p.category || demoCategories[Math.floor(Math.random() * demoCategories.length)]})) : fallbackProducts;
    const prices = productData.map((item) => item.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    // Extract categories from products (assuming a 'category' field)
    // For fallback, I'll add some sample categories
    const uniqueCategories = [...new Set(productData.map(p => p.category).filter(Boolean))];
    // Add some default/demo categories if none are found or for fallback
    const demoCategories = ['Microsoft', 'VPN', 'Security', 'Office', 'Cloud', 'Utility'];
    setCategories(uniqueCategories.length > 0 ? uniqueCategories : demoCategories);

    setAllProducts(productData);
    setPriceRange({ min: minPrice, max: maxPrice });
    setFilterPriceRange({ min: minPrice, max: maxPrice });
    setFilteredProducts(productData);
    setLoading(false);
  };

  const filterProducts = () => {
    const filtered = allProducts.filter((product) => {
      const name = typeof product.name === "object" ? (product.name[lang] || product.name.en) : product.name;
      const description = typeof product.description === "object" ? (product.description[lang] || product.description.en) : product.description;
      const categoryMatch = selectedCategories.length === 0 || (product.category && selectedCategories.includes(product.category)) || 
                            selectedCategories.some(sc => name.toLowerCase().includes(sc.toLowerCase()) || description.toLowerCase().includes(sc.toLowerCase()));

      return (
        product.price >= filterPriceRange.min &&
        product.price <= filterPriceRange.max &&
        name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        categoryMatch
      );
    });
    setFilteredProducts(filtered);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category) 
        : [...prev, category]
    );
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
              {t("price_range")}: {lang === "he" ? `₪${filterPriceRange.max} - ₪${filterPriceRange.min}` : `₪${filterPriceRange.min} - ₪${filterPriceRange.max}`}
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

            <div className="mt-6">
              <h3 className="text-accent text-lg font-semibold mb-3">{t("categories")}</h3>
              <div className="flex flex-wrap gap-3">
                {categories.map((category) => (
                  <label key={category} className={`flex items-center px-4 py-2 rounded-full border border-gray-600 bg-gray-900 text-white cursor-pointer transition-all duration-150 hover:bg-accent hover:text-white shadow-sm ${selectedCategories.includes(category) ? 'bg-accent text-white border-accent shadow-lg scale-105' : 'opacity-90'}`}
                    style={{ minWidth: '110px', justifyContent: 'center', fontWeight: 500, fontSize: '1rem', letterSpacing: '0.02em' }}>
                    <input 
                      type="checkbox"
                      className="form-checkbox h-5 w-5 accent-accent mr-2"
                      checked={selectedCategories.includes(category)}
                      onChange={() => handleCategoryChange(category)}
                      style={{ accentColor: '#22c55e' }}
                    />
                    <span>{category}</span>
                  </label>
                ))}
              </div>
            </div>
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
