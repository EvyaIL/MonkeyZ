import React, { useEffect, useMemo } from "react"; // Added useMemo
import AppRouter from "./AppRouter";
import GlobalProvider, { useGlobalProvider } from "./context/GlobalProvider.jsx";
import Footer from "./components/Footer";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useTranslation } from "react-i18next";
import { initAnalytics } from "./lib/analytics";
import ErrorBoundary from './components/ErrorBoundary';
import { HelmetProvider } from 'react-helmet-async';
import { initPerformanceOptimizations } from './lib/performanceOptimizer';
import './lib/reactWarningSuppress'; // Suppress React warnings in development
import './styles/globals.css'; // Import our design system CSS

// Lazy load ThemeToggle to improve initial bundle size
const ThemeToggle = React.lazy(() => import('./components/ThemeToggle'));

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

// Debug Google OAuth configuration in development
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Google OAuth Debug Info:');
  console.log('Current Origin:', window.location.origin);
  console.log('Google Client ID:', GOOGLE_CLIENT_ID ? '✅ Present' : '❌ Missing');
  if (!GOOGLE_CLIENT_ID) {
    console.error('❌ GOOGLE_CLIENT_ID is missing from .env file');
  } else {
    console.log('🔗 To fix 403 error, add this origin to Google Console:');
    console.log(`   ${window.location.origin}`);
    console.log('📝 Instructions: https://console.cloud.google.com/ → APIs & Services → Credentials');
  }
}

const AppContent = () => {
  const { i18n } = useTranslation();
  
  // Initialize analytics service only once
  useEffect(() => {
    initAnalytics();
    initPerformanceOptimizations(); // Initialize performance optimizations
    
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
    <div className="w-full min-h-screen bg-[var(--color-background-secondary)] text-[var(--color-text-primary)] flex flex-col">
      <div className="flex-1">
        <AppRouter />
      </div>
      <Footer />
    </div>
  );
};

// Unified App Structure using our design system
const UnifiedAppStructure = () => {
  const { theme } = useGlobalProvider(); // Get theme from GlobalProvider

  // Apply theme class to document root
  useEffect(() => {
    document.documentElement.className = theme === 'dark' ? 'dark' : 'light';
  }, [theme]);

  return (
    <div className="min-h-screen transition-colors duration-300">
      <AppContent />
      <React.Suspense fallback={<div>Loading...</div>}>
        <ThemeToggle />
      </React.Suspense>
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
      <HelmetProvider>
        <GlobalProvider>
          <ErrorBoundary>
            <UnifiedAppStructure />
          </ErrorBoundary>
        </GlobalProvider>
      </HelmetProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
