// Test script to verify product display in frontend
import React, { useEffect, useState } from 'react';
import ProductCard from '../components/product/ProductCard';
import ProductShowcase from '../components/product/ProductShowcase';
import { apiService } from '../lib/apiService';
// Fallback products removed to ensure only real products from API are used

const ProductDisplayTest = () => {
  const [apiProducts, setApiProducts] = useState([]);
  const [homepageProducts, setHomepageProducts] = useState([]);
  const [bestSellerProducts, setBestSellerProducts] = useState([]);
  const [recentProducts, setRecentProducts] = useState([]);
  const [adminProducts, setAdminProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const results = {};

      // Test admin products API (to see if products exist in admin)
      try {
        console.log("🔧 Fetching admin products from /admin/products");
        const { data, error } = await apiService.get("/admin/products");
        
        console.log("🔧 Admin API Response:", { data, error, dataType: typeof data, isArray: Array.isArray(data), count: data?.length });
        
        if (error || !data) {
          console.error("❌ Error fetching admin products:", error);
          results.admin = { error: true, message: error || "No data returned" };
          setAdminProducts([]);
        } else {
          console.log("✅ Successfully fetched admin products:", data.length, "products");
          if (data.length > 0) {
            console.log("📊 Sample admin product:", data[0]);
            console.log("📊 Admin product tags check:", {
              displayOnHomepage: data[0].displayOnHomepage || data[0].display_on_homepage,
              isBestSeller: data[0].isBestSeller || data[0].best_seller,
              isNew: data[0].isNew || data[0].is_new,
              active: data[0].active
            });
          }
          results.admin = { error: false, count: data.length };
          setAdminProducts(data);
        }      } catch (err) {
        console.error("💥 Exception fetching admin products:", err);
        results.admin = { error: true, message: err.message };
        setAdminProducts([]);
      }

      // Test all products API
      try {
        console.log("🔍 Fetching all products from /product/all");
        const { data, error } = await apiService.get("/product/all");
        
        console.log("📋 API Response:", { data, error, dataType: typeof data, isArray: Array.isArray(data) });
        
        if (error || !data) {
          console.error("❌ Error fetching all products:", error);
          results.all = { error: true, message: error || "No data returned" };
          // No fallback products - only use actual API data
          setApiProducts([]);
        } else {
          console.log("✅ Successfully fetched products:", data.length, "products");
          console.log("📊 Sample product structure:", data[0]);
          results.all = { error: false, count: data.length };
          setApiProducts(data);
        }      } catch (err) {
        console.error("💥 Exception fetching all products:", err);
        results.all = { error: true, message: err.message };
        setApiProducts([]);
      }

      // Test homepage products API
      try {
        console.log("🏠 Fetching homepage products from /product/homepage");
        const { data, error } = await apiService.get("/product/homepage");
        
        console.log("🏠 Homepage API Response:", { data, error, dataType: typeof data, isArray: Array.isArray(data), count: data?.length });
        
        if (error || !data) {
          console.error("❌ Error fetching homepage products:", error);
          results.homepage = { error: true, message: error || "No data returned" };
          // No fallback products - show empty state
          setHomepageProducts([]);
        } else {
          console.log("✅ Successfully fetched homepage products:", data.length, "products");
          if (data.length > 0) {
            console.log("📊 Sample homepage product:", data[0]);
          }
          results.homepage = { error: false, count: data.length };
          setHomepageProducts(data);
        }      } catch (err) {
        console.error("💥 Exception fetching homepage products:", err);
        results.homepage = { error: true, message: err.message };
        setHomepageProducts([]);
      }

      // Test best seller products API
      try {
        console.log("🌟 Fetching best seller products from /product/best-sellers");
        const { data, error } = await apiService.get("/product/best-sellers");
        
        console.log("🌟 Best Sellers API Response:", { data, error, dataType: typeof data, isArray: Array.isArray(data), count: data?.length });
        
        if (error || !data) {
          console.error("❌ Error fetching best seller products:", error);
          results.bestSellers = { error: true, message: error || "No data returned" };
          // No fallback products - show empty state
          setBestSellerProducts([]);
        } else {
          console.log("✅ Successfully fetched best seller products:", data.length, "products");
          if (data.length > 0) {
            console.log("📊 Sample best seller product:", data[0]);
          }
          results.bestSellers = { error: false, count: data.length };
          setBestSellerProducts(data);
        }      } catch (err) {
        console.error("💥 Exception fetching best seller products:", err);
        results.bestSellers = { error: true, message: err.message };
        setBestSellerProducts([]);
      }

      // Test recent products API
      try {
        console.log("🕒 Fetching recent products from /product/recent");
        const { data, error } = await apiService.get("/product/recent");
        
        console.log("🕒 Recent API Response:", { data, error, dataType: typeof data, isArray: Array.isArray(data), count: data?.length });
        
        if (error || !data) {
          console.error("❌ Error fetching recent products:", error);
          results.recent = { error: true, message: error || "No data returned" };
          // No fallback products - show empty state
          setRecentProducts([]);
        } else {
          console.log("✅ Successfully fetched recent products:", data.length, "products");
          if (data.length > 0) {
            console.log("📊 Sample recent product:", data[0]);
          }
          results.recent = { error: false, count: data.length };
          setRecentProducts(data);
        }
      } catch (err) {
        console.error("💥 Exception fetching recent products:", err);
        results.recent = { error: true, message: err.message };
        setRecentProducts([]);
      }

      setErrors(results);
      setLoading(false);
    }

    fetchData();
  }, []);

  // Helper function to test if product has tags
  const checkProductTags = (product) => {
    return {
      isNew: product.isNew || product.is_new || false,
      isBestSeller: product.isBestSeller || product.best_seller || false,
      displayOnHomepage: product.displayOnHomepage || product.display_on_homepage || false,
      discountPercentage: product.discountPercentage || product.discount_percentage || 0
    };
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Product Display Test</h1>
      
      {loading ? (
        <div className="text-center">Loading product data...</div>
      ) : (
        <div className="space-y-12">
          {/* API Status */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-bold mb-4">API Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-4 rounded-lg ${errors.all?.error ? 'bg-red-100 dark:bg-red-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
                <h3 className="font-bold">All Products API</h3>
                {errors.all?.error ? (
                  <p className="text-red-700 dark:text-red-300">Error: {errors.all.message}</p>
                ) : (
                  <p className="text-green-700 dark:text-green-300">Success! Found {errors.all?.count || 0} products</p>
                )}
              </div>
              
              <div className={`p-4 rounded-lg ${errors.homepage?.error ? 'bg-red-100 dark:bg-red-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
                <h3 className="font-bold">Homepage Products API</h3>
                {errors.homepage?.error ? (
                  <p className="text-red-700 dark:text-red-300">Error: {errors.homepage.message}</p>
                ) : (
                  <p className="text-green-700 dark:text-green-300">Success! Found {errors.homepage?.count || 0} products</p>
                )}
              </div>
              
              <div className={`p-4 rounded-lg ${errors.bestSellers?.error ? 'bg-red-100 dark:bg-red-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
                <h3 className="font-bold">Best Seller Products API</h3>
                {errors.bestSellers?.error ? (
                  <p className="text-red-700 dark:text-red-300">Error: {errors.bestSellers.message}</p>
                ) : (
                  <p className="text-green-700 dark:text-green-300">Success! Found {errors.bestSellers?.count || 0} products</p>
                )}
              </div>
              
              <div className={`p-4 rounded-lg ${errors.recent?.error ? 'bg-red-100 dark:bg-red-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
                <h3 className="font-bold">Recent Products API</h3>
                {errors.recent?.error ? (
                  <p className="text-red-700 dark:text-red-300">Error: {errors.recent.message}</p>
                ) : (
                  <p className="text-green-700 dark:text-green-300">Success! Found {errors.recent?.count || 0} products</p>
                )}
              </div>
              
              <div className={`p-4 rounded-lg ${errors.admin?.error ? 'bg-red-100 dark:bg-red-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
                <h3 className="font-bold">Admin Products API</h3>
                {errors.admin?.error ? (
                  <p className="text-red-700 dark:text-red-300">Error: {errors.admin.message}</p>
                ) : (
                  <p className="text-green-700 dark:text-green-300">Success! Found {errors.admin?.count || 0} products</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Sample Product Tags */}
          {apiProducts.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
              <h2 className="text-2xl font-bold mb-4">Product Tag Tests</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {apiProducts.slice(0, 3).map((product, index) => {
                  const tags = checkProductTags(product);
                  return (
                    <div key={index} className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
                      <h3 className="font-bold">{product.name}</h3>
                      <p className="text-sm mb-3">{product.description?.substring(0, 100)}...</p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>New:</span>
                          <span className={tags.isNew ? "text-green-600 dark:text-green-400" : "text-gray-500"}>
                            {tags.isNew ? "Yes" : "No"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Best Seller:</span>
                          <span className={tags.isBestSeller ? "text-amber-600 dark:text-amber-400" : "text-gray-500"}>
                            {tags.isBestSeller ? "Yes" : "No"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Homepage:</span>
                          <span className={tags.displayOnHomepage ? "text-blue-600 dark:text-blue-400" : "text-gray-500"}>
                            {tags.displayOnHomepage ? "Yes" : "No"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Discount:</span>
                          <span className={tags.discountPercentage > 0 ? "text-red-600 dark:text-red-400" : "text-gray-500"}>
                            {tags.discountPercentage > 0 ? `${tags.discountPercentage}%` : "None"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Product Card Test */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-bold mb-4">ProductCard Component Test</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {apiProducts.slice(0, 4).map((product) => (
                <ProductCard key={product.id || product._id} product={product} />
              ))}
            </div>
          </div>
          
          {/* ProductShowcase Tests */}
          {homepageProducts.length > 0 && (
            <div className="space-y-12">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
                <h2 className="text-2xl font-bold mb-4">Homepage ProductShowcase Test</h2>
                <ProductShowcase products={homepageProducts} title="Homepage Products" />
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
                <h2 className="text-2xl font-bold mb-4">Best Sellers ProductShowcase Test</h2>
                <ProductShowcase products={bestSellerProducts} title="Best Sellers" />
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
                <h2 className="text-2xl font-bold mb-4">Recent Products Test</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {recentProducts.slice(0, 4).map((product) => (
                    <ProductCard key={product.id || product._id} product={product} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductDisplayTest;
