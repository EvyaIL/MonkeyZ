import React from 'react';

// PayPal Debug component - disabled in production
const PayPalDebug = () => {
  // Only show debug info in development mode when explicitly enabled
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  return null; // Disabled for production
};

export default PayPalDebug;
