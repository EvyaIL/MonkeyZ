import { useState, useEffect } from 'react';
import { useGlobalProvider } from '../context/GlobalProvider';
import { apiService } from '../lib/apiService';
import { useTranslation } from 'react-i18next';

const UserDashboard = () => {
  const { user } = useGlobalProvider();
  const { t } = useTranslation();
  const [favorites, setFavorites] = useState([]);
  const [orders, setOrders] = useState([]);
  const [blogComments, setBlogComments] = useState([]);
  const [activeTab, setActiveTab] = useState('favorites');

  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Load user's favorite items
        const { data: favData } = await apiService.get('/user/favorites');
        if (favData) setFavorites(favData);

        // Load user's order history
        const { data: orderData } = await apiService.get('/user/orders');
        if (orderData) setOrders(orderData);

        // Load user's blog comments
        const { data: commentData } = await apiService.get('/user/comments');
        if (commentData) setBlogComments(commentData);
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();
  }, []);

  const toggleFavorite = async (productId) => {
    try {
      await apiService.post('/user/favorites/toggle', { productId });
      // Refresh favorites
      const { data } = await apiService.get('/user/favorites');
      if (data) setFavorites(data);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-base-200 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-accent mb-6">
            {t('dashboard.welcome', { username: user.username })}
          </h1>

          {/* Dashboard Navigation */}
          <div className="flex space-x-4 mb-6 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('favorites')}
              className={`pb-2 font-medium transition-colors ${
                activeTab === 'favorites'
                  ? 'border-b-2 border-accent text-accent'
                  : 'text-gray-500 hover:text-accent'
              }`}
            >
              {t('dashboard.favorites')}
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`pb-2 font-medium transition-colors ${
                activeTab === 'orders'
                  ? 'border-b-2 border-accent text-accent'
                  : 'text-gray-500 hover:text-accent'
              }`}
            >
              {t('dashboard.orders')}
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`pb-2 font-medium transition-colors ${
                activeTab === 'comments'
                  ? 'border-b-2 border-accent text-accent'
                  : 'text-gray-500 hover:text-accent'
              }`}
            >
              {t('dashboard.comments')}
            </button>
          </div>

          {/* Dashboard Content */}
          {activeTab === 'favorites' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map((item) => (
                <div 
                  key={item.id}
                  className="bg-white dark:bg-gray-700 rounded-lg shadow p-4 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-4">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div>
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-300">₪{item.price}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleFavorite(item.id)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-6">
              {orders.map((order) => (
                <div 
                  key={order.id}
                  className="bg-white dark:bg-gray-700 rounded-lg shadow p-6"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-medium">
                        {t('dashboard.orderNumber')}: {order.id}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-300">
                        {new Date(order.date).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-accent/10 text-accent">
                      {order.status}
                    </span>
                  </div>
                  <div className="divide-y divide-gray-200 dark:divide-gray-600">
                    {order.items.map((item) => (
                      <div key={item.id} className="py-3 flex justify-between">
                        <span>{item.name}</span>
                        <span>₪{item.price}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 flex justify-between">
                    <span className="font-medium">{t('dashboard.total')}:</span>
                    <span className="font-medium">₪{order.total}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-6">
              {blogComments.map((comment) => (
                <div 
                  key={comment.id}
                  className="bg-white dark:bg-gray-700 rounded-lg shadow p-6"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">{comment.postTitle}</h3>
                    <span className="text-sm text-gray-500 dark:text-gray-300">
                      {new Date(comment.date).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {comment.content}
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <button className="flex items-center space-x-1 hover:text-accent">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                      </svg>
                      <span>{comment.likes}</span>
                    </button>
                    <button className="hover:text-accent">{t('dashboard.editComment')}</button>
                    <button className="hover:text-red-500">{t('dashboard.deleteComment')}</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
