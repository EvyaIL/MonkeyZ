import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { apiService } from '../../lib/apiService';

export default function OrderManager() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const { data } = await apiService.get('/admin/orders');
      if (data) setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await apiService.put(`/admin/orders/${orderId}/status`, { status: newStatus });
      loadOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const filteredOrders = filterStatus === 'all' 
    ? orders 
    : orders.filter(order => order.status === filterStatus);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">{t('admin.orders')}</h2>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border rounded p-2 focus:ring-2 focus:ring-accent focus:border-transparent"
        >
          <option value="all">{t('admin.allOrders')}</option>
          <option value="pending">{t('admin.pendingOrders')}</option>
          <option value="processing">{t('admin.processingOrders')}</option>
          <option value="completed">{t('admin.completedOrders')}</option>
          <option value="cancelled">{t('admin.cancelledOrders')}</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredOrders.map((order) => (
          <div
            key={order.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
          >
            <div className="flex justify-between items-start mb-4">
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
                  order.status === 'processing' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                }`}>
                  {order.status}
                </span>
                <select
                  value={order.status}
                  onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                  className="border rounded p-1 text-sm focus:ring-2 focus:ring-accent focus:border-transparent"
                >
                  <option value="pending">{t('admin.pending')}</option>
                  <option value="processing">{t('admin.processing')}</option>
                  <option value="completed">{t('admin.completed')}</option>
                  <option value="cancelled">{t('admin.cancelled')}</option>
                </select>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">{t('admin.orderDetails')}</h4>
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.name} × {item.quantity}</span>
                    <span>₪{item.price.toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t pt-2 flex justify-between font-medium">
                  <span>{t('admin.total')}</span>
                  <span>₪{order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {order.shippingAddress && (
              <div className="border-t mt-4 pt-4">
                <h4 className="font-medium mb-2">{t('admin.shippingDetails')}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">{order.shippingAddress}</p>
                {order.shippingMethod && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {t('admin.shippingMethod')}: {order.shippingMethod}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
