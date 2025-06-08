import React, { useState, useEffect } from 'react';
import { apiService } from '../lib/apiService';
import ProductCard from '../components/product/ProductCard';
import Spinner from '../components/Spinner';
// Fallback products removed to ensure only real products from API are used
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

// This is a special test page to verify product tags display correctly
const ProductTagTestPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [testResults, setTestResults] = useState({});
  const { t } = useTranslation();

  // Fetch real products from API for testing
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // Test all API endpoints
        const results = {};
        
        // Test homepage products
        try {
          const { data: homepageData, error: homepageError } = await apiService.get('/product/homepage');
          results.homepage = {
            success: !homepageError && Array.isArray(homepageData) && homepageData.length > 0,
            count: Array.isArray(homepageData) ? homepageData.length : 0,
            error: homepageError ? String(homepageError) : null,
            data: Array.isArray(homepageData) && homepageData.length > 0 ? homepageData.slice(0, 2) : []
          };
        } catch (err) {
          results.homepage = { success: false, error: String(err), count: 0, data: [] };
        }
        
        // Test best sellers
        try {
          const { data: bestSellerData, error: bestSellerError } = await apiService.get('/product/best-sellers');
          results.bestSellers = {
            success: !bestSellerError && Array.isArray(bestSellerData) && bestSellerData.length > 0,
            count: Array.isArray(bestSellerData) ? bestSellerData.length : 0,
            error: bestSellerError ? String(bestSellerError) : null,
            data: Array.isArray(bestSellerData) && bestSellerData.length > 0 ? bestSellerData.slice(0, 2) : []
          };
        } catch (err) {
          results.bestSellers = { success: false, error: String(err), count: 0, data: [] };
        }
        
        // Test recent products
        try {
          const { data: recentData, error: recentError } = await apiService.get('/product/recent');
          results.recent = {
            success: !recentError && Array.isArray(recentData) && recentData.length > 0,
            count: Array.isArray(recentData) ? recentData.length : 0,
            error: recentError ? String(recentError) : null,
            data: Array.isArray(recentData) && recentData.length > 0 ? recentData.slice(0, 2) : []
          };
        } catch (err) {
          results.recent = { success: false, error: String(err), count: 0, data: [] };
        }
        
        // Test all products
        try {
          const { data: allData, error: allError } = await apiService.get('/product/all');
          results.all = {
            success: !allError && Array.isArray(allData) && allData.length > 0,
            count: Array.isArray(allData) ? allData.length : 0,
            error: allError ? String(allError) : null,
            data: Array.isArray(allData) && allData.length > 0 ? allData.slice(0, 2) : []
          };
          
          if (Array.isArray(allData) && allData.length > 0) {
            setProducts(allData);          } else {
            // Using empty array instead of fallback products
            setProducts([]);
            setError('No products returned from API');
          }
        } catch (err) {
          results.all = { success: false, error: String(err), count: 0, data: [] };          // Using empty array instead of fallback products
          setProducts([]);
          setError(`API error: ${err.message}`);
        }
        
        setTestResults(results);
      } catch (err) {        setError(`Failed to fetch products: ${err.message}`);
        // Using empty array instead of fallback products
        setProducts([]);
      }
      setLoading(false);
    };

    fetchProducts();
  }, []);

  // Check if tags are correctly displayed in ProductCard
  const checkTagDisplay = (product) => {
    const isNew = product.isNew || product.is_new || false;
    const isBestSeller = product.isBestSeller || product.best_seller || false;
    const discountPercentage = product.discountPercentage || 0;
    
    return {
      isNew,
      isBestSeller,
      discountPercentage,
      shouldShowNewTag: isNew,
      shouldShowBestSellerTag: isBestSeller,
      shouldShowDiscountTag: discountPercentage > 0
    };
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Product Tags Test Page</h1>
      
      {/* Quick links */}
      <div className="mb-8 flex justify-center gap-4 flex-wrap">
        <Link to="/" className="px-4 py-2 bg-accent text-white rounded-md">Home</Link>
        <Link to="/products" className="px-4 py-2 bg-accent text-white rounded-md">All Products</Link>
      </div>
      
      {/* API Test Results */}
      <div className="mb-12 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">API Test Results</h2>
        
        {Object.keys(testResults).length === 0 ? (
          <p className="text-yellow-500">API tests pending...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(testResults).map(([endpoint, result]) => (
              <div key={endpoint} className={`p-4 rounded-lg ${result.success ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                <h3 className="text-xl font-semibold mb-2">
                  {endpoint.charAt(0).toUpperCase() + endpoint.slice(1)} Endpoint
                </h3>
                <div className="space-y-2">
                  <p>
                    Status: 
                    <span className={result.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                      {' '}{result.success ? '✅ Success' : '❌ Failed'}
                    </span>
                  </p>
                  <p>Products Count: {result.count}</p>
                  {result.error && <p className="text-red-600 dark:text-red-400">Error: {result.error}</p>}
                  
                  {/* Sample data preview */}
                  {result.data && result.data.length > 0 && (
                    <div className="mt-2">
                      <p className="font-medium">Sample Product Tags:</p>
                      {result.data.map((item, i) => {
                        const tags = checkTagDisplay(item);
                        return (
                          <div key={i} className="text-sm mt-1 pl-2 border-l-2 border-gray-300">
                            {item.name} - 
                            {tags.shouldShowNewTag && <span className="ml-1 text-green-600 dark:text-green-400">New</span>}
                            {tags.shouldShowBestSellerTag && <span className="ml-1 text-amber-600 dark:text-amber-400">Best Seller</span>}
                            {tags.shouldShowDiscountTag && <span className="ml-1 text-red-600 dark:text-red-400">{item.discountPercentage}% OFF</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>      {/* Test Products Info */}
      <div className="mb-12 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Product Tag Testing</h2>
        
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-blue-700 dark:text-blue-300">
            This page now only shows real products from the API. Test products have been removed to ensure
            only actual database products are displayed. Create products with different tag combinations
            in the admin panel to test tag display functionality.
          </p>
        </div>
      </div>
      
      {/* Real Products Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Real Products from API</h2>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>        ) : error ? (
          <div className="text-center py-6">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <p className="font-medium">No products available from API.</p>
          </div>
        ) : (
          <p className="mb-4 text-green-600 dark:text-green-400">✅ Successfully loaded {products.length} products from API</p>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.slice(0, 6).map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
      
      <div className="mt-8 text-center">
        <p className="text-gray-500">
          This test page verifies that product tags display correctly for both snake_case and camelCase field naming conventions.
        </p>
      </div>
    </div>
  );
};

export default ProductTagTestPage;
