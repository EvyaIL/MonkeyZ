import React, { useEffect, useState, useCallback, useMemo } from "react";
import ProductCard from "../components/product/ProductCard";
import ProductShowcase from "../components/product/ProductShowcase";
import { apiService } from "../lib/apiService";
import Spinner from "../components/Spinner";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import { addStructuredData } from "../lib/seo-helper";
import imagePreloadService from "../lib/imagePreloadService";
import { usePerformanceMonitoring, trackRoutePerformance } from "../hooks/usePerformanceMonitoring";
import { ProductGridSkeleton } from "../components/SkeletonLoaders";
import LazyImage from "../components/LazyImage";

const Home = React.memo(() => {
  // Only use performance monitoring in development for debugging
  if (process.env.NODE_ENV === 'development' && false) { // Disabled to reduce console spam
    usePerformanceMonitoring('HomePage');
  }
  const [bestSellers, setBestSellers] = useState([]);
  const [homeProducts, setHomeProducts] = useState([]);
  const [loadingBest, setLoadingBest] = useState(true);  const [loadingHome, setLoadingHome] = useState(true);
  const [errorBest, setErrorBest] = useState("");
  const [errorHome, setErrorHome] = useState("");
  const { t } = useTranslation();

  const getBestSellers = useCallback(async () => {
    setLoadingBest(true);
    setErrorBest("");
    const { data, error } = await apiService.get("/product/best-sellers");
    if (error) {
      console.error("Failed to load best sellers:", error);
      setErrorBest(t("failed_to_load_best_sellers"));
    } else if (!data || !Array.isArray(data) || data.length === 0) {
      setErrorBest(t("no_best_sellers_found"));
    } else {
      setBestSellers(data);
    }
    setLoadingBest(false);
  }, [t]);

  const getHomeProducts = useCallback(async () => {
    setLoadingHome(true);
    setErrorHome("");
    const { data, error } = await apiService.get("/product/homepage", { limit: 8 });
    if (error) {
      console.error("Failed to load home products:", error);
      setErrorHome(t("failed_to_load_products"));
    } else if (!data || !Array.isArray(data) || data.length === 0) {
      setErrorHome(t("no_products_found"));
    } else {
      setHomeProducts(data);
    }
    setLoadingHome(false);
  }, [t]);

  useEffect(() => {
    // Track route performance
    const trackEnd = trackRoutePerformance('Home');
    
    getBestSellers();
    getHomeProducts();
    
    // Add structured data for the homepage
    const websiteSchema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": "https://monkeyz.co.il/#website",
      "url": "https://monkeyz.co.il",
      "name": "MonkeyZ",
      "description": "Premium Digital Products & Services",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://monkeyz.co.il/products?search={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    };
    
    addStructuredData(websiteSchema);
    
    // Clean up when component unmounts
    return () => {
      const script = document.getElementById('structured-data');
      if (script) script.remove();
      trackEnd(); // Track route load completion
    };
  }, [getBestSellers, getHomeProducts]); // Added missing dependencies

  // Preload images when products are loaded
  useEffect(() => {
    if (bestSellers.length > 0) {
      const imageUrls = bestSellers
        .map(product => product.imageUrl || product.image)
        .filter(Boolean);
      imagePreloadService.preloadImages(imageUrls, 'high');
    }
  }, [bestSellers]);

  useEffect(() => {
    if (homeProducts.length > 0) {
      const imageUrls = homeProducts
        .map(product => product.imageUrl || product.image)
        .filter(Boolean);
      imagePreloadService.preloadImages(imageUrls, 'high');
    }
  }, [homeProducts]);
  useEffect(() => {
    document.title = t("home");
  }, [t]);

  return (
    <>
      <Helmet>
        <title>{`MonkeyZ - ${t("home")} | Premium Digital Products & Services`}</title>
        <meta name="description" content={t("home_meta_description") || "MonkeyZ offers premium digital products including software keys, VPN services, cloud storage, and security solutions. Fast delivery, reliable service, and 24/7 support."} />
        <meta name="keywords" content="MonkeyZ, digital products, software keys, VPN service, antivirus, cloud storage, password manager, premium software, online store" />
        <link rel="canonical" href="https://monkeyz.co.il/" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:title" content={`MonkeyZ - ${t("home")} | Premium Digital Products & Services`} />
        <meta property="og:description" content={t("home_meta_description") || "MonkeyZ offers premium digital products including software keys, VPN services, cloud storage, and security solutions."} />
        <meta property="og:url" content="https://monkeyz.co.il/" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://monkeyz.co.il/og-image.jpg" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`MonkeyZ - ${t("home")} | Premium Digital Products`} />
        <meta name="twitter:description" content={t("home_meta_description") || "MonkeyZ offers premium digital products including software keys, VPN services, cloud storage, and security solutions."} />
        <meta name="twitter:image" content="https://monkeyz.co.il/og-image.jpg" />
      </Helmet>
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <h1 className="text-accent font-bold text-3xl mb-8" tabIndex={0}>
          {t("home")}
        </h1>

        <section className="w-full max-w-6xl mb-12" aria-label={t("best_sellers")}>
          {loadingBest ? (
            <ProductGridSkeleton count={8} />
          ) : errorBest ? (
            <p className="text-error text-center bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700" role="alert">
              {errorBest}
            </p>
          ) : bestSellers.length > 0 ? (
            <ProductShowcase products={bestSellers} title={t("best_sellers")} />
          ) : null}
        </section>

        <section
          className="bg-white dark:bg-gray-800 border border-accent/30 dark:border-accent/30 rounded-lg shadow-lg p-4 md:p-6 w-full max-w-6xl mt-12 backdrop-blur-sm"
          aria-label={t("featured_products")}
        >
          <h2 className="text-center text-accent font-bold text-3xl mb-8">
            {t("featured_products")}
          </h2>
          {loadingHome ? (
            <ProductGridSkeleton count={12} />
          ) : errorHome ? (
            <p className="text-error text-center text-lg p-4" role="alert">
              {errorHome}
            </p>
          ) : homeProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
              {homeProducts.map((product) => (
                <ProductCard key={product.id || product._id} product={product} />
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600 dark:text-gray-400 py-8">
              {t("no_products_available")}
            </p>
          )}
        </section>
      </div>
    </>
  );
});

// Set display name for debugging  
Home.displayName = 'Home';

export default Home;
