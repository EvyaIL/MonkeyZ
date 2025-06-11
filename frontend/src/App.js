import React, { useEffect, useMemo } from "react"; // Added useMemo
import AppRouter from "./AppRouter";
import GlobalProvider, { useGlobalProvider } from "./context/GlobalProvider"; // Added useGlobalProvider
import Footer from "./components/Footer";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useTranslation } from "react-i18next";
import { initAnalytics } from "./lib/analytics";
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider, createTheme } from '@mui/material/styles'; // MUI imports
import CssBaseline from '@mui/material/CssBaseline'; // MUI imports

// Import ThemeToggle with require to troubleshoot potential import issues
const ThemeToggle = React.lazy(() => import('./components/ThemeToggle'));

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
    // This div's Tailwind background might be overridden or complemented by CssBaseline body background
    <div className="w-full min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white flex flex-col">
      <div className="flex-1">
        <AppRouter />
      </div>
      <Footer />
    </div>
  );
};

// New component to provide MUI theme
const MuiThemedAppStructure = () => {
  const { theme } = useGlobalProvider(); // Get theme from GlobalProvider

  const muiTheme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: theme, // 'light' or 'dark'
          primary: {
            main: '#3182CE', // Aligned with Tailwind 'accent'
          },
          secondary: {
            main: '#2C5282', // Aligned with Tailwind 'accent-dark'
          },
          // background: {
          //   default: theme === 'dark' ? '#111827' : '#F7FAFC', // Example: Tailwind's gray-900 and gray-100/blue
          //   paper: theme === 'dark' ? '#1F2937' : '#FFFFFF', // Example: Tailwind's gray-800 and white
          // },
        },
        // typography: {
        //   fontFamily: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'].join(','),
        // },
        // You can add other MUI theme customizations here
      }),
    [theme]
  );

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline /> {/* Applies baseline styles and theme-aware body background */}
      {/* The div below had Tailwind bg classes; CssBaseline now manages body background.
          Individual MUI components like Paper/Card will use theme.palette.background.paper.
          Tailwind's dark: on html tag will still apply for non-MUI components. */}
      <div className="min-h-screen transition-colors duration-300">
        <AppContent />
        <React.Suspense fallback={<div>Loading...</div>}>
          <ThemeToggle />
        </React.Suspense>
      </div>
    </ThemeProvider>
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
        <ErrorBoundary>
          <MuiThemedAppStructure />
        </ErrorBoundary>
      </GlobalProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
