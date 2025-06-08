import { useState, useEffect } from 'react';
import { useGlobalProvider } from '../context/GlobalProvider';
import { apiService } from '../lib/apiService';
import { useTranslation } from 'react-i18next';
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
  const [products, setProducts] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalSales: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    dailySales: [],
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');  useEffect(() => {
    const loadAdminData = async () => {
      try {
        setLoadingProducts(true);
        // Load all products for admin
        const [adminProducts, publicProducts] = await Promise.all([
          apiService.get('/admin/products'),
          apiService.get('/product/all')
        ]);
        if (adminProducts.data) setProducts(adminProducts.data);

        // Load all coupons
        const { data: couponsResponse } = await apiService.get('/admin/coupons');
        if (couponsResponse) setCoupons(couponsResponse);
        
        // Load all orders
        const { data: ordersResponse } = await apiService.get('/admin/orders');
        if (ordersResponse) setOrders(ordersResponse);

        // Load analytics data        const { data: analyticsResponse } = await apiService.get('/admin/analytics');
        setAnalytics({
          totalSales: analyticsResponse?.totalSales || 0,
          totalOrders: analyticsResponse?.totalOrders || 0,
          averageOrderValue: analyticsResponse?.averageOrderValue || 0,
          dailySales: analyticsResponse?.dailySales || [],
        });

        // Load all orders
        const { data: orderData } = await apiService.get('/admin/orders');
        if (orderData) setOrders(orderData);        // Load analytics data
        const { data: analyticsData } = await apiService.get('/admin/analytics');
        setAnalytics({
          totalSales: analyticsData?.totalSales || 0,
          totalOrders: analyticsData?.totalOrders || 0,
          averageOrderValue: analyticsData?.averageOrderValue || 0,
          dailySales: analyticsData?.dailySales || [],
        });
      } catch (error) {
        console.error('Error loading admin data:', error);
      }
    };

    loadAdminData();
  }, []);  const [loadingProducts, setLoadingProducts] = useState(false);  const [productError, setProductError] = useState("");
  const { notify } = useGlobalProvider();
  
  const refreshProducts = async () => {
    setLoadingProducts(true);
    setProductError("");
    try {
      // Refresh both admin and public products lists
      const [adminProducts, publicProducts] = await Promise.all([
        apiService.get('/admin/products'),
        apiService.get('/product/all')
      ]);
      
      if (adminProducts.data) setProducts(adminProducts.data);
    } catch (err) {
      console.error('Error refreshing products:', err);
      setProductError(t('admin.loadError'));
    }
    setLoadingProducts(false);
  };

  const handleProductSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    // Convert form data to a proper product object
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
    };      try {
        setLoadingProducts(true);
        setProductError("");

        if (!productData.name.en && !productData.name.he) {
          setProductError(t('admin.nameRequired'));
          return;
        }

        let result;
        if (editingProduct?.id) {
          result = await apiService.put(`/admin/products/${editingProduct.id}`, productData);
          notify({ 
            message: t('admin.productUpdated'),
            type: 'success'
          });
        } else {
          result = await apiService.post('/admin/products', productData);
          notify({
            message: t('admin.productCreated'),
            type: 'success'
          });
        }
        
        await refreshProducts();
        setEditingProduct(null);
      } catch (error) {
        console.error('Error saving product:', error);
        setProductError(t('admin.saveError'));
        notify({
          message: t('admin.saveFailed'),
          type: 'error'
        });
      } finally {
        setLoadingProducts(false);
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
    labels: analytics.dailySales?.map(sale => sale.date) || [],
    datasets: [
      {
        label: t('admin.dailySales'),
        data: analytics.dailySales?.map(sale => sale.amount) || [],
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }
    ]
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
            <div>
              <div className="mb-6">
                <button
                  onClick={() => setEditingProduct({})}
                  className="bg-accent text-white px-4 py-2 rounded hover:bg-accent/80 transition-colors"
                >
                  {t('admin.addNewProduct')}
                </button>
              </div>              {editingProduct && (
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t('admin.descriptionEn')}
                      </label>
                      <textarea
                        name="description_en"
                        defaultValue={editingProduct.description?.en || editingProduct.description}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-accent focus:border-transparent"
                        rows="4"
                        required
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t('admin.descriptionHe')}
                      </label>
                      <textarea
                        name="description_he"
                        defaultValue={editingProduct.description?.he}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-accent focus:border-transparent"
                        rows="4"
                        required
                        dir="rtl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t('admin.category')}
                      </label>
                      <select
                        name="category"
                        defaultValue={editingProduct.category}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-accent focus:border-transparent"
                        required
                      >
                        <option value="">{t('admin.selectCategory')}</option>
                        <option value="Microsoft">Microsoft</option>
                        <option value="VPN">VPN</option>
                        <option value="Security">Security</option>
                        <option value="Office">Office</option>
                        <option value="Cloud">Cloud</option>
                        <option value="Utility">Utility</option>
                        <option value="Multimedia">Multimedia</option>
                      </select>
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
                        min="0"
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-accent focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t('admin.imageUrl')}
                      </label>
                      <input
                        type="text"
                        name="imageUrl"
                        defaultValue={editingProduct.image}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-accent focus:border-transparent"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {t('admin.discountPercentage')}
                      </label>
                      <input
                        type="number"
                        name="discountPercentage"
                        defaultValue={editingProduct.discountPercentage || 0}
                        min="0"
                        max="100"
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-accent focus:border-transparent"
                      />
                    </div>
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
                      placeholder={t('admin.tagsPlaceholder')}
                    />
                  </div>

                  <div className="flex flex-wrap gap-4 py-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="inStock"
                        defaultChecked={editingProduct.inStock !== false}
                        className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
                      />
                      <span>{t('admin.inStock')}</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="isNew"
                        defaultChecked={editingProduct.isNew}
                        className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
                      />
                      <span>{t('admin.isNew')}</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="isBestSeller"
                        defaultChecked={editingProduct.isBestSeller}
                        className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
                      />
                      <span>{t('admin.isBestSeller')}</span>
                    </label>
                  </div>

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
                            const { data } = await apiService.get('/admin/products');
                            if (data) setProducts(data);
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
