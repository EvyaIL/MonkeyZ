import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useGlobalProvider } from '../context/GlobalProvider';
import { apiService } from '../lib/apiService';
import { useTranslation } from 'react-i18next';

const UserDashboard = () => {
  const { user, notify, addItemToCart } = useGlobalProvider();
  const { t } = useTranslation();
  const [favorites, setFavorites] = useState([]);
  const [orders, setOrders] = useState([]);
  const [blogComments, setBlogComments] = useState([]);
  const [activeTab, setActiveTab] = useState('favorites');
  const [editingComment, setEditingComment] = useState(null);
  const [editedContent, setEditedContent] = useState('');

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
        notify({ type: 'error', message: t('error_loading_data') });
      }
    };

    loadUserData();
  }, [notify, t]);

  const toggleFavorite = async (productId) => {
    try {
      await apiService.post('/user/favorites/toggle', { productId });
      // Refresh favorites
      const { data } = await apiService.get('/user/favorites');
      if (data) setFavorites(data);
      notify({ type: 'success', message: t('favorites_updated') });
    } catch (error) {
      console.error('Error toggling favorite:', error);
      notify({ type: 'error', message: t('error_updating_favorites') });
    }
  };

  const handleEditComment = (comment) => {
    setEditingComment(comment);
    setEditedContent(comment.content);
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditedContent('');
  };

  const handleUpdateComment = async (commentId) => {
    try {
      const { data, error } = await apiService.put(`/blog/comments/${commentId}`, {
        content: editedContent
      });

      if (error) {
        notify({ type: 'error', message: t('error_updating_comment') });
      } else {
        setBlogComments(prev =>
          prev.map(comment =>
            comment.id === commentId ? { ...comment, content: editedContent } : comment
          )
        );
        setEditingComment(null);
        setEditedContent('');
        notify({ type: 'success', message: t('comment_updated_successfully') });
      }
    } catch (error) {
      console.error('Error updating comment:', error);
      notify({ type: 'error', message: t('error_updating_comment') });
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (window.confirm(t('confirm_delete_comment'))) {
      try {
        await apiService.delete(`/blog/comments/${commentId}`);
        setBlogComments(prev => prev.filter(comment => comment.id !== commentId));
        notify({ type: 'success', message: t('comment_deleted_successfully') });
      } catch (error) {
        console.error('Error deleting comment:', error);
        notify({ type: 'error', message: t('error_deleting_comment') });
      }
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
            <div className="space-y-6">
              {favorites.length === 0 ? (
                <div className="text-center py-8">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
                    {t('dashboard.noFavorites')}
                  </p>
                  <Link
                    to="/products"
                    className="text-accent hover:text-accent/80 font-medium"
                  >
                    {t('dashboard.browseProducts')}
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favorites.map((item) => (
                    <div 
                      key={item.id}
                      className="group bg-white dark:bg-gray-700 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-accent/10 dark:border-accent/20"
                    >
                      <div className="w-full aspect-[4/3] relative overflow-hidden">
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        {item.discountPercentage > 0 && (
                          <span className="absolute top-2 right-2 bg-accent/90 text-white text-sm font-bold px-2 py-1 rounded">
                            {item.discountPercentage}% {t('off')}
                          </span>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium text-gray-800 dark:text-white">{item.name}</h3>
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
                        <p className="text-accent font-bold mb-4">₪{item.price.toFixed(2)}</p>
                        <div className="flex space-x-2">
                          <Link
                            to={`/product/${encodeURIComponent(item.name)}`}
                            className="flex-1 bg-accent/10 hover:bg-accent/20 text-accent py-2 px-3 rounded-md text-center transition-colors duration-200"
                          >
                            {t('dashboard.viewDetails')}
                          </Link>
                          <button
                            onClick={() => {
                              if (addItemToCart) {
                                addItemToCart(item.id, 1, item);
                                notify({ type: 'success', message: t('addedToCart') });
                              }
                            }}
                            className="flex-1 bg-accent text-white py-2 px-3 rounded-md hover:bg-accent/80 transition-colors duration-200"
                          >
                            {t('dashboard.addToCart')}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
              {blogComments.length === 0 ? (
                <div className="text-center py-8">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
                    {t('dashboard.noComments')}
                  </p>
                  <Link to="/blog" className="text-accent hover:text-accent/80 font-medium">
                    {t('dashboard.readBlog')}
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {blogComments.map((comment) => (
                    <div 
                      key={comment.id}
                      className="bg-white dark:bg-gray-700 rounded-lg shadow p-6"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <Link 
                          to={`/blog/${comment.postSlug}`}
                          className="font-medium text-accent hover:text-accent/80"
                        >
                          {comment.postTitle}
                        </Link>
                        <span className="text-sm text-gray-500 dark:text-gray-300">
                          {new Date(comment.date).toLocaleDateString()}
                        </span>
                      </div>

                      {editingComment?.id === comment.id ? (
                        <div className="space-y-3">
                          <textarea
                            value={editedContent}
                            onChange={(e) => setEditedContent(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-accent focus:border-accent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            rows={3}
                          />
                          <div className="flex space-x-3">
                            <button
                              onClick={() => handleUpdateComment(comment.id)}
                              className="text-accent hover:text-accent/80"
                            >
                              {t('dashboard.saveComment')}
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="text-gray-500 hover:text-gray-600"
                            >
                              {t('dashboard.cancel')}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-gray-600 dark:text-gray-300 mb-4">
                            {comment.content}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                            <button
                              onClick={() => handleEditComment(comment)}
                              className="hover:text-accent flex items-center space-x-1"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              <span>{t('dashboard.editComment')}</span>
                            </button>
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="hover:text-red-500 flex items-center space-x-1"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              <span>{t('dashboard.deleteComment')}</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
