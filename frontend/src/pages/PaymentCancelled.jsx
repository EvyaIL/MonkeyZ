import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const PaymentCancelled = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="bg-white dark:bg-secondary p-8 rounded-lg shadow-lg max-w-md w-full text-center border border-base-300 dark:border-gray-700">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        
        <h1 className="text-3xl font-bold text-primary dark:text-accent mb-4">
          {t('payment_cancelled')}
        </h1>
        
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          {t('payment_cancelled_message')}
        </p>

        <div className="space-y-4">
          <Link
            to="/checkout"
            className="block w-full bg-accent text-white py-3 px-6 rounded-md font-semibold hover:bg-accent-dark transition-colors"
          >
            {t('try_again')}
          </Link>
          
          <Link
            to="/"
            className="block w-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white py-3 px-6 rounded-md font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            {t('continue_shopping')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancelled;
