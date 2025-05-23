import { useState, useEffect } from 'react';
import { useGlobalProvider } from '../context/GlobalProvider';
import { apiService } from '../lib/apiService';
import { useTranslation } from 'react-i18next';
import { Role } from '../models/user.ts';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useNavigate } from 'react-router-dom';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const AdminDashboard = () => {
  const { user } = useGlobalProvider();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [products, setProducts] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [orders, setOrders] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState({
    totalSales: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    dailySales: [],
  });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    if (user.role !== Role.manager) {
      navigate('/');
      return;
    }
    loadAdminData();
  }, [user, navigate]);

  const loadAdminData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load all products
      const { data: productsData, error: productsError } = await apiService.get('/admin/products');
      if (productsError) throw new Error(productsError);
      setProducts(productsData || []);

      // Load all coupons
      const { data: couponsData, error: couponsError } = await apiService.get('/admin/coupons');
      if (couponsError) throw new Error(couponsError);
      setCoupons(couponsData || []);

      // Load all orders
      const { data: ordersData, error: ordersError } = await apiService.get('/admin/orders');
      if (ordersError) throw new Error(ordersError);
      setOrders(ordersData || []);

      // Load analytics data
      const { data: analyticsData, error: analyticsError } = await apiService.get('/admin/analytics');
      if (analyticsError) throw new Error(analyticsError);
      if (analyticsData) {
        setAnalytics({
          totalSales: analyticsData.totalSales || 0,
          totalOrders: analyticsData.totalOrders || 0,
          averageOrderValue: analyticsData.averageOrderValue || 0,
          dailySales: analyticsData.dailySales || []
        });
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
      setError(error.message || t('admin.errorLoadingData'));
    } finally {
      setLoading(false);
    }
  };

  const handleProductSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      
      // Get form data
      const data = {
        name: {
          en: event.target.nameEn.value,
          he: event.target.nameHe.value
        },
        description: {
          en: event.target.descriptionEn.value,
          he: event.target.descriptionHe.value
        },
        price: parseFloat(event.target.price.value),
        category: event.target.category.value,
        discountPercentage: parseFloat(event.target.discountPercentage.value || 0),
        isNew: event.target.isNew.checked,
        best_seller: event.target.isBestSeller.checked,
        inStock: event.target.inStock.checked,
        status: 'active'
      };

      // Add product data first
      formData.append('data', JSON.stringify(data));
      
      // Add image if new one was selected
      if (imageFile) {
        formData.append('image', imageFile);
      }

      if (editingProduct?.id) {
        const { data: updatedProduct, error: updateError } = await apiService.put(`/admin/products/${editingProduct.id}`, formData);
        if (updateError) throw new Error(updateError);
      } else {
        const { data: newProduct, error: createError } = await apiService.post('/admin/products', formData);
        if (createError) throw new Error(createError);
      }

      // Refresh products list
      const { data: refreshedProducts, error: fetchError } = await apiService.get('/admin/products');
      if (fetchError) throw new Error(fetchError);
      if (refreshedProducts) setProducts(refreshedProducts);

      setEditingProduct(null);
      setImageFile(null);
      setError(null);

    } catch (error) {
      console.error('Error saving product:', error);
      setError(error.message || t('admin.errorSavingProduct'));
    } finally {
      setLoading(false);
    }
  };

  const handleProductDelete = async (productId) => {
    if (!window.confirm(t('admin.confirmDelete'))) return;
    
    try {
      await apiService.delete(`/admin/products/${productId}`);
      setProducts(products.filter(p => p.id !== productId));
    } catch (error) {
      console.error('Error deleting product:', error);
      alert(t('admin.errorDeletingProduct'));
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

  const handleOrderStatusUpdate = async (orderId, newStatus) => {
    try {
      await apiService.put(`/admin/orders/${orderId}/status`, { status: newStatus });
      const { data } = await apiService.get('/admin/orders');
      if (data) setOrders(data);
      setSelectedOrder(null);
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const filteredOrders = orders.filter(order => 
    orderStatusFilter === 'all' ? true : order.status === orderStatusFilter
  );

  const chartData = {
    labels: analytics.dailySales.map(sale => sale.date),
    datasets: [
      {
        label: t('admin.dailySales'),
        data: analytics.dailySales.map(sale => sale.amount),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }
    ]
  };

  const renderProductForm = () => (
    <form onSubmit={handleProductSubmit} className="mb-8 space-y-6 bg-gray-800 p-6 rounded-lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* English Name & Description */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg text-accent mb-4">{t('admin.englishDetails')}</h3>
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('admin.productNameEn')}
            </label>
            <input
              type="text"
              name="nameEn"
              defaultValue={editingProduct?.name?.en || ''}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:ring-2 focus:ring-accent focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('admin.descriptionEn')}
            </label>
            <textarea
              name="descriptionEn"
              defaultValue={editingProduct?.description?.en || ''}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:ring-2 focus:ring-accent focus:border-transparent"
              rows="3"
              required
            />
          </div>
        </div>

        {/* Hebrew Name & Description */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg text-accent mb-4">{t('admin.hebrewDetails')}</h3>
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('admin.productNameHe')}
            </label>
            <input
              type="text"
              name="nameHe"
              defaultValue={editingProduct?.name?.he || ''}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:ring-2 focus:ring-accent focus:border-transparent"
              required
              dir="rtl"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('admin.descriptionHe')}
            </label>
            <textarea
              name="descriptionHe"
              defaultValue={editingProduct?.description?.he || ''}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:ring-2 focus:ring-accent focus:border-transparent"
              rows="3"
              required
              dir="rtl"
            />
          </div>
        </div>
      </div>

      {/* Product Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium mb-1">
            {t('admin.price')}
          </label>
          <input
            type="number"
            name="price"
            defaultValue={editingProduct?.price || ''}
            step="0.01"
            min="0"
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:ring-2 focus:ring-accent focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            {t('admin.category')}
          </label>
          <select
            name="category"
            defaultValue={editingProduct?.category || ''}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:ring-2 focus:ring-accent focus:border-transparent"
            required
          >
            <option value="">-- {t('admin.selectCategory')} --</option>
            {['Microsoft', 'VPN', 'Security', 'Office', 'Cloud', 'Utility', 'Multimedia'].map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            {t('admin.discount')}
          </label>
          <input
            type="number"
            name="discountPercentage"
            defaultValue={editingProduct?.discountPercentage || 0}
            min="0"
            max="100"
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:ring-2 focus:ring-accent focus:border-transparent"
          />
        </div>
      </div>

      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium mb-1">
          {t('admin.productImage')}
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files[0])}
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded focus:ring-2 focus:ring-accent focus:border-transparent"
        />
        {editingProduct?.image && (
          <div className="mt-2">
            <img
              src={editingProduct.image}
              alt={t('admin.currentImage')}
              className="w-32 h-32 object-contain rounded border border-gray-600"
            />
          </div>
        )}
      </div>

      {/* Product Flags */}
      <div className="flex flex-wrap gap-6">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="isNew"
            defaultChecked={editingProduct?.isNew}
            className="form-checkbox text-accent rounded bg-gray-700 border-gray-600"
          />
          <span>{t('admin.markAsNew')}</span>
        </label>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="isBestSeller"
            defaultChecked={editingProduct?.best_seller}
            className="form-checkbox text-accent rounded bg-gray-700 border-gray-600"
          />
          <span>{t('admin.markAsBestSeller')}</span>
        </label>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="inStock"
            defaultChecked={editingProduct?.inStock !== false}
            className="form-checkbox text-accent rounded bg-gray-700 border-gray-600"
          />
          <span>{t('admin.inStock')}</span>
        </label>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => {
            setEditingProduct(null);
            setImageFile(null);
          }}
          className="px-4 py-2 border border-gray-600 rounded hover:bg-gray-700 transition-colors"
        >
          {t('admin.cancel')}
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-accent text-white rounded hover:bg-accent/80 transition-colors"
        >
          {editingProduct ? t('admin.updateProduct') : t('admin.createProduct')}
        </button>
      </div>
    </form>
  );

  if (loading) {
    return (
      <div className="min-h-screen p-6 bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-6 bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-red-500 mb-4">{t('admin.error')}</h2>
          <p className="text-gray-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-accent mb-6">
            {t('admin.title')} - {user.username}
          </h1>

          {/* Admin Navigation */}
          <div className="flex space-x-4 mb-6 border-b border-gray-700">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-2 font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'border-b-2 border-accent text-accent'
                  : 'text-gray-500 hover:text-accent'
              }`}
            >
              {t('admin.overview')}
            </button>
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
              onClick={() => setActiveTab('orders')}
              className={`pb-2 font-medium transition-colors ${
                activeTab === 'orders'
                  ? 'border-b-2 border-accent text-accent'
                  : 'text-gray-500 hover:text-accent'
              }`}
            >
              {t('admin.orders')}
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

          {/* Overview/Analytics Section */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Analytics Cards */}
                <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('admin.totalSales')}</h3>
                  <p className="text-2xl font-bold text-accent">₪{analytics.totalSales.toFixed(2)}</p>
                </div>
                <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('admin.totalOrders')}</h3>
                  <p className="text-2xl font-bold text-accent">{analytics.totalOrders}</p>
                </div>
                <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('admin.averageOrder')}</h3>
                  <p className="text-2xl font-bold text-accent">₪{analytics.averageOrderValue.toFixed(2)}</p>
                </div>
                <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('admin.activeProducts')}</h3>
                  <p className="text-2xl font-bold text-accent">{products.length}</p>
                </div>
              </div>

              {/* Sales Chart */}
              <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-4">
                <h3 className="text-lg font-medium mb-4">{t('admin.salesTrends')}</h3>
                <div className="h-64">                  <Line
                    data={chartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          grid: {
                            color: 'rgba(156, 163, 175, 0.1)',
                          },
                        },
                        x: {
                          grid: {
                            display: false,
                          },
                        },
                      },
                      plugins: {
                        legend: {
                          display: false,
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Orders Management */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex space-x-4">
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    className="border rounded p-2 focus:ring-2 focus:ring-accent focus:border-transparent"
                  >
                    <option value="all">{t('admin.allOrders')}</option>
                    <option value="pending">{t('admin.pendingOrders')}</option>
                    <option value="processing">{t('admin.processingOrders')}</option>
                    <option value="completed">{t('admin.completedOrders')}</option>
                    <option value="cancelled">{t('admin.cancelledOrders')}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">                {filteredOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white dark:bg-gray-700 rounded-lg shadow p-4"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">
                            {t('admin.orderNumber')}: #{order.id}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(order.date).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t('admin.customer')}: {order.customerName}
                          </p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            order.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                            order.status === 'processing' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                            'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          }`}>
                            {order.status}
                          </span>
                          <select
                            value={order.status}                            onChange={(e) => handleOrderStatusUpdate(order.id, e.target.value)}
                            className="border rounded p-1 text-sm focus:ring-2 focus:ring-accent focus:border-transparent"
                          >
                            <option value="pending">{t('admin.pending')}</option>
                            <option value="processing">{t('admin.processing')}</option>
                            <option value="completed">{t('admin.completed')}</option>
                            <option value="cancelled">{t('admin.cancelled')}</option>
                          </select>
                        </div>
                      </div>
                      <div className="mt-4">
                        <button
                          onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                          className="text-accent hover:text-accent/80"
                        >
                          {selectedOrder?.id === order.id ? t('admin.hideDetails') : t('admin.showDetails')}
                        </button>
                      </div>
                      {selectedOrder?.id === order.id && (
                        <div className="mt-4 space-y-4">
                          <div className="border-t pt-4">
                            <h4 className="font-medium mb-2">{t('admin.orderItems')}</h4>
                            <div className="space-y-2">
                              {order.items.map((item) => (
                                <div key={item.id} className="flex justify-between">
                                  <span>{item.name} x{item.quantity}</span>
                                  <span>₪{item.price}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="border-t pt-4">
                            <h4 className="font-medium mb-2">{t('admin.shippingDetails')}</h4>
                            <p>{order.shippingAddress}</p>
                            <p>{order.shippingMethod}</p>
                          </div>
                          <div className="border-t pt-4 flex justify-between">
                            <span className="font-medium">{t('admin.total')}:</span>
                            <span className="font-medium">₪{order.total}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Products Management */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="mb-6">
                <button
                  onClick={() => setEditingProduct({})}
                  className="bg-accent text-white px-4 py-2 rounded hover:bg-accent/80 transition-colors"
                >
                  {t('admin.addNewProduct')}
                </button>
              </div>

              {editingProduct && renderProductForm()}

              <div className="grid grid-cols-1 gap-4">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="bg-gray-700 rounded-lg shadow p-4 flex items-center justify-between group hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <img
                        src={product.image}
                        alt={typeof product.name === 'object' ? product.name.en : product.name}
                        className="w-16 h-16 object-contain rounded bg-gray-800"
                      />
                      <div>
                        <h3 className="font-medium text-white">
                          {typeof product.name === 'object' ? `${product.name.en} / ${product.name.he}` : product.name}
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-sm text-gray-300">₪{product.price.toFixed(2)}</p>
                          {product.category && (
                            <span className="px-2 py-0.5 bg-gray-800 text-gray-300 text-xs rounded">
                              {product.category}
                            </span>
                          )}
                          {product.discountPercentage > 0 && (
                            <span className="px-2 py-0.5 bg-green-900 text-green-100 text-xs rounded">
                              {product.discountPercentage}% {t('admin.off')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditingProduct(product)}
                        className="p-2 text-accent hover:text-accent/80 transition-colors"
                        title={t('admin.editProduct')}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleProductDelete(product.id)}
                        className="p-2 text-red-500 hover:text-red-400 transition-colors"
                        title={t('admin.deleteProduct')}
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
