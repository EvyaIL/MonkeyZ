import React from 'react';
import { useNavigate } from 'react-router-dom';

const BestSellersSection = ({ products, loading, error, t }) => {
  const navigate = useNavigate();
  
  if (loading) {
    return (
      <div className="flex justify-center py-8 w-full animate-pulse">
        <div className="h-64 w-full max-w-4xl bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-6 text-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }
  
  if (!products || products.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-6 text-center">
        <p>{t("no_products_available")}</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-6 animate-fadeIn">
      <h2 className="text-2xl font-bold mb-6 text-center text-primary dark:text-accent">{t("best_sellers")}</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <div 
            key={product.id} 
            className="relative bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer card-hover-effect"
            onClick={() => navigate(`/product/${product.id}`)}
          >
            <div className="relative aspect-w-1 aspect-h-1 bg-gray-100 dark:bg-gray-800">
              <img 
                src={product.image || "https://placehold.co/400x400/e2e8f0/475569?text=MonkeyZ+Product"} 
                alt={product.name?.en || product.name || t("product_image")}
                className="object-cover w-full h-full"
                onError={(e) => {
                  e.target.src = "https://placehold.co/400x400/e2e8f0/475569?text=MonkeyZ+Product";
                }}
              />
              <div className="absolute top-0 right-0 bg-primary dark:bg-accent text-white text-sm font-bold px-2 py-1 m-2 rounded">
                ₪{product.price?.toFixed(2) || '0.00'}
              </div>
            </div>
            
            <div className="p-4">
              <h3 className="font-bold text-gray-800 dark:text-white mb-1 line-clamp-2">
                {product.name?.en || product.name || t("unnamed_product")}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2">
                {product.description?.en || product.description || t("no_description")}
              </p>
              
              <button 
                className="mt-3 w-full bg-primary dark:bg-accent hover:bg-primary-dark dark:hover:bg-accent-dark text-white py-2 px-4 rounded transition-colors duration-200"
                onClick={(e) => {
                  e.stopPropagation();
                  // Add to cart functionality here
                }}
              >
                {t("add_to_cart")}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BestSellersSection;
