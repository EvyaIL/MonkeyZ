import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { apiService } from '../../../lib/apiService';

const AdminProducts = () => {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const { data: adminProducts } = await apiService.get('/admin/products');
      if (adminProducts) setProducts(adminProducts);
    } catch (err) {
      console.error('Error loading products:', err);
      setError(t('admin.loadError'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

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
    };

    try {      if (!productData.name.en && !productData.name.he) {
        setError(t('admin.nameRequired'));
        return;
      }      setIsLoading(true);
      setError("");
      
      if (editingProduct?.id) {
        await apiService.put(`/admin/products/${editingProduct.id}`, productData);
      } else {
        await apiService.post('/admin/products', productData);
      }
      
      await loadProducts();
      setEditingProduct(null);
    } catch (error) {
      console.error('Error saving product:', error);
      setError(t('admin.saveError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="mb-6">
        <button
          onClick={() => setEditingProduct({})}
          className="bg-accent text-white px-4 py-2 rounded hover:bg-accent/80 transition-colors"
          disabled={isLoading}
        >
          {t('admin.addNewProduct')}
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      ) : (
        <>
          {editingProduct && (
            <form onSubmit={handleProductSubmit} className="mb-8 space-y-4 bg-white dark:bg-gray-700 p-6 rounded-lg shadow">
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
            </form>
          )}

          <div className="grid grid-cols-1 gap-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white dark:bg-gray-700 rounded-lg shadow p-4 flex items-center justify-between"
              >
                <div className="flex items-center space-x-4">
                  <div className="relative w-16 h-16">
                    <img
                      src={product.image || 'https://via.placeholder.com/100?text=Product'}
                      alt=""
                      className="w-16 h-16 object-cover rounded"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/100?text=Product';
                      }}
                    />
                    {product.inStock === false && (
                      <div className="absolute top-0 right-0 bg-red-500 text-white text-xs px-1 rounded-bl">
                        {t('admin.outOfStock')}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-medium">
                      <span dir="ltr" className="inline-block mr-2">
                        {typeof product.name === 'object' ? product.name.en : product.name}
                      </span>
                      <span dir="rtl" className="inline-block">
                        {typeof product.name === 'object' ? product.name.he : ''}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-300">
                      ₪{product.price}
                      {product.discountPercentage > 0 && (
                        <span className="ml-2 text-green-500">
                          -{product.discountPercentage}%
                        </span>
                      )}
                    </p>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {product.category}
                      {product.isNew && (
                        <span className="ml-2 text-accent">
                          {t('admin.new')}
                        </span>
                      )}
                      {product.isBestSeller && (
                        <span className="ml-2 text-yellow-500">
                          {t('admin.bestSeller')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setEditingProduct(product)}
                    className="p-2 text-accent hover:text-accent/80"
                    title={t('admin.edit')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                  <button
                    onClick={async () => {
                      if (window.confirm(t('admin.confirmDelete'))) {
                        await apiService.delete(`/admin/products/${product.id}`);
                        await loadProducts();
                      }
                    }}
                    className="p-2 text-red-500 hover:text-red-600"
                    title={t('admin.delete')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminProducts;
