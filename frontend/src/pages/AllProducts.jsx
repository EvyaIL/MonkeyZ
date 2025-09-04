import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ProductCard from "../components/product/ProductCard";
import { apiService } from "../lib/apiService";
import PrimaryButton from "../components/buttons/PrimaryButton";
import RangeInput from "../components/inputs/RangeInput";
import PrimaryInput from "../components/inputs/PrimaryInput";
import Spinner from "../components/Spinner";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";

const AllProducts = React.memo(() => {
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

  // Memoized sort options to prevent recreation on every render
  const sortOptions = useMemo(() => [
    { value: "featured", label: t("sort_featured", "Featured") },
    { value: "price-asc", label: t("sort_price_low_to_high", "Price: Low to High") },
    { value: "price-desc", label: t("sort_price_high_to_low", "Price: High to Low") },
    { value: "name-asc", label: t("sort_name_a_to_z", "Name: A to Z") },
    { value: "name-desc", label: t("sort_name_z_to_a", "Name: Z to A") },
  ], [t]);

  // Memoized system categories for performance
  const systemCategories = useMemo(() => [
    'Microsoft', 'VPN', 'Security', 'Office', 'Cloud', 'Utility', 'Multimedia'
  ], []);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update URL when filters change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateUrlParams();
    }, 500); // Wait 500ms after filter changes before updating URL
    
    return () => clearTimeout(timeoutId);
  }, [filterPriceRange, searchQuery, selectedCategories, sortOrder, updateUrlParams]);

  // Update document title
  useEffect(() => {
    document.title = t("all_products") + " | MonkeyZ";
  }, [t, lang]);  const fetchAllProducts = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const { data, error } = await apiService.get("/product/all");
      if (error) {
        setErrorMsg(t("failed_to_load_products", "Failed to load products. Please try again later."));
        setLoading(false);
        processProductData([]);
        return;
      }
      if (data && data.length > 0) {
        // Do not assign demo categories; use only real categories from the database
        processProductData(data);
      } else {
        processProductData([]);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      setErrorMsg(t("failed_to_load_products", "Failed to load products. Please try again later."));
      processProductData([]);
    }
    setLoading(false);
  };

  const processProductData = useCallback((productData) => {
    const uniqueCategories = [...new Set(productData.map(p => p.category).filter(Boolean))];
    
    // Combine existing categories with system categories without duplicates
    const allCategories = [...new Set([...uniqueCategories, ...systemCategories])];
    
    setCategories(allCategories);
    setAllProducts(productData);
    
    // Initialize filtered products
    setFilteredProducts(productData);
    setLoading(false);
  }, [systemCategories]);

  // Memoized filtering logic for better performance
  const filteredAndSortedProducts = useMemo(() => {
    if (!allProducts || !Array.isArray(allProducts)) return [];
    
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
    return [...filtered].sort((a, b) => {
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
  }, [allProducts, lang, selectedCategories, filterPriceRange, searchQuery, sortOrder]);

  // Update filtered products when memoized value changes
  useEffect(() => {
    setFilteredProducts(filteredAndSortedProducts);
  }, [filteredAndSortedProducts]);

  const handleCategoryChange = useCallback((category) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category) 
        : [...prev, category]
    );
  }, []);

  const clearFilters = useCallback(() => {
    setFilterPriceRange({ min: 0, max: 200 });
    setSearchQuery("");
    setSelectedCategories([]);
    setSortOrder("featured");
  }, []);

  // Render filters component
  const renderFilters = useCallback(() => {
    return (
      <>
        <h2 className="text-accent text-xl font-semibold mb-4">{t("filters")}</h2>
          <PrimaryInput
          type="search"
          title={t("search")}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("search_products_placeholder")}
          value={searchQuery}
          otherStyle="mb-6"
          aria-label={t("search_products")}
        />
        
        <div className="mb-6">          <label
            className="block text-gray-900 dark:text-white text-sm font-medium mb-2"
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
                className={`flex items-center justify-center px-4 py-2.5 rounded-lg border-2 transition-all duration-200 cursor-pointer group hover:shadow-xl focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-white dark:focus-within:ring-offset-gray-800 focus-within:ring-accent ${selectedCategories.includes(category) ? 'bg-accent border-accent text-white shadow-lg hover:bg-accent-dark transform scale-105' : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-200 hover:border-accent hover:text-accent hover:bg-gray-200 dark:hover:bg-gray-700/50'}`}
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
          <div className="pt-4 border-t border-gray-300 dark:border-gray-700">          <PrimaryButton
            title={t("clear_filters", "Clear Filters")}
          onClick={clearFilters}
          otherStyle="w-full bg-gray-600 dark:bg-gray-600 hover:bg-gray-700 dark:hover:bg-gray-500 text-white border border-gray-500 dark:border-gray-500"
          ariaLabel={t("clear_all_filters", "Clear all filters")}
        />
      </div>
    </>
  );
  }, [t, searchQuery, setSearchQuery, filterPriceRange, setFilterPriceRange, categories, selectedCategories, handleCategoryChange, clearFilters]);

  // Removed unused getDemoCategories function

  return (
    <>
      <Helmet>
        <title>MonkeyZ - {t("all_products")}</title>
        <meta name="description" content={t("all_products_meta_description") || "Browse all MonkeyZ products. Find the best digital products and services for your needs."} />
        <meta property="og:title" content={`MonkeyZ - ${t("all_products")}`} />
        <meta property="og:description" content={t("all_products_meta_description") || "Browse all MonkeyZ products. Find the best digital products and services for your needs."} />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={window.location.href.split('?')[0]} />
      </Helmet>
      
      {/* Header Section */}
      <section className="bg-gradient-hero text-white py-16 px-6">
        <div className="container mx-auto max-w-7xl text-center">
          <h1 className="text-4xl lg:text-5xl font-bold mb-4" tabIndex={0}>
            {t("all_products", "All Products")}
          </h1>
          <p className="text-xl opacity-90">
            {t("products_subtitle", "Discover our complete collection of premium digital products")}
          </p>
        </div>
      </section>

      <div className="bg-gradient-surface min-h-screen py-12">
        <div className="container mx-auto max-w-7xl px-6">
          
          {/* Mobile Filters Toggle */}
          <div className="lg:hidden mb-6">
            <details className="card-modern">
              <summary className="text-brand-primary font-semibold p-4 cursor-pointer flex items-center justify-between">
                <span className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                  {t("filters", "Filters")}
                </span>
                <svg className="w-5 h-5 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="p-6 border-t border-gray-100">
                {renderFilters()}
              </div>
            </details>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Desktop Filters Sidebar */}
            <aside className="hidden lg:block w-80 flex-shrink-0" aria-label={t("product_filters")}>
              <div className="card-modern p-6 sticky top-6">
                <div className="flex items-center mb-6">
                  <svg className="w-6 h-6 text-brand-primary mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                  <h2 className="text-2xl font-bold text-text-primary">{t("filters", "Filters")}</h2>
                </div>
                {renderFilters()}
              </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1" aria-label={t("product_list")}>
              {/* Sort Bar */}
              <div className="card-modern p-4 mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-text-primary mb-1">
                      {t("new_products", "Latest Products")}
                    </h2>
                    {!loading && !errorMsg && filteredProducts.length > 0 && (
                      <p className="text-text-secondary">
                        {`${filteredProducts.length} ${t("products_found", "products found")}`}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <label htmlFor="sort-products" className="text-text-secondary font-medium whitespace-nowrap">
                      {t("sort_by", "Sort by:")}
                    </label>
                    <select 
                      id="sort-products"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                      className="bg-white border border-gray-200 text-text-primary rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all duration-200 min-w-[160px]"
                      aria-label={t("sort_products", "Sort products")}
                    >
                      {sortOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Products Grid */}
              {loading ? (
                <div className="card-modern p-12 text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mb-4"></div>
                  <p className="text-text-secondary text-lg" aria-live="polite">
                    {t("loading_products", "Loading amazing products...")}
                  </p>
                </div>
              ) : errorMsg ? (
                <div className="error-state-modern max-w-lg mx-auto">
                  <div className="text-5xl mb-4">😅</div>
                  <h3 className="text-2xl font-bold text-red-700 mb-2">{t("something_went_wrong", "Something went wrong")}</h3>
                  <p className="text-red-600 mb-6">{errorMsg}</p>
                  <PrimaryButton
                    title={t("try_again", "Try Again")}
                    onClick={fetchAllProducts}
                  />
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="card-modern p-12 text-center">
                  <div className="text-6xl mb-6">🔍</div>
                  <h3 className="text-2xl font-bold text-text-primary mb-4">
                    {t("no_products_found", "No products found")}
                  </h3>
                  <p className="text-text-secondary text-lg mb-8">
                    {t("try_adjusting_filters", "Try adjusting your filters or search terms")}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <PrimaryButton
                      title={t("clear_filters", "Clear All Filters")}
                      onClick={clearFilters}
                    />
                    <button 
                      onClick={() => window.location.href = '/contact'}
                      className="border-2 border-brand-primary text-brand-primary px-6 py-3 rounded-xl hover:bg-brand-primary hover:text-white transition-all duration-300"
                    >
                      {t("request_product", "Request a Product")}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((product, idx) => (
                    <ProductCard
                      key={product.id || product._id || idx}
                      product={product}
                    />
                  ))}
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </>
  );
});

// Set display name for debugging
AllProducts.displayName = 'AllProducts';

export default AllProducts;