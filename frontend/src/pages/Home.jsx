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
      
      {/* Hero Section */}
      <section className="relative hero-gradient text-white py-24 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col lg:flex-row items-center justify-between">
            <div className="flex-1 text-center lg:text-left mb-12 lg:mb-0">
              <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
                {t("welcome_to")} <span className="text-cyan-300">MonkeyZ</span>
              </h1>
              <p className="text-xl lg:text-2xl mb-8 opacity-90 leading-relaxed">
                {t("hero_subtitle", "Premium Digital Products & Services at Your Fingertips")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button 
                  className="btn-modern-primary text-lg px-8 py-4 rounded-xl"
                  onClick={() => window.location.href = '/products'}
                >
                  {t("explore_products", "Explore Products")}
                </button>
                <button 
                  className="border-2 border-white/30 text-white px-8 py-4 rounded-xl hover:bg-white/10 transition-all duration-300"
                  onClick={() => window.location.href = '/about'}
                >
                  {t("learn_more", "Learn More")}
                </button>
              </div>
            </div>
            <div className="flex-1 lg:pl-12">
              <div className="relative">
                <div className="absolute inset-0 bg-white/10 rounded-3xl transform rotate-6"></div>
                <div className="relative bg-white/20 backdrop-blur-sm rounded-3xl p-8 text-center">
                  <div className="text-6xl mb-4">🐒</div>
                  <h3 className="text-2xl font-bold mb-2">{t("trusted_by_thousands", "Trusted by Thousands")}</h3>
                  <p className="opacity-90">{t("hero_trust_text", "Join our community of satisfied customers")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-cyan-300/20 rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl -z-10"></div>
      </section>

      <div className="bg-gradient-surface min-h-screen py-16">
        {/* Best Sellers Section */}
        <section className="container mx-auto max-w-6xl px-6 mb-16" aria-label={t("best_sellers")}>
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-text-primary mb-4">{t("best_sellers", "Best Sellers")}</h2>
            <p className="text-xl text-text-secondary">{t("best_sellers_subtitle", "Our most popular digital products")}</p>
          </div>
          
          {loadingBest ? (
            <ProductGridSkeleton count={8} />
          ) : errorBest ? (
            <div className="error-state-modern max-w-md mx-auto">
              <div className="text-5xl mb-4">📦</div>
              <h3 className="text-2xl font-bold text-red-700 mb-2">{t("oops", "Oops!")}</h3>
              <p className="text-red-600 mb-6">{errorBest}</p>
              <button 
                onClick={getBestSellers}
                className="btn-modern-primary"
              >
                {t("try_again", "Try Again")}
              </button>
            </div>
          ) : bestSellers.length > 0 ? (
            <ProductShowcase products={bestSellers} title="" />
          ) : null}
        </section>

        {/* Featured Products Section */}
        <section className="container mx-auto max-w-6xl px-6" aria-label={t("featured_products")}>
          <div className="card-modern p-8 lg:p-12">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-text-primary mb-4">{t("featured_products", "Featured Products")}</h2>
              <p className="text-xl text-text-secondary">{t("featured_products_subtitle", "Handpicked products just for you")}</p>
            </div>
            
            {loadingHome ? (
              <ProductGridSkeleton count={12} />
            ) : errorHome ? (
              <div className="error-state-modern max-w-md mx-auto">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-2xl font-bold text-red-700 mb-2">{t("no_products_found", "No Products Found")}</h3>
                <p className="text-red-600 mb-6">{errorHome}</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button 
                    onClick={getHomeProducts}
                    className="btn-modern-primary"
                  >
                    {t("try_again", "Try Again")}
                  </button>
                  <button 
                    onClick={() => window.location.href = '/products'}
                    className="border-2 border-brand-primary text-brand-primary px-6 py-3 rounded-xl hover:bg-brand-primary hover:text-white transition-all duration-300"
                  >
                    {t("browse_all_products", "Browse All Products")}
                  </button>
                </div>
              </div>
            ) : homeProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                {homeProducts.map((product) => (
                  <ProductCard key={product.id || product._id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-6xl mb-6">🚀</div>
                <h3 className="text-2xl font-bold text-text-primary mb-4">{t("coming_soon", "Coming Soon!")}</h3>
                <p className="text-lg text-text-secondary mb-8">{t("no_products_available", "We're working hard to bring you amazing products")}</p>
                <button 
                  onClick={() => window.location.href = '/contact'}
                  className="btn-modern-primary"
                >
                  {t("get_notified", "Get Notified")}
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
});

// Set display name for debugging  
Home.displayName = 'Home';

export default Home;
