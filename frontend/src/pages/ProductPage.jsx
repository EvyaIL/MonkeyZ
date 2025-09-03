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
    if (!productId) return;

    setLoadingRelated(true);
    const { data, error } = await apiService.get(`/product/related/${productId}`);
    if (!error && data && Array.isArray(data)) {
      setRelatedProducts(data.slice(0, 4));
    }
    setLoadingRelated(false);
  }, [product]);

  useEffect(() => {
    fetchProduct();
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

      <div className={`product-page-container ${isRTL() ? 'rtl' : 'ltr'}`}>
        <div className="product-page-content">
          {loading ? (
            <div className="loading-container" aria-live="polite">
              <Spinner />
              <p className="loading-text">
                {formatTextDirection(t("loading_product", "Loading product..."))}
              </p>
            </div>
          ) : errorMsg ? (
            <div className="error-container">
              <div className="error-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
              </div>
              <h3 className="error-title">{formatTextDirection(t("product_not_found", "Product Not Found"))}</h3>
              <p className="error-message" role="alert">{formatTextDirection(errorMsg)}</p>
              <Link to="/products" className="error-link">
                <svg viewBox="0 0 24 24" fill="currentColor" className="error-link-icon">
                  <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                </svg>
                {formatTextDirection(t("browse_products", "Browse Products"))}
              </Link>
            </div>
          ) : (
            <>
              <nav className="product-breadcrumb" aria-label="Breadcrumb">
                <Link to="/" className="breadcrumb-link">{formatTextDirection(t("home"))}</Link>
                <span className="breadcrumb-separator">›</span>
                <Link to="/products" className="breadcrumb-link">{formatTextDirection(t("all_products"))}</Link>
                {displayCategory && (
                  <>
                    <span className="breadcrumb-separator">›</span>
                    <Link 
                      to={`/products?category=${displayCategory}`} 
                      className="breadcrumb-link"
                    >
                      {formatTextDirection(displayCategory)}
                    </Link>
                  </>
                )}
                <span className="breadcrumb-separator">›</span>
                <span className="breadcrumb-current">{formatTextDirection(displayName || t("product_name"))}</span>
              </nav>

              <main className="product-main">
                <div className="product-grid">
                  <div className="product-image-section">
                    {(product.imageUrl || product.image) ? (
                      <img
                        src={product.imageUrl || product.image}
                        alt={displayName || t("product_image")}
                        className="product-image"
                        loading="lazy"
                      />
                    ) : (
                      <div className="product-image-placeholder">
                        <svg viewBox="0 0 24 24" className="placeholder-icon" fill="currentColor">
                          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                        </svg>
                        <span>{formatTextDirection(t("no_image_available", "No Image Available"))}</span>
                      </div>
                    )}
                    
                    {product.is_new && (
                      <div className="product-badge new-badge">
                        {formatTextDirection(t("new", "NEW"))}
                      </div>
                    )}
                    
                    {product.percent_off > 0 && (
                      <div className="product-badge discount-badge">
                        {product.percent_off}% {formatTextDirection(t("off", "OFF"))}
                      </div>
                    )}
                  </div>

                  <div className="product-info-section">
                    {displayCategory && (
                      <Link 
                        to={`/products?category=${displayCategory}`}
                        className="product-category"
                      >
                        {formatTextDirection(displayCategory)}
                      </Link>
                    )}

                    <h1 className="product-title">
                      {formatTextDirection(displayName)}
                    </h1>
                    
                    <div className="product-description">
                      {formatTextDirection(displayDesc || t("no_description_available", "No description available."))}
                    </div>
                    
                    <div className="product-price">
                      <span className="currency-symbol">₪</span>
                      <span className="price-amount">{formattedPrice}</span>
                    </div>
                    
                    <div className="product-actions">
                      <div className="quantity-section">
                        <label htmlFor="quantity" className="quantity-label">
                          {formatTextDirection(t("quantity", "Quantity"))}:
                        </label>
                        <div className="quantity-controls">
                          <button 
                            onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                            className="quantity-btn"
                            aria-label={t("decrease_quantity", "Decrease quantity")}
                            type="button"
                          >
                            −
                          </button>
                          <input
                            id="quantity"
                            type="number"
                            min={1}
                            value={quantity}
                            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                            className="quantity-input"
                            aria-label={t("quantity", "Quantity")}
                          />
                          <button 
                            onClick={() => setQuantity(prev => prev + 1)}
                            className="quantity-btn"
                            aria-label={t("increase_quantity", "Increase quantity")}
                            type="button"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={handleAddToCart}
                        className={`add-to-cart-btn ${addedToCart ? 'added' : ''}`}
                        type="button"
                      >
                        {formatTextDirection(addedToCart ? t("added_to_cart", "Added!") : t("add_to_cart"))}
                      </button>
                    </div>
                  </div>
                </div>
              </main>

              {relatedProducts.length > 0 && (
                <section className="related-products-section">
                  <h2 className="related-products-title">
                    {formatTextDirection(t("related_products", "Related Products"))}
                  </h2>
                  {loadingRelated ? (
                    <div className="loading-container">
                      <Spinner />
                    </div>
                  ) : (
                    <div className="related-products-grid">
                      {relatedProducts.map((relatedProduct) => (
                        <ProductCard 
                          key={relatedProduct.id || relatedProduct._id} 
                          product={relatedProduct} 
                        />
                      ))}
                    </div>
                  )}
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ProductPage;
