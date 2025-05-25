import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { apiService } from '../../../lib/apiService';

function AdminProducts() {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await apiService.get('/admin/products');
      
      // Log the response for debugging
      console.log('Products API response:', response);
      
      if (response.error) {
        setError(response.error || t('admin.loadError'));
        return;
      }
      
      // Handle different response structures
      let productsList = [];
      if (Array.isArray(response.data)) {
        productsList = response.data;
      } else if (response.data && Array.isArray(response.data.products)) {
        productsList = response.data.products;
      } else if (response.data && typeof response.data === 'object') {
        productsList = Object.values(response.data);
      }
      
      // Ensure each product has an id
      const productsWithIds = productsList.map(product => ({
        ...product,
        id: product.id || product._id || Math.random().toString(36).substr(2, 9)
      }));
      
      setProducts(productsWithIds);
      console.log('Processed products:', productsWithIds);
    } catch (err) {
      console.error('Error loading products:', err);
      setError(t('admin.loadError') || 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  }, [t, apiService]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleProductSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    const productData = {
      name: {
        en: formData.get('name_en'),
        he: formData.get('name_he')
      },
      description: {
        en: formData.get('description_en'),
        he: formData.get('description_he')
      },
      price: parseFloat(formData.get('price')),
      category: formData.get('category'),
      image: formData.get('imageUrl') || formData.get('image'),
      isNew: formData.get('isNew') === 'on',
      isBestSeller: formData.get('isBestSeller') === 'on',
      discountPercentage: parseInt(formData.get('discountPercentage') || '0'),
      tags: formData.get('tags') ? formData.get('tags').split(',').map(tag => tag.trim()) : [],
      inStock: formData.get('inStock') !== 'off',
      active: true
    };    try {
      if (!productData.name.en && !productData.name.he) {
        setError(t('admin.nameRequired') || 'Product name is required');
        return;
      }
      
      setIsLoading(true);
      setError("");
      
      let response;
      
      console.log('Submitting product data:', productData);
      
      if (editingProduct?.id) {
        response = await apiService.put(`/admin/products/${editingProduct.id}`, productData);
        console.log('Update product response:', response);
      } else {
        response = await apiService.post('/admin/products', productData);
        console.log('Create product response:', response);
      }
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Show success message
      setError(`Product ${editingProduct?.id ? 'updated' : 'created'} successfully!`);
      setTimeout(() => setError(""), 3000);
      
      await loadProducts();
      setEditingProduct(null);
    } catch (error) {
      console.error('Error saving product:', error);
      setError(error.message || t('admin.saveError') || 'Failed to save product');
    } finally {
      setIsLoading(false);
    }
  };

  return (    <div>
      {error && (
        <div 
          className={`px-4 py-3 rounded relative mb-4 transition-all duration-300 ${
            error.includes('successfully') 
              ? 'bg-green-100 border border-green-400 text-green-700' 
              : 'bg-red-100 border border-red-400 text-red-700'
          }`} 
          role="alert"
        >
          <span className="block sm:inline">{error}</span>
          <span 
            className="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer"
            onClick={() => setError("")}
          >
            <svg className="fill-current h-6 w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
          </span>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{t('admin.manageProducts', 'Manage Products')}</h2>
        
        <div className="flex gap-3">
          <button
            onClick={() => loadProducts()}
            className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white px-4 py-2 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
              </span>
            ) : (
              <span className="flex items-center">
                <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </span>
            )}
          </button>
          
          <button
            onClick={() => setEditingProduct({})}
            className="bg-accent text-white px-4 py-2 rounded hover:bg-accent/80 transition-colors"
            disabled={isLoading}
          >
            <span className="flex items-center">
              <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {t('admin.addNewProduct', 'Add New Product')}
            </span>
          </button>
        </div>
      </div>
        <div className="mb-4 flex flex-wrap justify-between items-center gap-4">
        <div className="text-sm text-gray-500">
          {products.length} products found
        </div>
        
        <div className="flex flex-wrap gap-3">
          {/* Search input */}
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search products..."
              className="pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-accent focus:border-transparent"
              onChange={(e) => {
                const searchTerm = e.target.value.toLowerCase();
                if (!searchTerm) {
                  loadProducts(); // Reset to all products
                  return;
                }
                
                // Filter products by search term
                const filtered = products.filter(product => {
                  const name = (product.name?.en || product.name || '').toLowerCase();
                  const hebrewName = (product.name?.he || '').toLowerCase();
                  const description = (product.description?.en || product.description || '').toLowerCase();
                  return name.includes(searchTerm) || 
                         hebrewName.includes(searchTerm) || 
                         description.includes(searchTerm) ||
                         (product.category && product.category.toLowerCase().includes(searchTerm));
                });
                setProducts(filtered);
              }}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          
          {/* Category filter */}
          <select 
            className="px-4 py-2 border rounded-md focus:ring-2 focus:ring-accent focus:border-transparent"
            onChange={(e) => {
              const category = e.target.value;
              if (category === "all") {
                loadProducts(); // Reset to all products
                return;
              }
              
              // Filter products by category
              const filtered = products.filter(product => 
                product.category?.toLowerCase() === category.toLowerCase()
              );
              setProducts(filtered);
            }}
          >
            <option value="all">All Categories</option>
            {/* Extract unique categories from products */}
            {Array.from(new Set(products.map(p => p.category).filter(Boolean))).map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          
          {/* Sort options */}
          <select 
            className="px-4 py-2 border rounded-md focus:ring-2 focus:ring-accent focus:border-transparent"
            onChange={(e) => {
              const sortMethod = e.target.value;
              const productsCopy = [...products];
              
              switch(sortMethod) {
                case "price-low":
                  productsCopy.sort((a, b) => a.price - b.price);
                  break;
                case "price-high":
                  productsCopy.sort((a, b) => b.price - a.price);
                  break;
                case "new":
                  productsCopy.sort((a, b) => a.isNew ? -1 : b.isNew ? 1 : 0);
                  break;
                case "bestseller":
                  productsCopy.sort((a, b) => a.isBestSeller ? -1 : b.isBestSeller ? 1 : 0);
                  break;
                case "name":
                  productsCopy.sort((a, b) => {
                    const nameA = (a.name?.en || a.name || '').toLowerCase();
                    const nameB = (b.name?.en || b.name || '').toLowerCase();
                    return nameA.localeCompare(nameB);
                  });
                  break;
                default:
                  // Default sort by most recently added/updated
                  productsCopy.sort((a, b) => {
                    const dateA = new Date(a.updatedAt || a.createdAt || 0);
                    const dateB = new Date(b.updatedAt || b.createdAt || 0);
                    return dateB - dateA;
                  });
              }
              
              setProducts(productsCopy);
            }}
          >
            <option value="recent">Most Recent</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="name">Name: A to Z</option>
            <option value="new">New Items First</option>
            <option value="bestseller">Best Sellers First</option>
          </select>
        </div>
      </div>{isLoading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      ) : (
        <>
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8 ${editingProduct ? 'opacity-50' : ''}`}>
            {products.map(product => (
              <div 
                key={product.id || product._id} 
                className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-md overflow-hidden transition-transform hover:shadow-lg cursor-pointer"
                onClick={() => setEditingProduct(product)}
              >
                <div className="relative h-48 bg-gray-200 dark:bg-gray-800">
                  {product.image ? (
                    <img 
                      src={product.image} 
                      alt={product.name?.en || product.name || 'Product'} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null; 
                        e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <span>No image</span>
                    </div>
                  )}
                  
                  {product.discountPercentage > 0 && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md">
                      {product.discountPercentage}% OFF
                    </div>
                  )}
                  
                  {product.isNew && (
                    <div className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-md">
                      NEW
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <div className="flex justify-between">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 line-clamp-1">
                      {product.name?.en || product.name || 'Unnamed Product'}
                    </h3>
                    
                    <div className="flex gap-1">
                      {/* Edit button */}
                      <button 
                        className="text-blue-600 hover:text-blue-800 p-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingProduct(product);
                        }}
                      >
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      
                      {/* Delete button */}
                      <button 
                        className="text-red-600 hover:text-red-800 p-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Are you sure you want to delete "${product.name?.en || product.name}"?`)) {
                            // Delete product
                            (async () => {
                              setIsLoading(true);
                              try {
                                const response = await apiService.delete(`/admin/products/${product.id || product._id}`);
                                if (response.error) {
                                  setError(response.error);
                                } else {
                                  setError('Product deleted successfully!');
                                  loadProducts();
                                  setTimeout(() => setError(''), 3000);
                                }
                              } catch (err) {
                                console.error('Error deleting product:', err);
                                setError('Failed to delete product');
                              } finally {
                                setIsLoading(false);
                              }
                            })();
                          }
                        }}
                      >
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {product.name?.he && (
                    <h4 className="text-md text-gray-600 dark:text-gray-300 font-medium line-clamp-1" dir="rtl">
                      {product.name.he}
                    </h4>
                  )}
                  
                  <div className="flex justify-between items-center mt-2">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-lg ${product.discountPercentage > 0 ? 'text-accent' : 'text-gray-800 dark:text-white'}`}>
                        ${product.price - (product.price * (product.discountPercentage || 0) / 100)}
                      </span>
                      
                      {product.discountPercentage > 0 && (
                        <span className="text-gray-500 line-through text-sm">
                          ${product.price}
                        </span>
                      )}
                    </div>
                    
                    <div className={`text-xs px-2 py-1 rounded ${product.inStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {product.inStock ? 'In Stock' : 'Out of Stock'}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mt-2">
                    {product.category && (
                      <span className="bg-gray-200 dark:bg-gray-600 text-xs px-2 py-1 rounded">
                        {product.category}
                      </span>
                    )}
                    {product.isBestSeller && (
                      <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100 text-xs px-2 py-1 rounded">
                        Best Seller
                      </span>
                    )}
                  </div>
                  
                  {/* Action buttons */}
                  <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between">
                    <button
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`/product/${product.slug || product.id || product._id}`, '_blank');
                      }}
                    >
                      <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View
                    </button>
                    
                    <button
                      className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        
                        // Clone product and create a duplicate
                        const duplicate = { ...product };
                        delete duplicate.id;
                        delete duplicate._id;
                        
                        if (duplicate.name) {
                          if (typeof duplicate.name === 'string') {
                            duplicate.name = `${duplicate.name} (Copy)`;
                          } else {
                            duplicate.name = {
                              ...duplicate.name,
                              en: `${duplicate.name.en || ''} (Copy)`,
                              he: duplicate.name.he ? `${duplicate.name.he} (העתק)` : ''
                            };
                          }
                        }
                        
                        setEditingProduct(duplicate);
                      }}
                    >
                      <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Duplicate
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Add new product card */}
            <div 
              className="bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center h-full min-h-[300px] cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              onClick={() => setEditingProduct({})}
            >
              <div className="text-center p-4">
                <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-white text-2xl mx-auto mb-2">
                  +
                </div>
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Add New Product</h3>
              </div>
            </div>
          </div>

          {editingProduct && (
            <form onSubmit={handleProductSubmit} className="mb-8 space-y-4 bg-white dark:bg-gray-700 p-6 rounded-lg shadow sticky top-4 z-10">
              <h3 className="text-lg font-semibold mb-4">
                {editingProduct.id ? t('admin.editProduct') : t('admin.addNewProduct')}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('admin.productNameEn')}
                  </label>
                  <input
                    type="text"
                    name="name_en"
                    defaultValue={editingProduct.name?.en || editingProduct.name}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-accent focus:border-transparent"
                    required
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('admin.productNameHe')}
                  </label>
                  <input
                    type="text"
                    name="name_he"
                    defaultValue={editingProduct.name?.he}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-accent focus:border-transparent"
                    required
                    dir="rtl"
                  />
                </div>
              </div>

              {/* More form fields... */}

              <div className="flex justify-end space-x-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 border rounded hover:bg-gray-100 transition-colors"
                >
                  {t('admin.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-accent text-white rounded hover:bg-accent/80 transition-colors"
                >
                  {t('admin.save')}
                </button>
              </div>
            </form>          )}
        </>
      )}
    </div>
  );
}

export default AdminProducts;
