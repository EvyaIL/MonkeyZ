import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createPayment } from '../lib/paymentService';
import emailjs from '@emailjs/browser';

const TestProduct = () => {
  const { t } = useTranslation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const handlePurchase = async () => {
    setIsProcessing(true);
    setError('');
    
    try {
      // Test product data
      const paymentData = {
        amount: 200, // 2 NIS
        fullName: 'Test User',
        email: 'test@example.com',
        phone: '0501234567',
        orderId: `TEST-${Date.now()}`
      };

      const result = await createPayment(paymentData);

      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        // Success event will be handled by the payment SDK
        // Order confirmation email will be sent in the success handler
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-8 p-6 bg-white dark:bg-secondary rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-4 text-gray-800 dark:text-white">
        {t('test_product')}
      </h2>
      <div className="text-center mb-4">
        <p className="text-lg font-semibold text-accent">₪2.00</p>
        <p className="text-gray-600 dark:text-gray-300">{t('test_product_description')}</p>
      </div>
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded">
          {error}
        </div>
      )}
      <button
        onClick={handlePurchase}
        disabled={isProcessing}
        className="w-full bg-accent text-white py-2 px-4 rounded hover:bg-accent-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? t('processing') : t('buy_now')}
      </button>
    </div>
  );
};

export default TestProduct;
