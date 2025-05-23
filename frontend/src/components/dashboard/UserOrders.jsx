import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function UserOrders() {
  const [orders, setOrders] = useState([]);
  const { isAuthenticated } = useAuth();
  
  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated]);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/user/orders', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Your Orders</h2>
      
      {orders.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900">No orders yet</h3>
          <p className="mt-1 text-gray-500">When you make a purchase, it will appear here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">
                    Order #{order.id}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    order.status === 'completed' ? 'bg-green-100 text-green-800' :
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status}
                  </span>
                </div>

                <div className="border-t border-gray-200 -mx-6 px-6 py-4">
                  <div className="space-y-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between">
                        <div className="flex items-center">
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-16 h-16 object-cover rounded-md"
                            />
                          )}
                          <div className="ml-4">
                            <h4 className="font-medium">{item.name}</h4>
                            {item.code && (
                              <p className="text-sm text-gray-500 mt-1">
                                Code: {item.code}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="font-medium">${item.price}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-200 -mx-6 px-6 py-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Order Total:</span>
                    <span className="text-lg font-medium">${order.total}</span>
                  </div>
                  <div className="mt-2 flex justify-between items-center text-sm text-gray-500">
                    <span>Order Date:</span>
                    <span>{new Date(order.date).toLocaleDateString()}</span>
                  </div>
                  {order.couponUsed && (
                    <div className="mt-2 flex justify-between items-center text-sm text-gray-500">
                      <span>Coupon Used:</span>
                      <span>{order.couponUsed}</span>
                    </div>
                  )}
                </div>

                {order.downloadableContent && (
                  <div className="border-t border-gray-200 -mx-6 px-6 py-4">
                    <h4 className="font-medium mb-2">Digital Content</h4>
                    <div className="space-y-2">
                      {order.downloadableContent.map((content) => (
                        <div key={content.id} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{content.name}</span>
                          <button
                            onClick={() => window.location.href = content.downloadUrl}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Download
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
