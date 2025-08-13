import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useGlobalProvider } from '../context/GlobalProvider';
import { apiService } from '../lib/apiService';
import { useTranslation } from 'react-i18next';
import { Line } from 'react-chartjs-2';
import OrderForm from '../components/admin/OrderForm';
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

const AdminDashboard = React.memo(() => {
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
  const [editingOrder, setEditingOrder] = useState(null);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productError, setProductError] = useState("");
  const [orderError, setOrderError] = useState("");
  const [loadingOrders, setLoadingOrders] = useState(false);
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

  const refreshOrders = async () => {
    setLoadingOrders(true);
    setOrderError("");
    try {
      const { data: orderData } = await apiService.get('/admin/orders');
      if (orderData) setOrders(orderData);
    } catch (err) {
      console.error('Error refreshing orders:', err);
      setOrderError(t('admin.orders.loadError', "Failed to load orders.")); // Added default value
      notify({ message: t('admin.orders.loadError', "Failed to load orders."), type: 'error' });
    }
    setLoadingOrders(false);
  };

  useEffect(() => {
    const loadAdminData = async () => {
      setLoadingProducts(true);
      setLoadingOrders(true);
      try {
        // Load all products for admin
        // Note: publicProductsRes is fetched but not directly used to set state here.
        // Assuming adminProductsRes.data is the primary source for the 'products' state.
        const [adminProductsRes, /* publicProductsRes */] = await Promise.all([
          apiService.get('/admin/products'),
          apiService.get('/product/all') 
        ]);
        if (adminProductsRes.data) setProducts(adminProductsRes.data);

        // Load all coupons
        const { data: couponsResponse } = await apiService.get('/admin/coupons');
        if (couponsResponse) setCoupons(couponsResponse);
        
        // Load all orders
        const { data: ordersResponse } = await apiService.get('/admin/orders');
        if (ordersResponse) setOrders(ordersResponse);

        // Load analytics data
        const { data: analyticsResponse } = await apiService.get('/admin/analytics');
        setAnalytics({
          totalSales: analyticsResponse?.totalSales || 0,
          totalOrders: analyticsResponse?.totalOrders || 0,
          averageOrderValue: analyticsResponse?.averageOrderValue || 0,
          dailySales: analyticsResponse?.dailySales || [],
        });

      } catch (error) {
        console.error('Error loading admin data:', error);
        notify({ message: t('admin.loadInitialDataError', 'Failed to load initial admin data.'), type: 'error' });
      } finally {
        setLoadingProducts(false);
        setLoadingOrders(false);
      }
    };

    loadAdminData();
  }, [t, notify]); // Added t and notify to dependency array. Removed redundant refreshOrders()

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
    const couponData = {
        code: formData.get('code'),
        discountPercentage: parseInt(formData.get('discountPercentage')),
        startDate: formData.get('startDate'),
        endDate: formData.get('endDate'),
        description: formData.get('description')
    };
    
    try {
      if (editingCoupon?.id) { // Ensure editingCoupon has an id
        await apiService.put(`/admin/coupons/${editingCoupon.id}`, couponData);
        notify({ message: t('admin.couponUpdated', "Coupon updated successfully!"), type: 'success' });
      } else {
        await apiService.post('/admin/coupons', couponData);
        notify({ message: t('admin.couponCreated', "Coupon created successfully!"), type: 'success' });
      }
      
      // Refresh coupons list
      const { data } = await apiService.get('/admin/coupons');
      if (data) setCoupons(data);
      
      setEditingCoupon(null);
    } catch (error) {
      console.error('Error saving coupon:', error);
      notify({ message: t('admin.couponSaveError', "Failed to save coupon."), type: 'error' });
    }
  };

  const handleOrderSubmit = async (orderData) => {
    setLoadingOrders(true);
    setOrderError("");
    try {
      let result;
      if (editingOrder?.id || editingOrder?._id) {
        result = await apiService.patch(`/admin/orders/${editingOrder.id || editingOrder._id}`, orderData);
        notify({ message: t('admin.orders.updatedSuccess'), type: 'success' });
      } else {
        // Ensure user_id is included if present in orderData
        const payload = { ...orderData };
        if (payload.user_id === '') delete payload.user_id; // Remove user_id if empty string before sending
        result = await apiService.post('/admin/orders', payload);
        notify({ message: t('admin.orders.createdSuccess'), type: 'success' });
      }
      await refreshOrders();
      setEditingOrder(null);
      setShowOrderForm(false);
    } catch (error) {
      console.error('Error saving order:', error);
      const errorMessage = error.response?.data?.detail || t('admin.orders.saveError');
      setOrderError(errorMessage);
      notify({ message: errorMessage, type: 'error' });
    }
    setLoadingOrders(false);
  };

  const handleEditOrder = (order) => {
    setEditingOrder(order);
    setShowOrderForm(true);
    setActiveTab('orders'); // Switch to orders tab if not already there
  };

  const handleCreateNewOrder = () => {
    setEditingOrder(null); // Clear any existing editing order
    setShowOrderForm(true);
    setActiveTab('orders'); // Switch to orders tab
  };

  const handleOrderStatusUpdate = async (orderId, newStatus, note = null) => { // Added note parameter
    setLoadingOrders(true); // Indicate loading state
    try {
      // Use the new specific endpoint for status updates
      const payload = { status: newStatus };
      if (note) payload.note = note;

      await apiService.put(`/admin/orders/${orderId}/status`, payload);
      
      await refreshOrders(); // Refresh the main orders list
      
      // If the updated order was the one in the modal, update it or close modal
      if (selectedOrder && (selectedOrder.id === orderId || selectedOrder._id === orderId)) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
        // Optionally, you might want to close the modal after a successful update from within it.
        // setSelectedOrder(null); 
      }
      notify({ message: t('admin.orders.statusUpdatedSuccess', 'Order status updated!'), type: 'success' });
    } catch (error) {
      console.error('Error updating order status:', error);
      const errorMessage = error.response?.data?.detail || t('admin.orders.statusUpdateError', 'Failed to update order status.');
      notify({ message: errorMessage, type: 'error' });
      // Potentially set an error state specific to the modal if needed
    }
    setLoadingOrders(false);
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

  const renderOverview = () => (
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
  );

  const renderProductsManagement = () => (
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
  );

  const renderCouponsManagement = () => (
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
  );

  const renderOrdersManagement = () => {
    if (showOrderForm) {
      return (
        <OrderForm 
          order={editingOrder} // Pass the order being edited, or null for new
          onSubmit={handleOrderSubmit}
          onCancel={() => {
            setShowOrderForm(false);
            setEditingOrder(null);
            setOrderError(""); // Clear any previous errors
          }}
          allProducts={products} // Pass all products for the item selection
          loading={loadingOrders}
          error={orderError}
        />
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('admin.manageOrders', 'Manage Orders')}</h3>
          <button 
            onClick={handleCreateNewOrder} 
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition duration-150 ease-in-out"
          >
            {t('admin.orders.createNew', 'Create New Order')}
          </button>
        </div>
        {/* Order Filters */}
        <div className="my-4">
          <label htmlFor="orderStatusFilter" className="mr-2 font-medium text-gray-700 dark:text-gray-300">{t('admin.filterByStatus', 'Filter by Status')}:</label>
          <select 
            id="orderStatusFilter" 
            value={orderStatusFilter} 
            onChange={(e) => setOrderStatusFilter(e.target.value)}
            className="p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">{t('admin.statusAll', 'All')}</option>
            <option value="Pending">{t('admin.statusPending', 'Pending')}</option>
            <option value="Processing">{t('admin.statusProcessing', 'Processing')}</option>
            <option value="Shipped">{t('admin.statusShipped', 'Shipped')}</option>
            <option value="Completed">{t('admin.statusCompleted', 'Completed')}</option>
            <option value="Cancelled">{t('admin.statusCancelled', 'Cancelled')}</option>
          </select>
        </div>

        {loadingOrders && <p>{t('admin.loadingOrders', 'Loading orders...')}</p>}
        {orderError && <p className="text-red-500">{orderError}</p>}
        
        {/* Orders Table/List */}
        <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow-md rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('admin.orderId', 'Order ID')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('admin.orderCustomer', 'Customer')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('admin.orderDate', 'Date')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('admin.orderTotal', 'Total')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('admin.orderStatus', 'Status')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('admin.orderActions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredOrders.length > 0 ? filteredOrders.map(order => (
                <tr key={order.id || order._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{order.id || order._id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{order.customerName} ({order.email})</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{new Date(order.date || order.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">₪{order.total?.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      order.status === 'Completed' ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100' :
                      order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100' :
                      order.status === 'Processing' ? 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100' : // Added Processing
                      order.status === 'Shipped' ? 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100' :
                      order.status === 'Cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100' : // Added Cancelled
                      'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
                    }`}>
                      {t(`admin.status${order.status}`, order.status || 'Unknown Status')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onClick={() => handleEditOrder(order)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 mr-3">{t('admin.editButton', 'Edit')}</button>
                    <button onClick={() => setSelectedOrder(order)} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200">{t('admin.viewDetailsButton', 'Details')}</button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">{t('admin.noOrdersFound', 'No orders found.')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Order Details Modal (Simplified) */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="relative mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white dark:bg-gray-800">
              <div className="mt-3 text-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">{t('admin.orderDetailsTitle', 'Order Details')} - {selectedOrder.id || selectedOrder._id}</h3>
                <div className="mt-2 px-7 py-3 text-left space-y-3 text-sm text-gray-700 dark:text-gray-300">
                  <p><strong>{t('admin.orderCustomer', 'Customer')}:</strong> {selectedOrder.customerName} ({selectedOrder.email})</p>
                  <p><strong>{t('admin.orderPhone', 'Phone')}:</strong> {selectedOrder.phone || 'N/A'}</p>
                  <p><strong>{t('admin.orderDate', 'Date')}:</strong> {new Date(selectedOrder.date || selectedOrder.createdAt).toLocaleString()}</p>
                  <p><strong>{t('admin.orderTotal', 'Total')}:</strong> ₪{selectedOrder.total?.toFixed(2)}</p>
                  <p><strong>{t('admin.orderStatus', 'Status')}:</strong> {t(`admin.status${selectedOrder.status}`, selectedOrder.status)}</p>
                  {selectedOrder.user_id && <p><strong>{t('admin.orderUserId', 'User ID')}:</strong> {selectedOrder.user_id}</p>}
                  <div>
                    <strong>{t('admin.orderItems', 'Items')}:</strong>
                    <ul className="list-disc list-inside pl-4 mt-1 space-y-1">
                      {selectedOrder.items.map((item, index) => (
                        <li key={index}>{item.name || `Product ID: ${item.productId}`} - {t('admin.orderForm.quantity', 'Qty')}: {item.quantity}, {t('admin.orderForm.pricePerItem', 'Price')}: ₪{item.price?.toFixed(2)}</li>
                      ))}
                    </ul>
                  </div>
                  {selectedOrder.notes && <p><strong>{t('admin.orderNotes', 'Notes')}:</strong> {selectedOrder.notes}</p>}
                  {/* Status update within modal - example */}
                  <div className="mt-4">
                    <label htmlFor="modalOrderStatus" className="block text-sm font-medium">{t('admin.updateStatusPrompt', 'Update Status')}:</label>
                    <select 
                      id="modalOrderStatus"
                      defaultValue={selectedOrder.status} // Use defaultValue if you don't want to control it with state here
                      onChange={(e) => {
                        // Consider adding a confirmation or a small note field here if desired
                        handleOrderStatusUpdate(selectedOrder.id || selectedOrder._id, e.target.value, `Status changed via modal by ${user.username}`);
                      }}
                      className="mt-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm w-full"
                      disabled={loadingOrders} // Disable select while an update is in progress
                    >
                      <option value="Pending">{t('admin.statusPending', 'Pending')}</option>
                      <option value="Processing">{t('admin.statusProcessing', 'Processing')}</option>
                      <option value="Shipped">{t('admin.statusShipped', 'Shipped')}</option>
                      <option value="Completed">{t('admin.statusCompleted', 'Completed')}</option>
                      <option value="Cancelled">{t('admin.statusCancelled', 'Cancelled')}</option>
                    </select>
                  </div>
                </div>
                <div className="items-center px-4 py-3">
                  <button onClick={() => setSelectedOrder(null)} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 rounded hover:bg-gray-300 dark:hover:bg-gray-500">
                    {t('admin.closeButton', 'Close')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAnalytics = () => (
    <div>
      <h3 className="text-lg font-medium mb-4">{t('admin.salesTrends')}</h3>
      <div className="h-64">
        <Line
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
  );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white p-4 sm:p-6 lg:p-8">
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
          {activeTab === 'overview' && renderOverview()}

          {/* Orders Management */}
          {activeTab === 'orders' && renderOrdersManagement()}

          {/* Products Management */}
          {activeTab === 'products' && renderProductsManagement()}

          {/* Coupons Management */}
          {activeTab === 'coupons' && renderCouponsManagement()}

          {/* Analytics Section - if separate from overview */}
          {activeTab === 'analytics' && renderAnalytics()}
        </div>
      </div>
    </div>
  );
});

// Set display name for debugging
AdminDashboard.displayName = 'AdminDashboard';

export default AdminDashboard;

// Make sure to add default translation strings for any new t() calls
// For example, in your i18n json files:
// "admin": {
//   "orders": {
//     "createNew": "Create New Order",
//     "loadError": "Failed to load orders.",
//     "updatedSuccess": "Order updated successfully!",
//     "createdSuccess": "Order created successfully!",
//     "saveError": "Failed to save order.",
//     "statusUpdatedSuccess": "Order status updated!",
//     "statusUpdateError": "Failed to update order status."
