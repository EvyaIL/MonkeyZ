import React from 'react';
import { AuthProvider } from './context/AuthContext';
import App from './App';

function RootApp() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}

export default RootApp;
