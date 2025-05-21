import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDropzone } from 'react-dropzone';
import { useGlobalProvider } from '../context/GlobalProvider';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faHistory, faUpload } from '@fortawesome/free-solid-svg-icons';
import { faDiscord } from '@fortawesome/free-brands-svg-icons';

const UserDashboard = () => {  const { t } = useTranslation();
  const { user, notify, favorites, toggleFavorite, userProfile } = useGlobalProvider();
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [isDiscordConnected, setIsDiscordConnected] = useState(false);
  const [favoriteProducts, setFavoriteProducts] = useState([]);

  const { getRootProps, getInputProps } = useDropzone({
    accept: 'image/*',
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      const file = acceptedFiles[0];
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('/api/profile/upload-picture', {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          setProfile(prev => ({ ...prev, profile_picture: data.url }));
          notify({ message: t('profile_picture_updated'), type: 'success' });
        } else {
          throw new Error('Failed to upload');
        }
      } catch (error) {
        notify({ message: t('upload_failed'), type: 'error' });
      }
    }
  });
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (userProfile) {
          setProfile(userProfile);
          setOrders(userProfile.past_orders || []);
          setIsDiscordConnected(!!userProfile.discord_profile);
        } else {
          const response = await fetch('/api/profile', {
            credentials: 'include'
          });
          if (response.ok) {
            const data = await response.json();
            setProfile(data);
            setOrders(data.past_orders || []);
            setIsDiscordConnected(!!data.discord_profile);
          }
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      }
    };

    const fetchFavoriteProducts = async () => {
      if (favorites && favorites.length > 0) {
        try {
          // Fetch details for each product ID in favorites
          const productDetails = await Promise.all(
            favorites.map(async (productId) => {
              const response = await fetch(`/api/products/${productId}`);
              if (response.ok) {
                return await response.json();
              }
              return null;
            })
          );
          
          // Filter out any null responses
          setFavoriteProducts(productDetails.filter(product => product !== null));
        } catch (error) {
          console.error('Failed to fetch favorite products:', error);
        }
      } else {
        setFavoriteProducts([]);
      }
    };

    if (user) {
      fetchProfile();
      fetchFavoriteProducts();
    }
  }, [user, userProfile, favorites]);

  const handleConnectDiscord = async () => {
    // Redirect to Discord OAuth URL
    window.location.href = '/api/discord/auth';
  };

  return (
    <div className="min-h-screen bg-gray-900 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto bg-gray-800 rounded-lg shadow-xl p-6">
          <h1 className="text-3xl font-bold text-white mb-8">{t('my_dashboard')}</h1>

          {/* Profile Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-accent mb-4">{t('profile')}</h2>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <img 
                  src={profile?.profile_picture || '/default-avatar.png'} 
                  alt={t('profile_picture')}
                  className="w-24 h-24 rounded-full object-cover"
                />
                <div {...getRootProps()} className="absolute bottom-0 right-0 bg-accent rounded-full p-2 cursor-pointer hover:bg-accent-dark transition-colors">
                  <input {...getInputProps()} />
                  <FontAwesomeIcon icon={faUpload} className="text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-white text-lg">{user?.username}</h3>
                <p className="text-gray-400">{user?.email}</p>
                {/* Admin Access (if applicable) */}
                {userProfile?.is_admin && (
                  <div className="mt-4">
                    <h4 className="text-accent font-semibold mb-2">{t('admin_access')}</h4>
                    <a 
                      href="/admin" 
                      className="bg-accent text-white px-4 py-2 rounded-lg inline-block hover:bg-accent-dark transition-colors"
                    >
                      {t('go_to_admin_dashboard')}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Discord Connection */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-accent mb-4">{t('discord_connection')}</h2>
            {isDiscordConnected ? (
              <div className="bg-gray-700 rounded-lg p-4 text-white">
                <FontAwesomeIcon icon={faDiscord} className="mr-2" />
                {t('discord_connected')}
              </div>
            ) : (
              <button
                onClick={handleConnectDiscord}
                className="bg-[#7289DA] text-white px-6 py-3 rounded-lg hover:bg-[#677BC4] transition-colors flex items-center"
              >
                <FontAwesomeIcon icon={faDiscord} className="mr-2" />
                {t('connect_discord')}
              </button>
            )}
          </div>          {/* Favorites */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-accent mb-4">{t('favorites')}</h2>
            {favoriteProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {favoriteProducts.map(item => (
                  <div key={item.id} className="bg-gray-700 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center">
                      {item.image && (
                        <img 
                          src={item.image} 
                          alt={item.name.en}
                          className="w-12 h-12 object-cover rounded mr-3"
                        />
                      )}
                      <div>
                        <span className="text-white block">{item.name.en}</span>
                        <span className="text-accent">₪{item.price}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => toggleFavorite(item.id)}
                      className="text-red-500 hover:text-red-400 transition-colors"
                    >
                      <FontAwesomeIcon icon={faHeart} className="text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">{t('no_favorites')}</p>
            )}
          </div>

          {/* Past Orders */}
          <div>
            <h2 className="text-xl font-semibold text-accent mb-4">{t('past_orders')}</h2>
            {orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map(order => (
                  <div key={order.id} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-white">{order.product_name}</span>
                      <span className="text-gray-400">{new Date(order.date).toLocaleDateString()}</span>
                    </div>
                    <div className="text-accent mt-2">₪{order.price}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">{t('no_orders')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
