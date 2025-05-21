import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Unauthorized = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-lg p-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-red-500 mb-4">
            {t('unauthorized_title')}
          </h1>
          <div className="text-6xl mb-6">🛑</div>
          <p className="text-white text-lg mb-6">
            {t('unauthorized_message')}
          </p>
          
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center">
            <Link
              to="/"
              className="px-5 py-3 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              {t('back_to_home')}
            </Link>
            <Link
              to="/dashboard"
              className="px-5 py-3 bg-accent text-white rounded-md hover:bg-accent-dark transition-colors"
            >
              {t('go_to_dashboard')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
