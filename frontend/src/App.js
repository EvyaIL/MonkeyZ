import React from "react";
import AppRouter from "./AppRouter";
import GlobalProvider from "./context/GlobalProvider";
import Footer from "./components/Footer";
import { GoogleOAuthProvider } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

const App = () => {
  // Force RTL and Hebrew for the whole app
  React.useEffect(() => {
    document.documentElement.lang = "he";
    document.documentElement.dir = "rtl";
  }, []);

  if (!GOOGLE_CLIENT_ID) {
    console.error("Google Client ID is not defined. Please check your .env file.");
    // Optionally, render an error message or a fallback UI
    return (
      <div style={{ textAlign: 'center', marginTop: '50px', color: 'red' }}>
        <h1>Configuration Error</h1>
        <p>Google Client ID is missing. The application cannot start.</p>
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <GlobalProvider>
        <div className="w-full min-h-screen bg-primary text-white" lang="he" dir="rtl">
          <main>
            <AppRouter />
          </main>
          <Footer />
        </div>
      </GlobalProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
