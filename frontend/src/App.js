import React, { useEffect } from "react";
import AppRouter from "./AppRouter";
import GlobalProvider from "./context/GlobalProvider";
import Footer from "./components/Footer";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useTranslation } from "react-i18next";
import { pageView, initAnalytics } from "./lib/analytics";

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

const AppContent = () => {
  const { i18n } = useTranslation();
  
  // Initialize analytics service
  useEffect(() => {
    initAnalytics();
    
    // Track visit count for segmentation
    const visitCount = parseInt(localStorage.getItem('visit_count') || '0');
    localStorage.setItem('visit_count', (visitCount + 1).toString());
    
    // Record first visit timestamp if not set
    if (!localStorage.getItem('first_visit')) {
      localStorage.setItem('first_visit', Date.now().toString());
    }
  }, []);
  
  // Update document language and direction based on i18n
  useEffect(() => {
    const lang = i18n.language || "he";
    const dir = lang === "he" ? "rtl" : "ltr";
    
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [i18n.language]);
  
  return (
    <div className="w-full min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white flex flex-col">
      <div className="flex-1">
        <AppRouter />
      </div>
      <Footer />
    </div>
  );
};

const App = () => {
  if (!GOOGLE_CLIENT_ID) {
    console.error("Google Client ID is not defined. Please check your .env file.");
    return (
      <div className="text-center mt-12 p-4">
        <h1 className="text-red-500 text-2xl font-bold">Configuration Error</h1>
        <p className="mt-2">Google Client ID is missing. The application cannot start.</p>
        <p className="mt-4 text-sm text-gray-500">Please check your environment variables or .env file.</p>
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <GlobalProvider>
        <AppContent />
      </GlobalProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
