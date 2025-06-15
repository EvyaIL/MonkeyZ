import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { apiService } from "../lib/apiService";
import PrimaryButton from "../components/buttons/PrimaryButton";
import PrimaryInput from "../components/inputs/PrimaryInput";
import { useGlobalProvider } from "../context/GlobalProvider";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import Spinner from "../components/Spinner";
import { generateProductSchema, addStructuredData } from "../lib/seo-helper";

const ProductPage = () => {
  const { productIdentifier } = useParams(); // Changed from productName to productIdentifier
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

  // Memoize display values to prevent unnecessary recalculations
  const displayName = useMemo(() => {
    return typeof product.name === "object" ? (product.name[lang] || product.name.en) : product.name;
  }, [product.name, lang]);

  const displayDesc = useMemo(() => {
    return typeof product.description === "object" ? (product.description[lang] || product.description.en) : product.description;
  }, [product.description, lang]);

  const displayCategory = product.category || "";
  const formattedPrice = product.price ? product.price.toFixed(2) : "0.00";
  // Removed unused extractSearchTerm function

  // Fetch related products
  const fetchRelatedProducts = useCallback(async () => {
    if (!product.id || !product.category) { // Guard: Must have product ID and category
      setRelatedProducts([]);
      setLoadingRelated(false); // Ensure loading is stopped
      return;
    }
    setLoadingRelated(true);
    try {
      // Use the public endpoint to fetch all products
      const { data: allPublicProducts } = await apiService.get('/product/all');
      let productsToShow = [];

      if (allPublicProducts && Array.isArray(allPublicProducts) && allPublicProducts.length > 0) {
        const currentProductId = product.id;
        const currentProductCategory = product.category.toLowerCase();

        // 1. Filter for active products in the same category, excluding the current product
        // Assuming the /product/all endpoint already returns active products or suitable public products
        const categoryMatches = allPublicProducts.filter(p => 
          p && 
          p.id !== currentProductId && 
          // p.active !== false && // Assuming /product/all handles active status
          p.category && 
          p.category.toLowerCase() === currentProductCategory
        );

        // 2. Decide which products to show based on the number of matches
        if (categoryMatches.length > 0) {
          if (categoryMatches.length <= 4) {
            productsToShow = categoryMatches;
          } else {
            // Shuffle and pick 4 if more than 4 matches
            for (let i = categoryMatches.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [categoryMatches[i], categoryMatches[j]] = [categoryMatches[j], categoryMatches[i]];
            }
            productsToShow = categoryMatches.slice(0, 4);
          }
        }
        // If no categoryMatches, productsToShow remains an empty array (default)
      }
      setRelatedProducts(productsToShow);
    } catch (err) {
      console.error("Error fetching related products:", err);
      setRelatedProducts([]); // Set to empty on error
    } finally {
      setLoadingRelated(false);
    }
  }, [product.id, product.category, setLoadingRelated, setRelatedProducts]); // apiService is stable

  // Fetch product data
  const fetchProduct = useCallback(async () => {
    if (!productIdentifier) return; // Changed from productName to productIdentifier
    
    setLoading(true);
    setErrorMsg("");
    try {
      // The productIdentifier is already part of the URL, no need to extract from product.name here
      // It will be the name (or slug, if backend supports it at this new unified endpoint)
      const decodedIdentifier = decodeURIComponent(productIdentifier); // Changed from productName
      
      // The backend will handle if it's a name or slug
      // No need for isHebrew or specific encoding logic here for the path param itself,
      // as long as the server and client handle UTF-8 correctly in URLs.
      // The `productIdentifier` from `useParams` is already decoded by react-router.
      const response = await apiService.get(`/product/${encodeURIComponent(decodedIdentifier)}`); // Use productIdentifier directly
      
      if (response.data) {
        setProduct(response.data); // This will trigger the useEffect for related products
      } else {
        throw new Error("Product data is empty");
      }
    } catch (error) {
      console.error("Error fetching product:", error); // Keep original error for debugging
      // setErrorMsg(t("errors.productNotFound")); // Simplified error message
      notify({
        type: "error",
        message: error.response?.status === 404 ? 
          t("errors.productNotFound") : 
          t("errors.generalError", "An error occurred while fetching the product")
      });
      setProduct({ id: null, name: "", description: "", image: "", price: 0, category: "" }); // Reset product on error
    } finally {
      setLoading(false);
    }
  }, [productIdentifier, notify, t, setProduct, setLoading, setErrorMsg]); // Removed lang as it's not used in callback

  // Effect to fetch main product data when 'productIdentifier' (from URL) or 'lang' changes
  useEffect(() => {
    const loadProductData = async () => {
      // Reset product state before fetching new one if desired, or ensure loading states cover UI
      // setProduct({ id: null, name: "", description: "", image: "", price: 0, category: "" });
      // setRelatedProducts([]);
      await fetchProduct();
    };
    if (productIdentifier) { // Changed from productName to productIdentifier
        loadProductData();
    }
  }, [productIdentifier, lang, fetchProduct]); // Changed productName to productIdentifier, fetchProduct is a dependency

  // Effect to fetch related products when the main product's data (id or category) changes
  useEffect(() => {
    if (product && product.id) { // Ensure product is loaded
      fetchRelatedProducts();
    }
  }, [product, fetchRelatedProducts]); // Added product to dependencies

  // Add structured data when product data changes
  useEffect(() => {
    if (product && product.id) {
      const productData = {
        ...product,
        name: displayName,
        description: displayDesc,
        // Prioritize imageUrl, then image for structured data
        imageUrl: product.imageUrl || product.image,
        inStock: true
      };
      
      const schema = generateProductSchema(productData);
      addStructuredData(schema);
    }
  }, [product, displayName, displayDesc]);

  const handleAddToCart = useCallback(() => {
    if (!product.id) return;
    addItemToCart(product.id, quantity, product);
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
        <title>{displayName ? `${displayName} | MonkeyZ` : "MonkeyZ - " + t("product")}</title>
        <meta name="description" content={displayDesc || t("product_meta_description", "Explore our quality products at MonkeyZ.")} />
        <meta name="keywords" content={`MonkeyZ, ${displayName}, ${displayCategory}, digital products, software, premium`} />
        <link rel="canonical" href={`https://monkeyz.co.il/product/${encodeURIComponent(displayName)}`} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:title" content={displayName ? `${displayName} | MonkeyZ` : "MonkeyZ - " + t("product")} />
        <meta property="og:description" content={displayDesc || t("product_meta_description", "Explore our quality products at MonkeyZ.")} />
        {product.image && <meta property="og:image" content={product.image} />}
        <meta property="og:type" content="product" />
        <meta property="og:url" content={`https://monkeyz.co.il/product/${encodeURIComponent(displayName)}`} />
        {product.price && <meta property="product:price:amount" content={formattedPrice} />}
        <meta property="product:price:currency" content="ILS" />
        {displayCategory && <meta property="product:category" content={displayCategory} />}
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={displayName ? `${displayName} | MonkeyZ` : "MonkeyZ - " + t("product")} />
        <meta name="twitter:description" content={displayDesc || t("product_meta_description", "Explore our quality products at MonkeyZ.")} />
        {/* Prioritize imageUrl, then image for Twitter card */}
        {(product.imageUrl || product.image) && <meta name="twitter:image" content={product.imageUrl || product.image} />}
      </Helmet>
      <div className="p-4 md:p-9 flex flex-col items-center justify-center min-h-screen">
        <div className="bg-white dark:bg-gray-800 border border-accent/30 dark:border-accent/30 rounded-lg shadow-lg p-4 md:p-6 w-full max-w-6xl mt-5 backdrop-blur-sm">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-8" aria-live="polite">
              <Spinner />
              <p className="text-white text-center mt-4">
                {t("loading_product", "Loading product...")}
              </p>
            </div>
          ) : errorMsg ? (
            <div className="text-center p-8">
              <p className="text-red-500 text-lg mb-4" role="alert">
                {errorMsg}
              </p>
              <Link to="/products" className="text-accent hover:text-accent-light underline transition-colors">
                {t("browse_all_products", "Browse all products")}
              </Link>
            </div>
          ) : (
            <>
              <nav aria-label="breadcrumb" className="mb-4 px-2">
                <ol className="flex flex-wrap text-sm text-gray-400">
                  <li className="after:content-['/'] after:mx-2">
                    <Link to="/" className="hover:text-accent transition-colors">{t("home")}</Link>
                  </li>
                  <li className="after:content-['/'] after:mx-2">
                    <Link to="/products" className="hover:text-accent transition-colors">{t("all_products")}</Link>
                  </li>
                  {displayCategory && (
                    <li className="after:content-['/'] after:mx-2">
                      <Link 
                        to={`/products?category=${displayCategory}`} 
                        className="hover:text-accent transition-colors"
                      >
                        {displayCategory}
                      </Link>
                    </li>
                  )}
                  <li className="text-accent" aria-current="page">
                    {displayName || t("product_name")}
                  </li>
                </ol>
              </nav>

              <div className="flex flex-col md:flex-row gap-6 items-start p-4">
                <div className="w-full md:w-1/2 h-[300px] md:h-[350px] rounded-lg border border-accent/10 dark:border-accent/10 bg-gray-100 dark:bg-gray-900 flex items-center justify-center overflow-hidden transition-all duration-300 hover:border-accent/30 group relative">
                  {/* Prioritize imageUrl, then image for product display */}
                  {(product.imageUrl || product.image) ? (
                    <img
                      src={product.imageUrl || product.image}
                      alt={displayName || t("product_image")}
                      className="object-cover w-full h-full transition-all duration-500 group-hover:scale-105" /* Changed from object-contain and removed p-4 */
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500 text-lg">{t("no_image_available", "No Image Available")}</span>
                  )}
                </div>

                <div className="flex-1 text-white">
                  <h1 className="text-start text-accent font-bold text-2xl mb-2">
                    {displayName}
                  </h1>
                  
                  <div className="flex items-center gap-2 mb-4">
                    {product.is_new && (
                      <span className="bg-emerald-500 text-white text-sm font-semibold px-3 py-1 rounded-full shadow-md">
                        {t("new", "NEW")}
                      </span>
                    )}
                    {product.percent_off > 0 && (
                      <span className="bg-rose-500 text-white text-sm font-semibold px-3 py-1 rounded-full shadow-md">
                        {product.percent_off}% {t("off", "OFF")}
                      </span>
                    )}
                  </div>

                  {displayCategory && (
                    <Link 
                      to={`/products?category=${displayCategory}`}
                      className="inline-block bg-gray-700 text-white text-xs font-semibold px-3 py-1 rounded-full mb-4 hover:bg-gray-600 transition-colors"
                    >
                      {displayCategory}
                    </Link>
                  )}
                    <div className="prose dark:prose-invert max-w-none">
                    <p className="text-lg leading-relaxed whitespace-pre-line text-gray-900 dark:text-white">
                      {displayDesc || t("no_description_available", "No description available.")}
                    </p>
                  </div>
                  
                  <p className="text-2xl font-semibold text-accent mt-6">
                    ₪{formattedPrice}
                  </p>
                  
                  <div className="flex flex-col sm:flex-row items-start sm:items-center mt-6 space-y-4 sm:space-y-0 sm:space-x-2">
                    <div className="flex items-center">
                      <label htmlFor="quantity" className="text-gray-800 dark:text-white mr-3">{t("quantity", "Quantity")}:</label>
                      <div className="flex items-center shadow-md">
                        <button 
                          onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                          className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-bold py-2 px-4 rounded-l border border-gray-300 dark:border-gray-600"
                          aria-label={t("decrease_quantity", "Decrease quantity")}
                        >
                          −
                        </button>                        <PrimaryInput
                          id="quantity"
                          type="number"
                          min={1}
                          value={quantity}
                          onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                          otherStyle="w-16 mx-0 bg-white dark:bg-gray-800 text-center h-10 rounded-none border-x-0 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600"
                          aria-label={t("quantity", "Quantity")}
                        />
                        <button 
                          onClick={() => setQuantity(prev => prev + 1)}
                          className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-bold py-2 px-4 rounded-r border border-gray-300 dark:border-gray-600"
                          aria-label={t("increase_quantity", "Increase quantity")}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <PrimaryButton
                      title={addedToCart ? t("added_to_cart", "Added!") : t("add_to_cart")}
                      otherStyle={`h-11 transition-all duration-300 ${addedToCart ? 'bg-green-600 hover:bg-green-700' : ''}`}
                      onClick={handleAddToCart}
                      disabled={!product.id}
                      aria-label={`${t("add")} ${displayName} ${t("to_cart")}`}
                    />
                  </div>
                  
                  {addedToCart && (
                    <div 
                      className="text-green-400 mt-2 animate-fade-in text-sm flex items-center"
                      aria-live="polite"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {`${displayName} ${t("added_to_cart_suffix", "added to cart")}`}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Related Products Section */}
              <div className="mt-12 border-t border-accent/30 pt-8">
                <h2 className="text-center text-accent font-bold text-2xl mb-8">
                  {t("related_products", "Related Products")}
                </h2>
                
                {loadingRelated ? (
                  <div className="flex justify-center p-4">
                    <Spinner />
                  </div>
                ) : relatedProducts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {relatedProducts.map(relatedProduct => {
                      const relName = typeof relatedProduct.name === "object" 
                        ? (relatedProduct.name[lang] || relatedProduct.name.en) 
                        : relatedProduct.name;
                      
                      // Check if name contains Hebrew characters
                      const isHebrew = /[\u0590-\u05FF]/.test(relName);
                      const encodedName = isHebrew ? 
                        encodeURI(relName) : 
                        encodeURIComponent(relName);
                      
                      return (
                        <Link 
                          key={relatedProduct.id} 
                          to={`/product/${encodedName}`} // Changed from /product/name/ to /product/
                          className="group"
                        >
                          <div className="bg-white dark:bg-gray-800 border border-accent/30 dark:border-accent/30 rounded-lg p-4 shadow-lg transition-all duration-300 hover:shadow-xl backdrop-blur-sm h-full flex flex-col">
                            <div className="h-40 mb-4 bg-gray-100 dark:bg-gray-900 rounded-lg border border-accent/10 dark:border-accent/10 flex items-center justify-center overflow-hidden group-hover:border-accent/30 transition-colors">
                              {/* Prioritize imageUrl, then image for related product display */}
                              {(relatedProduct.imageUrl || relatedProduct.image) ? (
                                <img 
                                  src={relatedProduct.imageUrl || relatedProduct.image} 
                                  alt={relName} 
                                  className="object-cover h-full w-full group-hover:scale-105 transition-all duration-500" /* Changed from object-contain and removed p-2 */
                                  loading="lazy"
                                />
                              ) : (
                                <span className="text-gray-400 dark:text-gray-500 text-sm">{t("no_image", "No image")}</span>
                              )}
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-2 group-hover:text-accent transition-colors line-clamp-2">
                              {relName}
                            </h3>
                            <p className="text-primary dark:text-accent mt-auto font-semibold">₪{relatedProduct.price?.toFixed(2)}</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center">
                    {t("no_related_products", "No related products found.")}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ProductPage;
