import React from "react";
import AppRouter from "./AppRouter";
import GlobalProvider from "./context/GlobalProvider";
import Footer from "./components/Footer";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ThemeProvider } from "./context/ThemeContext";

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

const App = () => {
  React.useEffect(() => {
    document.documentElement.lang = "he";
    document.documentElement.dir = "rtl";
  }, []);

  if (!GOOGLE_CLIENT_ID) {
    console.error("Google Client ID is not defined. Please check your .env file.");
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
        <ThemeProvider>
          <div className="w-full min-h-screen bg-primary text-white flex flex-col">
            <div className="flex-1">
              <AppRouter />
            </div>
            <Footer />
          </div>
        </ThemeProvider>
      </GlobalProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
