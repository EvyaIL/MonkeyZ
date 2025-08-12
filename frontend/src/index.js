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

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

reportWebVitals();
