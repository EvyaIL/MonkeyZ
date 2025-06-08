// Test script to verify product tag display
import React, { useEffect, useState } from 'react';
import ProductCard from './components/product/ProductCard';
import ProductShowcase from './components/product/ProductShowcase';
import Spinner from './components/Spinner';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import { BrowserRouter as Router } from 'react-router-dom';
import { GlobalProvider } from './context/GlobalProvider';
import { apiService } from './lib/apiService';

// Component to test product display with real API data
const ProductDisplayTester = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch real products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await apiService.get('/product/all');
        if (error || !data) {
          setError('Error fetching products from API: ' + (error || 'No data returned'));
          setProducts([]);
        } else {
          console.log(`Loaded ${data.length} products from API`);
          
          // Log product flags for verification
          data.forEach(product => {
            console.log(`\nProduct: ${product.name}`);
            console.log(`Flags: ${JSON.stringify({
              isNew: product.isNew || product.is_new || false, 
              isBestSeller: product.isBestSeller || product.best_seller || false,
              discountPercentage: product.discountPercentage || product.discount_percentage || 0,
              inStock: product.inStock !== false
            })}`);
          });
          
          setProducts(data);
        }
      } catch (err) {
        console.error('Exception when fetching products:', err);
        setError('Exception when fetching products: ' + err.message);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
        <p className="ml-2">Loading products from API...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded-lg">
        <p className="font-bold">Error</p>
        <p>{error}</p>
        <p className="mt-4">
          No hardcoded products are available as fallbacks.
          Please ensure your backend API is running and contains products.
        </p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="p-4 bg-yellow-100 text-yellow-700 rounded-lg">
        <p className="font-bold">No Products Found</p>
        <p>
          No products were returned from the API. Please add products through the admin panel.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-xl font-bold mb-4">ProductCard Component Test</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.slice(0, 6).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
      
      <div>
        <h2 className="text-xl font-bold mb-4">ProductShowcase Component Test</h2>
        <ProductShowcase products={products.slice(0, 6)} title="Test Products" />
      </div>
    </div>
  );
};

console.log('Starting product display test with real API products...');
console.log('No hardcoded product data is used.');

export default ProductDisplayTester;
