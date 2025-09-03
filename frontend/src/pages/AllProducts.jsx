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
import { isRTL, formatTextDirection, formatCurrency } from "../utils/language";
import "./AllProducts.css";

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
      <div className="filters-content">
        <h2 className="filters-title">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
          </svg>
          {t("filters")}
        </h2>
        
        <PrimaryInput
          type="search"
          title={t("search")}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("search_products_placeholder")}
          value={searchQuery}
          otherStyle="search-input"
          aria-label={t("search_products")}
        />
        
        <div className="price-range-section">
          <label
            className="price-range-label"
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
        
        <div className="categories-section">
          <h3 className="categories-title">
            {t("categories")}
          </h3>
          <div className="categories-grid">
            {categories.map((category) => (
              <label 
                key={category} 
                className={`category-checkbox ${selectedCategories.includes(category) ? 'selected' : ''}`}
              >
                <input 
                  type="checkbox"
                  className="sr-only"
                  checked={selectedCategories.includes(category)}
                  onChange={() => handleCategoryChange(category)}
                  aria-labelledby={`category-label-${category}`}
                />
                <span id={`category-label-${category}`}>{category}</span>
              </label>
            ))}
          </div>
        </div>
        
        <button
          onClick={clearFilters}
          className="clear-filters-btn"
          aria-label={t("clear_all_filters", "Clear all filters")}
        >
          {t("clear_filters", "Clear Filters")}
        </button>
      </div>
    );
  }, [t, searchQuery, setSearchQuery, filterPriceRange, setFilterPriceRange, categories, selectedCategories, handleCategoryChange, clearFilters, lang]);

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

      <div className={`all-products-container ${isRTL() ? 'rtl' : 'ltr'}`}>
        <div className="all-products-header">
          <h1 className="all-products-title" tabIndex={0}>
            {formatTextDirection(t("all_products"))}
          </h1>
        </div>

        <div className="all-products-main">
          {/* Filters - Mobile Toggle */}
          <div className="mobile-filters-toggle lg:hidden">
            <details>
              <summary className="mobile-filters-summary">
                <span>{formatTextDirection(t("filters"))}</span>
                <svg className={`w-5 h-5 ${isRTL() ? 'rtl-arrow' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="mobile-filters-content">
                {renderFilters()}
              </div>
            </details>
          </div>
          
          {/* Filters - Desktop */}
          <section
            className="filters-section hidden lg:block"
            aria-label={t("product_filters")}
          >
            {renderFilters()}
          </section>

          {/* Products */}
          <section className="products-section" aria-label={t("product_list")}>
            <div className="products-header">
              <h2 className="products-title">
                {t("new_products")}
              </h2>
              
              {/* Sort Dropdown */}
              <div className="flex items-center gap-2">
                <label htmlFor="sort-products" className="text-sm font-medium text-gray-700 hidden sm:block">
                  {t("sort_by", "Sort by:")}
                </label>
                <select 
                  id="sort-products"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="sort-select"
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
            
            {loading ? (
              <div className="loading-spinner">
                <Spinner />
                <p className="mt-4 text-gray-600" aria-live="polite">
                  {t("loading_products", "Loading products...")}
                </p>
              </div>
            ) : errorMsg ? (
              <div className="error-message">
                <p role="alert">
                  {errorMsg}
                </p>
                <PrimaryButton
                  title={t("try_again", "Try Again")}
                  onClick={fetchAllProducts}
                  otherStyle="mt-4"
                />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="no-products">
                <p aria-live="polite">
                  {t("no_products_found")}
                </p>
                <PrimaryButton
                  title={t("clear_filters", "Clear Filters")}
                  onClick={clearFilters}
                  otherStyle="mt-4"
                />
              </div>
            ) : (
              <div className="products-grid">
                {filteredProducts.map((product, idx) => (
                  <ProductCard
                    key={product.id || product._id || idx}
                    product={product}
                  />
                ))}
              </div>
            )}
            
            {/* Results count */}
            {!loading && !errorMsg && filteredProducts.length > 0 && (
              <p className="text-center text-gray-500 text-sm mt-6" aria-live="polite">
                {`${t("showing_prefix", "Showing")} ${filteredProducts.length} ${t("products_suffix", "products")}`}
              </p>
            )}
          </section>
        </div>
      </div>
    </>
  );
});

// Set display name for debugging
AllProducts.displayName = 'AllProducts';

export default AllProducts;