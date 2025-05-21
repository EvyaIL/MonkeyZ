import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDropzone } from 'react-dropzone';
import { useGlobalProvider } from '../context/GlobalProvider';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faKey } from '@fortawesome/free-solid-svg-icons';

const AdminDashboard = () => {
  const { t } = useTranslation();
  const { user, notify } = useGlobalProvider();
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: { en: '', he: '' },
    description: { en: '', he: '' },
    category: '',
    price: 0,
    is_best_seller: false,
    is_new: false,
    discount_percentage: 0,
    stock_count: 0,
    keys: []
  });

  const { getRootProps, getInputProps } = useDropzone({
    accept: 'image/*',
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      const file = acceptedFiles[0];
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('/api/products/upload-image', {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          setFormData(prev => ({ ...prev, image: data.url }));
          notify({ message: t('image_uploaded'), type: 'success' });
        } else {
          throw new Error('Failed to upload');
        }
      } catch (error) {
        notify({ message: t('upload_failed'), type: 'error' });
      }
    }
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/admin/products', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = selectedProduct 
        ? `/api/admin/products/${selectedProduct.id}` 
        : '/api/admin/products';
        
      const response = await fetch(url, {
        method: selectedProduct ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        notify({ message: t(selectedProduct ? 'product_updated' : 'product_created'), type: 'success' });
        setIsModalOpen(false);
        fetchProducts();
      } else {
        throw new Error('Request failed');
      }
    } catch (error) {
      notify({ message: t('operation_failed'), type: 'error' });
    }
  };

  const handleAddKeys = async (productId) => {
    const keys = prompt(t('enter_keys'));
    if (!keys) return;

    const keyList = keys.split(',').map(key => key.trim());
    
    try {
      const response = await fetch(`/api/admin/products/${productId}/keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ keys: keyList })
      });

      if (response.ok) {
        notify({ message: t('keys_added'), type: 'success' });
        fetchProducts();
      } else {
        throw new Error('Failed to add keys');
      }
    } catch (error) {
      notify({ message: t('failed_to_add_keys'), type: 'error' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-white">{t('admin_dashboard')}</h1>
            <button
              onClick={() => {
                setSelectedProduct(null);
                setFormData({
                  name: { en: '', he: '' },
                  description: { en: '', he: '' },
                  category: '',
                  price: 0,
                  is_best_seller: false,
                  is_new: false,
                  discount_percentage: 0,
                  stock_count: 0,
                  keys: []
                });
                setIsModalOpen(true);
              }}
              className="bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent-dark transition-colors flex items-center"
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2" />
              {t('add_product')}
            </button>
          </div>

          {/* Products Table */}
          <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-700">
                  <th className="px-4 py-3 text-left text-white">{t('name')}</th>
                  <th className="px-4 py-3 text-left text-white">{t('category')}</th>
                  <th className="px-4 py-3 text-left text-white">{t('price')}</th>
                  <th className="px-4 py-3 text-left text-white">{t('stock')}</th>
                  <th className="px-4 py-3 text-left text-white">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {products.map(product => (
                  <tr key={product.id} className="hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-white">{product.name.en}</td>
                    <td className="px-4 py-3 text-white">{product.category}</td>
                    <td className="px-4 py-3 text-white">₪{product.price}</td>
                    <td className="px-4 py-3 text-white">{product.stock_count}</td>
                    <td className="px-4 py-3">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedProduct(product);
                            setFormData(product);
                            setIsModalOpen(true);
                          }}
                          className="text-accent hover:text-accent-dark transition-colors"
                          title={t('edit')}
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button
                          onClick={() => handleAddKeys(product.id)}
                          className="text-accent hover:text-accent-dark transition-colors"
                          title={t('add_keys')}
                        >
                          <FontAwesomeIcon icon={faKey} />
                        </button>
                        <button
                          onClick={async () => {
                            if (window.confirm(t('confirm_delete'))) {
                              try {
                                const response = await fetch(`/api/admin/products/${product.id}`, {
                                  method: 'DELETE',
                                  credentials: 'include'
                                });
                                if (response.ok) {
                                  notify({ message: t('product_deleted'), type: 'success' });
                                  fetchProducts();
                                } else {
                                  throw new Error('Failed to delete');
                                }
                              } catch (error) {
                                notify({ message: t('delete_failed'), type: 'error' });
                              }
                            }
                          }}
                          className="text-red-500 hover:text-red-600 transition-colors"
                          title={t('delete')}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Product Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-2xl font-bold text-white mb-6">
              {selectedProduct ? t('edit_product') : t('add_product')}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white mb-1">{t('name_en')}</label>
                  <input
                    type="text"
                    value={formData.name.en}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      name: { ...prev.name, en: e.target.value }
                    }))}
                    className="w-full bg-gray-700 text-white rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white mb-1">{t('name_he')}</label>
                  <input
                    type="text"
                    value={formData.name.he}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      name: { ...prev.name, he: e.target.value }
                    }))}
                    className="w-full bg-gray-700 text-white rounded px-3 py-2"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white mb-1">{t('description_en')}</label>
                  <textarea
                    value={formData.description.en}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      description: { ...prev.description, en: e.target.value }
                    }))}
                    className="w-full bg-gray-700 text-white rounded px-3 py-2"
                    rows={4}
                    required
                  />
                </div>
                <div>
                  <label className="block text-white mb-1">{t('description_he')}</label>
                  <textarea
                    value={formData.description.he}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      description: { ...prev.description, he: e.target.value }
                    }))}
                    className="w-full bg-gray-700 text-white rounded px-3 py-2"
                    rows={4}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white mb-1">{t('category')}</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      category: e.target.value
                    }))}
                    className="w-full bg-gray-700 text-white rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-white mb-1">{t('price')}</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      price: parseFloat(e.target.value)
                    }))}
                    className="w-full bg-gray-700 text-white rounded px-3 py-2"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_best_seller}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      is_best_seller: e.target.checked
                    }))}
                    className="mr-2"
                  />
                  <label className="text-white">{t('best_seller')}</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_new}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      is_new: e.target.checked
                    }))}
                    className="mr-2"
                  />
                  <label className="text-white">{t('new_product')}</label>
                </div>
                <div>
                  <label className="block text-white mb-1">{t('discount')}</label>
                  <input
                    type="number"
                    value={formData.discount_percentage}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      discount_percentage: parseInt(e.target.value)
                    }))}
                    className="w-full bg-gray-700 text-white rounded px-3 py-2"
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              <div {...getRootProps()} className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:border-accent transition-colors">
                <input {...getInputProps()} />
                <p className="text-white">{t('drop_image')}</p>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-white bg-gray-600 rounded hover:bg-gray-500 transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-accent rounded hover:bg-accent-dark transition-colors"
                >
                  {selectedProduct ? t('update') : t('create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
