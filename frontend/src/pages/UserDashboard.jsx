import { useState, useEffect } from 'react';
import { useGlobalProvider } from '../context/GlobalProvider';
import { apiService } from '../lib/apiService';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const UserDashboard = () => {
  const { user } = useGlobalProvider();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [orders, setOrders] = useState([]);
  const [blogComments, setBlogComments] = useState([]);
  const [activeTab, setActiveTab] = useState('favorites');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Load user's favorite items
        const { data: favData, error: favError } = await apiService.get('/user/favorites');
        if (favError) throw new Error('Failed to load favorites');
        if (favData) setFavorites(favData);

        // Load user's order history
        const { data: orderData, error: orderError } = await apiService.get('/user/orders');
        if (orderError) throw new Error('Failed to load orders');
        if (orderData) setOrders(orderData);

        // Load user's blog comments
        const { data: commentData, error: commentError } = await apiService.get('/user/comments');
        if (commentError) throw new Error('Failed to load comments');
        if (commentData) setBlogComments(commentData);
      } catch (error) {
        setError(error.message);
        console.error('Error loading user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadUserData();
    } else {
      navigate('/sign-in');
    }
  }, [user, navigate]);

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

  const handleCommentDelete = async (commentId) => {
    try {
      await apiService.delete(`/user/comments/${commentId}`);
      setBlogComments(comments => comments.filter(c => c.id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleCommentEdit = async (commentId, newContent) => {
    try {
      await apiService.put(`/user/comments/${commentId}`, { content: newContent });
      setBlogComments(comments =>
        comments.map(c => c.id === commentId ? { ...c, content: newContent } : c)
      );
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-6 bg-base-200 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-red-500 mb-4">{t('error')}</h2>
          <p className="text-gray-600 dark:text-gray-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-base-200 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          {/* Welcome Header */}
          <h1 className="text-2xl font-bold text-accent mb-6">
            👋 {t('dashboard.welcome', { username: user.username })}
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
            <div className="space-y-4">
              {favorites.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  {t('dashboard.noFavorites')}
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favorites.map((item) => (
                    <div 
                      key={item.id}
                      className="bg-white dark:bg-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 flex items-center justify-between border border-gray-100 dark:border-gray-600"
                    >
                      <div className="flex items-center space-x-4">
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div>
                          <h3 className="font-medium hover:text-accent cursor-pointer" onClick={() => navigate(`/product/${item.name}`)}>{item.name}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-300">₪{item.price.toFixed(2)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleFavorite(item.id)}
                        className="text-red-500 hover:text-red-600 transition-colors"
                        aria-label={t('dashboard.removeFromFavorites')}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-6">
              {orders.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  {t('dashboard.noOrders')}
                </p>
              ) : (
                orders.map((order) => (
                  <div 
                    key={order.id}
                    className="bg-white dark:bg-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100 dark:border-gray-600"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-medium">
                          {t('dashboard.orderNumber')}: #{order.id}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-300">
                          {new Date(order.date).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        order.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                        order.status === 'processing' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}>
                        {t(`dashboard.orderStatus.${order.status}`)}
                      </span>
                    </div>
                    <div className="divide-y divide-gray-200 dark:divide-gray-600">
                      {order.items.map((item) => (
                        <div key={item.id} className="py-3 flex justify-between">
                          <span className="flex items-center">
                            <span className="font-medium">{item.name}</span>
                            <span className="text-gray-500 dark:text-gray-400 ml-2">x{item.quantity}</span>
                          </span>
                          <span>₪{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 flex justify-between items-center">
                      <div className="space-y-1">
                        {order.discount > 0 && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {t('dashboard.discount')}: -₪{order.discount.toFixed(2)}
                          </div>
                        )}
                        <span className="font-medium">{t('dashboard.total')}:</span>
                      </div>
                      <span className="font-bold text-lg text-accent">₪{order.total.toFixed(2)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-6">
              {blogComments.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  {t('dashboard.noComments')}
                </p>
              ) : (
                blogComments.map((comment) => (
                  <div 
                    key={comment.id}
                    className="bg-white dark:bg-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100 dark:border-gray-600"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium hover:text-accent cursor-pointer" onClick={() => navigate(`/blog/${comment.postSlug}`)}>
                        {comment.postTitle}
                      </h3>
                      <span className="text-sm text-gray-500 dark:text-gray-300">
                        {new Date(comment.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      {comment.content}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <button 
                        className="flex items-center space-x-1 hover:text-accent transition-colors"
                        onClick={() => handleCommentEdit(comment.id, prompt(t('dashboard.editCommentPrompt'), comment.content))}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                        <span>{t('dashboard.edit')}</span>
                      </button>
                      <button 
                        className="flex items-center space-x-1 hover:text-red-500 transition-colors"
                        onClick={() => {
                          if (window.confirm(t('dashboard.deleteCommentConfirm'))) {
                            handleCommentDelete(comment.id);
                          }
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span>{t('dashboard.delete')}</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
