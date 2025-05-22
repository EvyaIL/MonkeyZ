import { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ProductCard from "../components/product/ProductCard";
import { apiService } from "../lib/apiService";
import PrimaryButton from "../components/buttons/PrimaryButton";
import RangeInput from "../components/inputs/RangeInput";
import PrimaryInput from "../components/inputs/PrimaryInput";
import Spinner from "../components/Spinner";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet";

const AllProducts = () => {
  const { search } = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(search);
  
  // Get query parameters
  const initialCategory = queryParams.get("category") || "";
  const initialSearch = queryParams.get("search") || "";
  const initialMinPrice = parseInt(queryParams.get("min_price")) || 0;
  const initialMaxPrice = parseInt(queryParams.get("max_price")) || 200;

  // States for price range, ensuring they start at initial values
  const [priceRange, setPriceRange] = useState({ min: 0, max: 200 });
  const [filterPriceRange, setFilterPriceRange] = useState({ 
    min: initialMinPrice, 
    max: initialMaxPrice || 200
  });
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState(
    initialCategory ? [initialCategory] : []
  );
  const [sortOrder, setSortOrder] = useState("featured"); // featured, price-asc, price-desc, name-asc, name-desc
  const { i18n, t } = useTranslation();
  const lang = i18n.language || "he";

  // Update URL when filters change
  const updateUrlParams = useCallback(() => {
    const params = new URLSearchParams();
    
    if (searchQuery) params.set("search", searchQuery);
    if (selectedCategories.length === 1) params.set("category", selectedCategories[0]);
    if (filterPriceRange.min > 0) params.set("min_price", filterPriceRange.min.toString());
    if (filterPriceRange.max < 200) params.set("max_price", filterPriceRange.max.toString());
    if (sortOrder !== "featured") params.set("sort", sortOrder);
    
    navigate({ search: params.toString() }, { replace: true });
  }, [navigate, searchQuery, selectedCategories, filterPriceRange, sortOrder]);

  useEffect(() => {
    // Set initial price range to 0-200 and fetch products
    setPriceRange({ min: 0, max: 200 });
    fetchAllProducts();
    // eslint-disable-next-line
  }, []);

  // Update URL when filters change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateUrlParams();
    }, 500); // Wait 500ms after filter changes before updating URL
    
    return () => clearTimeout(timeoutId);
  }, [filterPriceRange, searchQuery, selectedCategories, sortOrder, updateUrlParams]);

  // Filter products when dependencies change
  useEffect(() => {
    filterProducts();
    // eslint-disable-next-line
  }, [filterPriceRange, searchQuery, allProducts, lang, selectedCategories, sortOrder]);

  // Update document title
  useEffect(() => {
    document.title = t("all_products") + " | MonkeyZ";
  }, [t, lang]);

  const fetchAllProducts = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const { data, error } = await apiService.get("/product/all");      if (error) {
        setErrorMsg(t("failed_to_load_products", "Failed to load products. Please try again later."));
        setLoading(false);
        loadFallbackProducts();
        return;
      }

      // If we got data from API, use it
      if (data && data.length > 0) {
        // Ensure products have categories
        const productsWithCategories = data.map(p => ({
          ...p, 
          category: p.category || getDemoCategories()[Math.floor(Math.random() * getDemoCategories().length)]
        }));
        
        processProductData(productsWithCategories);
      } else {
        // Use fallback data if API returned empty
        loadFallbackProducts();
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      setErrorMsg(t("failed_to_load_products", "Failed to load products. Please try again later."));
      loadFallbackProducts();
    }
  };
  const loadFallbackProducts = () => {
    processProductData(getFallbackProducts());
    setLoading(false);
  };

  const processProductData = (productData) => {
    const uniqueCategories = [...new Set(productData.map(p => p.category).filter(Boolean))];
    const demoCategories = getDemoCategories();
    
    setCategories(uniqueCategories.length > 0 ? uniqueCategories : demoCategories);
    setAllProducts(productData);
    
    // Initialize filtered products
    setFilteredProducts(productData);
    setLoading(false);
  };

  const filterProducts = () => {
    if (!allProducts || !Array.isArray(allProducts)) return;
    
    const filtered = allProducts.filter((product) => {
      const name = typeof product.name === "object" ? (product.name[lang] || product.name.en) : product.name;
      const description = typeof product.description === "object" ? (product.description[lang] || product.description.en) : product.description;
      
      const categoryMatch = selectedCategories.length === 0 || 
                           (product.category && selectedCategories.includes(product.category)) || 
                           selectedCategories.some(sc => 
                             name?.toLowerCase().includes(sc.toLowerCase()) || 
                             description?.toLowerCase().includes(sc.toLowerCase())
                           );

      const priceMatch = 
        product.price >= filterPriceRange.min &&
        product.price <= filterPriceRange.max;
        
      const searchMatch = !searchQuery || 
        name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        description?.toLowerCase().includes(searchQuery.toLowerCase());

      return priceMatch && searchMatch && categoryMatch;
    });

    // Sort filtered products
    const sortedFiltered = [...filtered].sort((a, b) => {
      const nameA = typeof a.name === "object" ? (a.name[lang] || a.name.en) : a.name;
      const nameB = typeof b.name === "object" ? (b.name[lang] || b.name.en) : b.name;
      
      switch(sortOrder) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'name-asc':
          return nameA.localeCompare(nameB);
        case 'name-desc':
          return nameB.localeCompare(nameA);
        case 'featured':
        default:
          return 0; // Keep original order for featured
      }
    });
    
    setFilteredProducts(sortedFiltered);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category) 
        : [...prev, category]
    );
  };

  const clearFilters = () => {
    setFilterPriceRange({ min: 0, max: 200 });
    setSearchQuery("");
    setSelectedCategories([]);
    setSortOrder("featured");
  };

  // Get translated sort options based on current language
  const getSortOptions = () => {
    return [
      { value: "featured", label: t("sort_featured", "Featured") },
      { value: "price-asc", label: t("sort_price_low_to_high", "Price: Low to High") },
      { value: "price-desc", label: t("sort_price_high_to_low", "Price: High to Low") },
      { value: "name-asc", label: t("sort_name_a_to_z", "Name: A to Z") },
      { value: "name-desc", label: t("sort_name_z_to_a", "Name: Z to A") },
    ];
  };

  const getDemoCategories = () => ['Microsoft', 'VPN', 'Security', 'Office', 'Cloud', 'Utility', 'Multimedia'];

  const getFallbackProducts = () => [
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
    },
    {
      id: 9,
      name: { en: "Adobe Creative Cloud", he: "Adobe Creative Cloud" },
      description: {
        en: "Access to all Adobe Creative Cloud apps and services.",
        he: "גישה לכל אפליקציות ושירותי Adobe Creative Cloud.",
      },
      image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=400&q=80",
      price: 54.99,
      category: "Multimedia"
    },
    {
      id: 10,
      name: { en: "MonkeyZ Premium Support", he: "תמיכה פרימיום של MonkeyZ" },
      description: {
        en: "Priority customer support and technical assistance.",
        he: "תמיכת לקוחות בעדיפות גבוהה וסיוע טכני.",
      },
      image: "https://images.unsplash.com/photo-1560438718-eb61ede255eb?auto=format&fit=crop&w=400&q=80",
      price: 19.99,
      category: "Support"
    }
  ];

  return (
    <>
      <Helmet>
        <title>MonkeyZ - {t("all_products")}</title>
        <meta name="description" content={t("all_products_meta_description") || "Browse all MonkeyZ products. Find the best digital products and services for your needs."} />
        <meta property="og:title" content={`MonkeyZ - ${t("all_products")}`} />
        <meta property="og:description" content={t("all_products_meta_description") || "Browse all MonkeyZ products. Find the best digital products and services for your needs."} />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={window.location.href.split('?')[0]} />
      </Helmet>      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <h1 className="text-accent font-bold text-2xl md:text-3xl mb-4 md:mb-6" tabIndex={0}>
          {t("all_products")}
        </h1>

        <div className="bg-white dark:bg-gray-800 border border-accent/30 dark:border-accent/30 rounded-lg shadow-lg p-4 md:p-6 w-full max-w-7xl flex flex-col lg:flex-row gap-6 backdrop-blur-sm">
          {/* Filters - Mobile Toggle */}
          <div className="lg:hidden w-full mb-4">
            <details className="bg-gray-800 rounded-lg">
              <summary className="text-accent font-semibold p-4 cursor-pointer flex items-center justify-between">
                <span>{t("filters")}</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="p-4 border-t border-gray-700">
                {/* Filter Content - Mobile */}
                {renderFilters()}
              </div>
            </details>
          </div>
          
          {/* Filters - Desktop */}
          <section
            className="hidden lg:block w-full lg:w-1/4 bg-gray-800 p-4 rounded-lg sticky top-4 self-start"
            aria-label={t("product_filters")}
          >
            {renderFilters()}
          </section>

          {/* Products */}
          <section className="w-full lg:w-3/4" aria-label={t("product_list")}>
            <div className="flex flex-wrap justify-between items-center mb-6">
              <h2 className="text-accent font-bold text-xl mb-2 md:mb-0">
                {t("new_products")}
              </h2>
              
              {/* Sort Dropdown */}
              <div className="flex items-center">
                <label htmlFor="sort-products" className="mr-2 text-white text-sm hidden sm:block">
                  {t("sort_by", "Sort by:")}
                </label>
                <select 
                  id="sort-products"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:ring-accent focus:border-accent text-sm"
                  aria-label={t("sort_products", "Sort products")}
                >
                  {getSortOptions().map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {loading ? (
              <div className="flex flex-col items-center justify-center p-8">
                <Spinner />
                <p className="text-white text-center mt-4" aria-live="polite">
                  {t("loading_products", "Loading products...")}
                </p>
              </div>
            ) : errorMsg ? (
              <div className="text-center p-8">
                <p className="text-red-500 text-lg mb-4" role="alert">
                  {errorMsg}
                </p>
                <PrimaryButton
                  title={t("try_again", "Try Again")}
                  onClick={fetchAllProducts}
                />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center p-8 bg-gray-800 rounded-lg">
                <p className="text-gray-400 text-lg mb-4" aria-live="polite">
                  {t("no_products_found")}
                </p>
                <PrimaryButton
                  title={t("clear_filters", "Clear Filters")}
                  onClick={clearFilters}
                  otherStyle="mt-2"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 md:gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                  />
                ))}
              </div>
            )}
            
            {/* Results count */}
            {!loading && !errorMsg && filteredProducts.length > 0 && (
              <p className="text-gray-400 text-sm mt-4 text-center" aria-live="polite">
                {`${t("showing_prefix", "Showing")} ${filteredProducts.length} ${t("products_suffix", "products")}`}
              </p>
            )}
          </section>
        </div>
      </div>
    </>
  );
  
  function renderFilters() {
    return (
      <>
        <h2 className="text-accent text-xl font-semibold mb-4">{t("filters")}</h2>
        
        <PrimaryInput
          type="search"
          title={t("search")}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("search_products_placeholder")}
          value={searchQuery}
          otherStyle="bg-gray-900 mb-6"
          aria-label={t("search_products")}
        />
        
        <div className="mb-6">
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
        </div>
        
        <div className="mb-6">
          <h3 className="text-accent text-lg font-semibold mb-4">{t("categories")}</h3>
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <label 
                key={category} 
                className={`flex items-center justify-center px-4 py-2.5 rounded-lg border-2 transition-all duration-200 cursor-pointer group hover:shadow-xl focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-800 focus-within:ring-accent ${selectedCategories.includes(category) ? 'bg-accent border-accent text-white shadow-lg hover:bg-accent-dark transform scale-105' : 'bg-gray-700 border-gray-600 text-gray-200 hover:border-accent hover:text-accent hover:bg-gray-700/50'}`}
                style={{ minWidth: '100px' }}
              >
                <input 
                  type="checkbox"
                  className="sr-only"
                  checked={selectedCategories.includes(category)}
                  onChange={() => handleCategoryChange(category)}
                  aria-labelledby={`category-label-${category}`}
                />
                <span id={`category-label-${category}`} className="font-medium text-sm select-none">{category}</span>
              </label>
            ))}
          </div>
        </div>
        
        <div className="pt-4 border-t border-gray-700">
          <PrimaryButton
            title={t("clear_filters", "Clear Filters")}
            onClick={clearFilters}
            otherStyle="w-full bg-gray-700 hover:bg-gray-600"
            ariaLabel={t("clear_all_filters", "Clear all filters")}
          />
        </div>
      </>
    );
  }
};

export default AllProducts;
