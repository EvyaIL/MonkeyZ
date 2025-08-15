import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { useGlobalContext } from '../context/GlobalProvider';
import ProductCard from '../components/products/ProductCard';

const Favorites = () => {
  const { t } = useTranslation();
  const { favorites, isAuthenticated } = useGlobalContext();
  const [favoriteProducts, setFavoriteProducts] = useState([]);

  useEffect(() => {
    // Here you would typically fetch the full product details for the favorited items
    // For now, we'll just use the IDs from the favorites array
    setFavoriteProducts(favorites || []);
  }, [favorites]);

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Helmet>
          <title>{t('favorites.title')} | MonkeyZ</title>
          <meta name="description" content={t('favorites.description')} />
        </Helmet>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{t('favorites.pleaseLogin')}</h1>
          <p>{t('favorites.loginToView')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>{t('favorites.title')} | MonkeyZ</title>
        <meta name="description" content={t('favorites.description')} />
      </Helmet>
      
      <h1 className="text-3xl font-bold mb-6">{t('favorites.title')}</h1>
      
      {favoriteProducts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">{t('favorites.noItems')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favoriteProducts.map((product) => (
            <ProductCard key={product.id || product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;
