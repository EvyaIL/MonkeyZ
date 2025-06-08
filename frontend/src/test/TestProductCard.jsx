// Test script for ProductCard tag recognition
import React, { useState, useEffect } from 'react';
import { apiService } from '../lib/apiService';
import ProductCard from '../components/product/ProductCard';
import Spinner from '../components/Spinner';

export default function TestProductCard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data, error } = await apiService.get('/product/all');
        if (error || !data || !Array.isArray(data)) {
          setError('Failed to load products from API');
          setProducts([]);
        } else {
          console.log(`Loaded ${data.length} products from API`);
          // Analyze the products to check tag properties
          data.forEach(product => {
            console.log(`Product: ${product.name}`);
            console.log(` - isNew/is_new: ${product.isNew || product.is_new || false}`);
            console.log(` - isBestSeller/best_seller: ${product.isBestSeller || product.best_seller || false}`);
            console.log(` - discountPercentage: ${product.discountPercentage || 0}`);
            console.log('-------------------------------------------------------------');
          });
          
          setProducts(data);
        }
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(`Error: ${err.message}`);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }
    
    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Product Tag Testing</h1>
        <Spinner />
        <p className="mt-4">Loading products from API...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Product Tag Testing</h1>
        <div className="text-red-600 p-4 bg-red-100 rounded-md">
          {error}
        </div>
        <p className="mt-4">Unable to display product cards without data from API.</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Product Tag Testing</h1>
      {products.length === 0 ? (
        <div className="text-yellow-600 p-4 bg-yellow-100 rounded-md">
          No products found in database. Please add products through the admin panel.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
