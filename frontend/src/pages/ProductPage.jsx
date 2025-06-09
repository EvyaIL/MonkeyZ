import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { apiService } from "../lib/apiService";
import PrimaryButton from "../components/buttons/PrimaryButton";
import PrimaryInput from "../components/inputs/PrimaryInput";
import { useGlobalProvider } from "../context/GlobalProvider";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet";
import Spinner from "../components/Spinner";
import { generateProductSchema, addStructuredData } from "../lib/seo-helper";

const ProductPage = () => {
  const { name } = useParams();
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

  // Extract search terms from product name for related products
  const extractSearchTerm = useCallback((productName) => {
    if (!productName) return "";
    
    const name = typeof productName === "object" 
      ? (productName[lang] || productName.en || "") 
      : productName;
      
    // Get the first meaningful word (3+ characters)
    const words = name.split(/\s+/);
    for (const word of words) {
      if (word.length >= 3 && !["the", "and", "for", "with", "של"].includes(word.toLowerCase())) {
        return word;
      }
    }
    return name.split(/\s+/)[0] || "";
  }, [lang]);

  // Fetch related products
  const fetchRelatedProducts = useCallback(async (categoryOrName) => {
    if (!categoryOrName) return;
    setLoadingRelated(true);
    try {
      const { data: adminProducts } = await apiService.get('/admin/products');
      let filtered = [];
      if (adminProducts && Array.isArray(adminProducts) && adminProducts.length > 0) {
        filtered = adminProducts.filter(p => {
          if (!p || p.id === product.id) return false;
          if (p.category && product.category && p.category.toLowerCase() === product.category.toLowerCase()) return true;
          const pName = typeof p.name === "object" ? (p.name[lang] || p.name.en) : p.name;
          const prodName = typeof product.name === "object" ? (product.name[lang] || product.name.en) : product.name;
          return pName && prodName && pName !== prodName && pName.toLowerCase().includes(prodName.toLowerCase());
        });
      }
      setRelatedProducts(filtered.slice(0, 4));
    } catch (err) {
      console.error("Error fetching related products:", err);
      setRelatedProducts([]);
    } finally {
      setLoadingRelated(false);
    }
  }, [product.id, product.category, product.name, lang]);

  // Fetch product data
  const fetchProduct = useCallback(async () => {
    if (!name) return;
    
    try {
      const decodedName = decodeURIComponent(name);
      setLoading(true);
      setErrorMsg("");
      
      // For Hebrew names, we need special handling
      const isHebrew = /[\u0590-\u05FF]/.test(decodedName);
      
      // Handle object names and extract the correct language version
      const nameParam = typeof decodedName === 'object' ? 
        (decodedName[lang] || decodedName.en || Object.values(decodedName)[0]) : 
        decodedName;

      // Try API with proper encoding
      const encodedName = isHebrew ? encodeURI(nameParam) : encodeURIComponent(nameParam);
      const response = await apiService.get(`/product/${encodedName}`);
      
      if (response.data) {
        setProduct(response.data);
        // Track product view and fetch related products
        fetchRelatedProducts(response.data.category || extractSearchTerm(response.data.name));
      } else {
        throw new Error("Product data is empty");
      }
    } catch (error) {
      console.error("Error fetching product:", {
        message: error.message,
        statusCode: error.response?.status,
        responseData: error.response?.data,
        name,
        decodedName: decodeURIComponent(name)
      });

      // Try admin products API as a fallback
      try {
        const { data: adminProducts } = await apiService.get('/admin/products');
        if (adminProducts && adminProducts.length > 0) {
          const decodedNameLower = decodeURIComponent(name).toLowerCase();
          
          const matchedProduct = adminProducts.find(p => {
            if (typeof p.name === "object") {
              return (p.name.he && p.name.he.toLowerCase() === decodedNameLower) || 
                     (p.name.en && p.name.en.toLowerCase() === decodedNameLower);
            }
            return p.name && p.name.toLowerCase() === decodedNameLower;
          });
          
          if (matchedProduct) {
            setProduct(matchedProduct);
            fetchRelatedProducts(matchedProduct.category || extractSearchTerm(matchedProduct.name));
            return;
          }
        }
      } catch (adminError) {
        console.error("Error fetching from admin products:", adminError);
      }

      // If no product found, show error
      setErrorMsg(t("errors.productNotFound"));
      notify({
        type: "error",
        message: error.response?.status === 404 ? 
          t("errors.productNotFound") : 
          t("errors.generalError", "An error occurred while fetching the product")
      });
    } finally {
      setLoading(false);
    }
  }, [name, notify, t, fetchRelatedProducts, extractSearchTerm, lang]);
  useEffect(() => {
    const loadProductData = async () => {
      await fetchProduct();
      // Remove background fetch from /product/all
    };
    loadProductData();
    // eslint-disable-next-line
  }, [name, lang]);

  // Add structured data when product data changes
  useEffect(() => {
    if (product && product.id) {
      const productData = {
        ...product,
        name: displayName,
        description: displayDesc,
        imageUrl: product.image,
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
        {product.image && <meta name="twitter:image" content={product.image} />}
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
                <div className="w-full md:w-1/2 h-[300px] md:h-[350px] rounded-lg border border-accent/10 dark:border-accent/10 bg-gray-100 dark:bg-gray-900 flex items-center justify-center overflow-hidden transition-all duration-300 hover:border-accent/30 group">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={displayName || t("product_image")}
                      className="object-contain w-full h-full p-4 transition-all duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500 text-lg">{t("no_image_available", "No Image Available")}</span>
                  )}
                </div>

                <div className="flex-1 text-white">
                  <h1 className="text-start text-accent font-bold text-2xl mb-4">
                    {displayName}
                  </h1>
                  
                  {displayCategory && (
                    <Link 
                      to={`/products?category=${displayCategory}`}
                      className="inline-block bg-gray-700 text-white text-xs font-semibold px-3 py-1 rounded-full mb-4 hover:bg-gray-600 transition-colors"
                    >
                      {displayCategory}
                    </Link>
                  )}
                  
                  <div className="prose prose-invert max-w-none">
                    <p className="text-lg leading-relaxed whitespace-pre-line">
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
                        </button>
                        <PrimaryInput
                          id="quantity"
                          type="number"
                          min={1}
                          value={quantity}
                          onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                          otherStyle="w-16 mx-0 bg-white dark:bg-gray-800 text-center h-10 rounded-none border-x-0 text-gray-800 dark:text-white border border-gray-300 dark:border-gray-600"
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
                          to={`/product/${encodedName}`}
                          className="group"
                        >
                          <div className="bg-white dark:bg-gray-800 border border-accent/30 dark:border-accent/30 rounded-lg p-4 shadow-lg transition-all duration-300 hover:shadow-xl backdrop-blur-sm h-full flex flex-col">
                            <div className="h-40 mb-4 bg-gray-100 dark:bg-gray-900 rounded-lg border border-accent/10 dark:border-accent/10 flex items-center justify-center overflow-hidden group-hover:border-accent/30 transition-colors">
                              {relatedProduct.image ? (
                                <img 
                                  src={relatedProduct.image} 
                                  alt={relName} 
                                  className="object-contain h-full w-full p-2 group-hover:scale-105 transition-all duration-500"
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
