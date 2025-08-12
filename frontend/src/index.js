import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import "./i18n"; // <-- Import i18n setup
import { BrowserRouter } from "react-router-dom";

// Fix CSP issues in development mode early
if (process.env.NODE_ENV === 'development') {
  // Import and run CSP fix
  import('./lib/cspNonce').then(({ fixDevelopmentCSP }) => {
    fixDevelopmentCSP();
  });
}

// Performance optimization: Preload PayPal script on app start (PayPal Best Practice)
if (process.env.REACT_APP_PAYPAL_CLIENT_ID) {
  import('./lib/paypalConfig').then(({ preloadPayPalScript, PAYPAL_CONFIG }) => {
    if (PAYPAL_CONFIG.performance.enablePreload) {
      // Pre-cache PayPal script for instant loading on checkout page
      preloadPayPalScript().catch(error => {
        console.warn('PayPal script preload failed:', error);
      });
    }
  });
}

const root = ReactDOM.createRoot(document.getElementById("root"));

// Temporarily disable StrictMode in development to prevent PayPal zoid conflicts
// StrictMode causes double mounting which triggers "zoid destroyed all components" error
const AppWrapper = process.env.NODE_ENV === 'development' ? 
  ({ children }) => children : // Development: No StrictMode wrapper
  React.StrictMode; // Production: Keep StrictMode for better error detection

root.render(
  <AppWrapper>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </AppWrapper>
);

reportWebVitals();
