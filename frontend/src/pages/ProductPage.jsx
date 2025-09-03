import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { apiService } from "../lib/apiService";
import { useGlobalProvider } from "../context/GlobalProvider";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import Spinner from "../components/Spinner";
import ProductCard from "../components/product/ProductCard";
import { generateProductSchema, addStructuredData } from "../lib/seo-helper";
import { isRTL, formatTextDirection, formatCurrency } from "../utils/language";
import { 
  ShoppingCartIcon, 
  HeartIcon, 
  ShieldCheckIcon,
  TruckIcon,
  ClockIcon,
  StarIcon,
  ChevronRightIcon,
  PhotoIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  CubeIcon,
  TagIcon,
  ShareIcon,
  EyeIcon
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon, StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";
import "./ProductPage.css";

const ProductPage = () => {
  const { productIdentifier } = useParams();
  const { addItemToCart, notify } = useGlobalProvider();
  const { i18n, t } = useTranslation();
  const lang = i18n.language || "he";

  const [product, setProduct] = useState({
    id: null,
    name: "",
    description: "",
    image: "",
    price: 0,
    category: "",
  });
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingRelated, setLoadingRelated] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [addedToCart, setAddedToCart] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  // Memoize display values
  const displayName = useMemo(() => {
    return typeof product.name === "object" ? (product.name[lang] || product.name.en) : product.name;
  }, [product.name, lang]);

  const displayDesc = useMemo(() => {
    return typeof product.description === "object" ? (product.description[lang] || product.description.en) : product.description;
  }, [product.description, lang]);

  const displayCategory = product.category || "";
  const formattedPrice = product.price ? product.price.toFixed(2) : "0.00";

  // Fetch product data
  const fetchProduct = useCallback(async () => {
    setLoading(true);
    setErrorMsg("");

    if (!productIdentifier) {
      setErrorMsg(t("invalid_product_url", "Invalid product URL"));
      setLoading(false);
      return;
    }

    const { data, error } = await apiService.get(`/product/${productIdentifier}`);
    if (error) {
      console.error("Failed to fetch product:", error);
      setErrorMsg(error.message || t("failed_to_load_product", "Failed to load product"));
    } else if (!data) {
      setErrorMsg(t("product_not_found", "Product not found"));
    } else {
      setProduct(data);
    }
    setLoading(false);
  }, [productIdentifier, t]);

  // Fetch related products
  const fetchRelatedProducts = useCallback(async () => {
    const productId = product.id || product._id;
    const category = product.category;
    if (!productId) return;

    setLoadingRelated(true);
    
    // Try to fetch related products by product ID first
    let { data, error } = await apiService.get(`/product/related/${productId}`);
    
    // If no related endpoint or no results, fetch by category as fallback
    if (error || !data || !Array.isArray(data) || data.length === 0) {
      if (category) {
        const categoryResult = await apiService.get(`/product/category/${encodeURIComponent(category)}`);
        if (!categoryResult.error && categoryResult.data && Array.isArray(categoryResult.data)) {
          // Filter out the current product and limit to 4
          data = categoryResult.data
            .filter(p => (p.id || p._id) !== productId)
            .slice(0, 4);
        }
      }
      
      // If still no results, fetch latest products as final fallback
      if (!data || data.length === 0) {
        const latestResult = await apiService.get('/product/homepage', { limit: 4 });
        if (!latestResult.error && latestResult.data && Array.isArray(latestResult.data)) {
          data = latestResult.data
            .filter(p => (p.id || p._id) !== productId)
            .slice(0, 4);
        }
      }
    }
    
    if (data && Array.isArray(data)) {
      setRelatedProducts(data.slice(0, 4));
    } else {
      setRelatedProducts([]);
    }
    
    setLoadingRelated(false);
  }, [product]);

  useEffect(() => {
    fetchProduct();
    // Scroll to top when product changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [fetchProduct]);

  useEffect(() => {
    const productId = product?.id || product?._id;
    if (product && productId) {
      fetchRelatedProducts();
    }
  }, [product, fetchRelatedProducts]);

  // Add structured data when product data changes
  useEffect(() => {
    const productId = product?.id || product?._id;
    if (product && productId) {
      const productData = {
        ...product,
        name: displayName,
        description: displayDesc,
        imageUrl: product.imageUrl || product.image,
        inStock: true
      };
      
      const schema = generateProductSchema(productData);
      addStructuredData(schema);
    }
  }, [product, displayName, displayDesc]);

  const handleAddToCart = useCallback(() => {
    const productId = product.id || product._id;
    if (!productId) {
      console.error("Cannot add to cart: Product missing ID", product);
      notify({
        message: t("errors.missingProductId", "Cannot add product to cart - missing ID"),
        type: "error"
      });
      return;
    }
    
    addItemToCart(productId, quantity, product);
    setAddedToCart(true);
    notify({
      message: `${displayName} ${t("added_to_cart_suffix", "added to cart")}`,
      type: "success"
    });
    
    setTimeout(() => setAddedToCart(false), 2000);
  }, [product, quantity, displayName, t, addItemToCart, notify]);

  return (
    <>
      <Helmet>
        <title>{displayName || t("product")} | MonkeyZ</title>
        <meta name="description" content={displayDesc || t("premium_digital_products")} />
        <meta name="keywords" content={`${displayName}, ${displayCategory}, MonkeyZ, digital products`} />
        <link rel="canonical" href={`https://monkeyz.co.il/product/${productIdentifier}`} />
        
        <meta property="og:title" content={`${displayName} | MonkeyZ`} />
        <meta property="og:description" content={displayDesc || t("premium_digital_products")} />
        <meta property="og:type" content="product" />
        <meta property="og:url" content={`https://monkeyz.co.il/product/${productIdentifier}`} />
        {(product.imageUrl || product.image) && <meta property="og:image" content={product.imageUrl || product.image} />}
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${displayName} | MonkeyZ`} />
        <meta name="twitter:description" content={displayDesc || t("premium_digital_products")} />
        {(product.imageUrl || product.image) && <meta name="twitter:image" content={product.imageUrl || product.image} />}
      </Helmet>

      <div className="modern-product-container">
        <div className="modern-product-content">
          {loading ? (
            <div className="modern-loading-container">
              <div className="modern-loading-card">
                <div className="loading-spinner">
                  <div className="spinner-ring"></div>
                </div>
                <p className="loading-text">
                  {formatTextDirection(t("loading_product", "Loading product..."))}
                </p>
              </div>
            </div>
          ) : errorMsg ? (
            <div className="modern-error-container">
              <div className="modern-error-card">
                <div className="error-icon-wrapper">
                  <PhotoIcon className="h-16 w-16 text-gray-400" />
                </div>
                <h3 className="error-title">{formatTextDirection(t("product_not_found", "Product Not Found"))}</h3>
                <p className="error-message">{formatTextDirection(errorMsg)}</p>
                <Link to="/products" className="modern-error-link">
                  <ChevronRightIcon className="h-5 w-5" />
                  {formatTextDirection(t("browse_products", "Browse Products"))}
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Breadcrumb */}
              <nav className="modern-breadcrumb" aria-label="Breadcrumb">
                <div className="breadcrumb-container">
                  <Link to="/" className="breadcrumb-link">
                    {formatTextDirection(t("home"))}
                  </Link>
                  <ChevronRightIcon className="h-4 w-4 breadcrumb-separator" />
                  <Link to="/products" className="breadcrumb-link">
                    {formatTextDirection(t("all_products"))}
                  </Link>
                  {displayCategory && (
                    <>
                      <ChevronRightIcon className="h-4 w-4 breadcrumb-separator" />
                      <Link 
                        to={`/products?category=${displayCategory}`} 
                        className="breadcrumb-link"
                      >
                        {formatTextDirection(displayCategory)}
                      </Link>
                    </>
                  )}
                  <ChevronRightIcon className="h-4 w-4 breadcrumb-separator" />
                  <span className="breadcrumb-current">{formatTextDirection(displayName || t("product_name"))}</span>
                </div>
              </nav>

              {/* Product Main Content */}
              <main className="modern-product-main">
                <div className="product-grid-modern">
                  
                  {/* Image Section */}
                  <div className="modern-product-image-section">
                    <div className="image-container">
                      {(product.imageUrl || product.image) ? (
                        <div className="image-wrapper">
                          <img
                            src={product.imageUrl || product.image}
                            alt={displayName || t("product_image")}
                            className="modern-product-image"
                            loading="lazy"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              const placeholder = document.createElement('div');
                              placeholder.className = 'modern-image-placeholder';
                              placeholder.innerHTML = `
                                <div class="placeholder-content">
                                  <svg class="h-16 w-16 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                                  </svg>
                                  <span>${formatTextDirection(t("image_not_available", "Image not available"))}</span>
                                </div>
                              `;
                              e.target.parentElement.appendChild(placeholder);
                            }}
                          />
                          <div className="image-overlay">
                            <button className="zoom-button" title={t("view_larger", "View Larger")}>
                              <EyeIcon className="h-6 w-6" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="modern-image-placeholder">
                          <div className="placeholder-content">
                            <PhotoIcon className="h-16 w-16 text-gray-400" />
                            <span>{formatTextDirection(t("no_image_available", "No Image Available"))}</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Enhanced Badges */}
                      <div className="product-badges">
                        {product.is_new && (
                          <div className="product-badge new-badge">
                            <div className="badge-shine"></div>
                            {formatTextDirection(t("new", "NEW"))}
                          </div>
                        )}
                        
                        {product.percent_off > 0 && (
                          <div className="product-badge discount-badge">
                            <div className="badge-shine"></div>
                            <TagIcon className="h-4 w-4" />
                            {product.percent_off}% {formatTextDirection(t("off", "OFF"))}
                          </div>
                        )}
                        
                        <div className="product-badge verified-badge">
                          <CheckCircleIcon className="h-4 w-4" />
                          {formatTextDirection(t("verified", "Verified"))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Product Info Section */}
                  <div className="modern-product-info-section">
                    <div className="product-info-container">
                      
                      {/* Category */}
                      {displayCategory && (
                        <Link 
                          to={`/products?category=${displayCategory}`}
                          className="modern-product-category"
                        >
                          <CubeIcon className="h-4 w-4" />
                          {formatTextDirection(displayCategory)}
                        </Link>
                      )}

                      {/* Title */}
                      <h1 className="modern-product-title">
                        <span className="title-gradient">
                          {formatTextDirection(displayName)}
                        </span>
                      </h1>
                      
                      {/* Enhanced Trust Indicators */}
                      <div className="trust-indicators">
                        <div className="trust-item">
                          <div className="trust-icon">
                            <ShieldCheckIcon className="h-5 w-5" />
                          </div>
                          <span>{t("authentic_license", "100% Authentic License")}</span>
                        </div>
                        <div className="trust-item">
                          <div className="trust-icon">
                            <TruckIcon className="h-5 w-5" />
                          </div>
                          <span>{t("instant_delivery", "Instant Digital Delivery")}</span>
                        </div>
                        <div className="trust-item">
                          <div className="trust-icon">
                            <ClockIcon className="h-5 w-5" />
                          </div>
                          <span>{t("247_support", "24/7 Customer Support")}</span>
                        </div>
                      </div>
                      
                      {/* Enhanced Rating */}
                      <div className="product-rating">
                        <div className="stars">
                          {[...Array(5)].map((_, i) => (
                            <StarSolidIcon key={i} className="h-5 w-5 text-yellow-400" />
                          ))}
                        </div>
                        <span className="rating-text">4.8 (127 {t("reviews", "reviews")})</span>
                        <button className="rating-link">
                          {t("read_reviews", "Read Reviews")}
                        </button>
                      </div>
                      
                      {/* Price */}
                      <div className="modern-product-price">
                        <div className="price-container">
                          <span className="price-main">₪{formattedPrice}</span>
                          {product.original_price && product.original_price > product.price && (
                            <span className="price-original">₪{product.original_price.toFixed(2)}</span>
                          )}
                        </div>
                        {product.percent_off > 0 && (
                          <div className="savings-badge">
                            {t("save", "Save")} ₪{(product.original_price - product.price).toFixed(2)}
                          </div>
                        )}
                      </div>
                      
                      {/* Description */}
                      <div className="modern-product-description">
                        <h3 className="description-title">{t("product_description", "Product Description")}</h3>
                        <div className={`description-content ${showFullDescription ? 'expanded' : ''}`}>
                          {formatTextDirection(displayDesc || t("no_description_available", "No description available."))}
                        </div>
                        {displayDesc && displayDesc.length > 200 && (
                          <button 
                            onClick={() => setShowFullDescription(!showFullDescription)}
                            className="description-toggle"
                          >
                            {showFullDescription ? t("show_less", "Show Less") : t("show_more", "Show More")}
                          </button>
                        )}
                      </div>
                      
                      {/* Key Features */}
                      <div className="product-features">
                        <h3 className="features-title">{t("key_features", "Key Features")}</h3>
                        <ul className="features-list">
                          <li className="feature-item">
                            <ShieldCheckIcon className="h-4 w-4" />
                            <span>{t("feature_1", "Official licensing from verified distributors")}</span>
                          </li>
                          <li className="feature-item">
                            <ClockIcon className="h-4 w-4" />
                            <span>{t("feature_2", "Instant delivery within minutes")}</span>
                          </li>
                          <li className="feature-item">
                            <TruckIcon className="h-4 w-4" />
                            <span>{t("feature_3", "Full customer support included")}</span>
                          </li>
                        </ul>
                      </div>
                      
                      {/* Actions */}
                      <div className="modern-product-actions">
                        <div className="quantity-section">
                          <label className="quantity-label">
                            {formatTextDirection(t("quantity", "Quantity"))}:
                          </label>
                          <div className="quantity-controls">
                            <button 
                              onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                              className="quantity-btn"
                              type="button"
                            >
                              −
                            </button>
                            <input
                              type="number"
                              min={1}
                              value={quantity}
                              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                              className="quantity-input"
                            />
                            <button 
                              onClick={() => setQuantity(prev => prev + 1)}
                              className="quantity-btn"
                              type="button"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div className="action-buttons">
                          <button
                            onClick={handleAddToCart}
                            className={`modern-add-to-cart-btn ${addedToCart ? 'added' : ''}`}
                            type="button"
                          >
                            <ShoppingCartIcon className="h-5 w-5" />
                            {formatTextDirection(addedToCart ? t("added_to_cart", "Added!") : t("add_to_cart", "Add to Cart"))}
                          </button>
                          
                          <button
                            onClick={() => setIsFavorite(!isFavorite)}
                            className={`wishlist-btn ${isFavorite ? 'favorited' : ''}`}
                            type="button"
                          >
                            {isFavorite ? (
                              <HeartSolidIcon className="h-5 w-5" />
                            ) : (
                              <HeartIcon className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Security Notice */}
                      <div className="security-notice">
                        <ShieldCheckIcon className="h-6 w-6 text-green-600" />
                        <div className="security-text">
                          <h4>{t("secure_purchase", "Secure Purchase")}</h4>
                          <p>{t("security_message", "Your payment information is protected with industry-standard encryption.")}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </main>

              {/* Related Products Section */}
              <section className="modern-related-products-section">
                <div className="related-products-header">
                  <h2 className="related-products-title">
                    {formatTextDirection(t("related_products", "Related Products"))}
                  </h2>
                  <p className="related-products-subtitle">
                    {formatTextDirection(t("related_products_subtitle", "You might also be interested in these products"))}
                  </p>
                </div>
                
                {loadingRelated ? (
                  <div className="related-products-loading">
                    <div className="loading-spinner">
                      <div className="spinner-ring"></div>
                    </div>
                    <p className="loading-text">
                      {formatTextDirection(t("loading_related_products", "Loading related products..."))}
                    </p>
                  </div>
                ) : relatedProducts.length > 0 ? (
                  <div className="modern-related-products-grid">
                    {relatedProducts.map((relatedProduct) => (
                      <ProductCard 
                        key={relatedProduct.id || relatedProduct._id} 
                        product={relatedProduct} 
                      />
                    ))}
                  </div>
                ) : (
                  <div className="related-products-empty">
                    <PhotoIcon className="h-16 w-16 text-gray-400" />
                    <h3 className="empty-title">{formatTextDirection(t("no_related_products", "No related products found"))}</h3>
                    <p className="empty-text">{formatTextDirection(t("explore_more", "Explore our full catalog for more amazing products"))}</p>
                    <Link to="/products" className="explore-link">
                      {formatTextDirection(t("browse_all_products", "Browse All Products"))}
                      <ChevronRightIcon className="h-4 w-4" />
                    </Link>
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ProductPage;
