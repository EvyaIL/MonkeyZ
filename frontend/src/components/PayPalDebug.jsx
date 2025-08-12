import React from 'react';

const PayPalDebug = () => {
  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: '#f0f0f0', 
      padding: '10px', 
      border: '1px solid #ccc',
      zIndex: 9999,
      fontSize: '12px',
      maxWidth: '300px'
    }}>
      <h4>🔧 PayPal Debug Info</h4>
      <div><strong>NODE_ENV:</strong> {process.env.NODE_ENV}</div>
      <div><strong>Client ID from env:</strong> {process.env.REACT_APP_PAYPAL_CLIENT_ID ? `${process.env.REACT_APP_PAYPAL_CLIENT_ID.substring(0, 15)}...` : 'NOT_SET'}</div>
      <div><strong>Expected (Live):</strong> AXu-4q2i_746j...</div>
      <div><strong>Wrong (Sandbox):</strong> AYbpBUAqDy9V...</div>
      <div style={{ color: process.env.REACT_APP_PAYPAL_CLIENT_ID?.startsWith('AXu-4q2i') ? 'green' : 'red' }}>
        <strong>Status:</strong> {process.env.REACT_APP_PAYPAL_CLIENT_ID?.startsWith('AXu-4q2i') ? '✅ CORRECT' : '❌ WRONG'}
      </div>
    </div>
  );
};

export default PayPalDebug;
