import { useState, useEffect } from 'react';
import { useGlobalProvider } from '../context/GlobalProvider';
import { apiService } from '../lib/apiService';
import { useTranslation } from 'react-i18next';

const AdminDashboard = () => {
  const { user } = useGlobalProvider();
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [activeTab, setActiveTab] = useState('products');
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCoupon, setEditingCoupon] = useState(null);

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        // Load all products for admin
        const { data: productData } = await apiService.get('/admin/products');
        if (productData) setProducts(productData);

        // Load all coupons
        const { data: couponData } = await apiService.get('/admin/coupons');
        if (couponData) setCoupons(couponData);
      } catch (error) {
        console.error('Error loading admin data:', error);
      }
    };

    loadAdminData();
  }, []);

  const handleProductSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    try {
      if (editingProduct) {
        await apiService.put(`/admin/products/${editingProduct.id}`, formData);
      } else {
        await apiService.post('/admin/products', formData);
      }
      
      // Refresh products list
      const { data } = await apiService.get('/admin/products');
      if (data) setProducts(data);
      
      setEditingProduct(null);
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleCouponSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    try {
      if (editingCoupon) {
        await apiService.put(`/admin/coupons/${editingCoupon.id}`, formData);
      } else {
        await apiService.post('/admin/coupons', formData);
      }
      
      // Refresh coupons list
      const { data } = await apiService.get('/admin/coupons');
      if (data) setCoupons(data);
      
      setEditingCoupon(null);
    } catch (error) {
      console.error('Error saving coupon:', error);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-base-200 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-accent mb-6">
            {t('admin.title')} - {user.username}
          </h1>

          {/* Admin Navigation */}
          <div className="flex space-x-4 mb-6 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('products')}
              className={`pb-2 font-medium transition-colors ${
                activeTab === 'products'
                  ? 'border-b-2 border-accent text-accent'
                  : 'text-gray-500 hover:text-accent'
              }`}
            >
              {t('admin.products')}
            </button>
            <button
              onClick={() => setActiveTab('coupons')}
              className={`pb-2 font-medium transition-colors ${
                activeTab === 'coupons'
                  ? 'border-b-2 border-accent text-accent'
                  : 'text-gray-500 hover:text-accent'
              }`}
            >
              {t('admin.coupons')}
            </button>
          </div>

          {/* Products Management */}
          {activeTab === 'products' && (
            <div>
              <div className="mb-6">
                <button
                  onClick={() => setEditingProduct({})}
                  className="bg-accent text-white px-4 py-2 rounded hover:bg-accent/80 transition-colors"
                >
                  {t('admin.addNewProduct')}
                </button>
              </div>

              {editingProduct && (
                <form onSubmit={handleProductSubmit} className="mb-8 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t('admin.productName')}
                      </label>
                      <input
                        type="text"
                        name="name"
                        defaultValue={editingProduct.name}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-accent focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t('admin.price')}
                      </label>
                      <input
                        type="number"
                        name="price"
                        defaultValue={editingProduct.price}
                        step="0.01"
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-accent focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t('admin.description')}
                    </label>
                    <textarea
                      name="description"
                      defaultValue={editingProduct.description}
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-accent focus:border-transparent"
                      rows="3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t('admin.discount')}
                      </label>
                      <input
                        type="number"
                        name="discountPercentage"
                        defaultValue={editingProduct.discountPercentage}
                        min="0"
                        max="100"
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-accent focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t('admin.tags')}
                      </label>
                      <input
                        type="text"
                        name="tags"
                        defaultValue={editingProduct.tags?.join(', ')}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-accent focus:border-transparent"
                        placeholder="tag1, tag2, tag3"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t('admin.image')}
                      </label>
                      <input
                        type="file"
                        name="image"
                        accept="image/*"
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-accent focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="isNew"
                        defaultChecked={editingProduct.isNew}
                        className="mr-2"
                      />
                      {t('admin.markAsNew')}
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="isBestSeller"
                        defaultChecked={editingProduct.isBestSeller}
                        className="mr-2"
                      />
                      {t('admin.markAsBestSeller')}
                    </label>
                  </div>
                  <div className="flex justify-end space-x-4">
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
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div>
                        <h3 className="font-medium">{product.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-300">
                          ₪{product.price}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingProduct(product)}
                        className="p-2 text-accent hover:text-accent/80"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      <button
                        onClick={async () => {
                          if (window.confirm(t('admin.confirmDelete'))) {
                            await apiService.delete(`/admin/products/${product.id}`);
                            const { data } = await apiService.get('/admin/products');
                            if (data) setProducts(data);
                          }
                        }}
                        className="p-2 text-red-500 hover:text-red-600"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Coupons Management */}
          {activeTab === 'coupons' && (
            <div>
              <div className="mb-6">
                <button
                  onClick={() => setEditingCoupon({})}
                  className="bg-accent text-white px-4 py-2 rounded hover:bg-accent/80 transition-colors"
                >
                  {t('admin.addNewCoupon')}
                </button>
              </div>

              {editingCoupon && (
                <form onSubmit={handleCouponSubmit} className="mb-8 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t('admin.couponCode')}
                      </label>
                      <input
                        type="text"
                        name="code"
                        defaultValue={editingCoupon.code}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-accent focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t('admin.discount')}
                      </label>
                      <input
                        type="number"
                        name="discountPercentage"
                        defaultValue={editingCoupon.discountPercentage}
                        min="0"
                        max="100"
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-accent focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t('admin.startDate')}
                      </label>
                      <input
                        type="date"
                        name="startDate"
                        defaultValue={editingCoupon.startDate}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-accent focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t('admin.endDate')}
                      </label>
                      <input
                        type="date"
                        name="endDate"
                        defaultValue={editingCoupon.endDate}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-accent focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {t('admin.description')}
                    </label>
                    <textarea
                      name="description"
                      defaultValue={editingCoupon.description}
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-accent focus:border-transparent"
                      rows="3"
                    />
                  </div>
                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => setEditingCoupon(null)}
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
                {coupons.map((coupon) => (
                  <div
                    key={coupon.id}
                    className="bg-white dark:bg-gray-700 rounded-lg shadow p-4 flex items-center justify-between"
                  >
                    <div>
                      <h3 className="font-medium">{coupon.code}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-300">
                        {coupon.discountPercentage}% off
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-300">
                        {new Date(coupon.startDate).toLocaleDateString()} - {new Date(coupon.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingCoupon(coupon)}
                        className="p-2 text-accent hover:text-accent/80"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      <button
                        onClick={async () => {
                          if (window.confirm(t('admin.confirmDelete'))) {
                            await apiService.delete(`/admin/coupons/${coupon.id}`);
                            const { data } = await apiService.get('/admin/coupons');
                            if (data) setCoupons(data);
                          }
                        }}
                        className="p-2 text-red-500 hover:text-red-600"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
