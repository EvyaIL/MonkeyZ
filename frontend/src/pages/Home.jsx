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
import { isRTL, formatTextDirection } from "../utils/language";
import './Home.css';

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
      <div className={`home-container ${isRTL() ? 'rtl' : 'ltr'}`}>
        <div className="home-content">
          <div className="home-hero">
            <h1 className="home-title" tabIndex={0}>
              <span className="home-icon">
                <svg viewBox="0 0 24 24" fill="currentColor" className="home-icon-svg">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                </svg>
              </span>
              {formatTextDirection(t("home"))}
            </h1>
          </div>

          <section className="home-section home-section-showcase" aria-label={t("best_sellers")}>
            {loadingBest ? (
              <div className="home-skeleton-container">
                <ProductGridSkeleton count={8} />
              </div>
            ) : errorBest ? (
              <div className="home-error-message" role="alert">
                {errorBest}
              </div>
            ) : bestSellers.length > 0 ? (
              <ProductShowcase products={bestSellers} title={formatTextDirection(t("best_sellers"))} />
            ) : null}
          </section>

          <section className="home-section home-section-featured" aria-label={t("featured_products")}>
            <h2 className="home-section-title">
              {formatTextDirection(t("featured_products"))}
            </h2>
            {loadingHome ? (
              <div className="home-skeleton-container">
                <ProductGridSkeleton count={12} />
              </div>
            ) : errorHome ? (
              <div className="home-error-message" role="alert">
                {errorHome}
              </div>
            ) : homeProducts.length > 0 ? (
              <div className="home-products-grid">
                {homeProducts.map((product) => (
                  <ProductCard key={product.id || product._id} product={product} />
                ))}
              </div>
            ) : (
              <div className="home-no-products">
                <div className="home-no-products-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="no-products-svg">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                  </svg>
                </div>
                <p>{formatTextDirection(t("no_products_available"))}</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
});

// Set display name for debugging  
Home.displayName = 'Home';

export default Home;
