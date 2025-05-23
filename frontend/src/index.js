import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import RootApp from "./RootApp";
import reportWebVitals from "./reportWebVitals";
import "./i18n"; // <-- Import i18n setup
import { BrowserRouter } from "react-router-dom";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <RootApp />
    </BrowserRouter>
  </React.StrictMode>
);

reportWebVitals();
