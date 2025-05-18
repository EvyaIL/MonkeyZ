import React from "react";
import AppRouter from "./AppRouter";
import GlobalProvider from "./context/GlobalProvider";
import Footer from "./components/Footer";
import { GoogleOAuthProvider } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = "946645411512-tn9qmppcsnp5oqqo88ivkuapou2cmg53.apps.googleusercontent.com";

const App = () => {
  // Force RTL and Hebrew for the whole app
  React.useEffect(() => {
    document.documentElement.lang = "he";
    document.documentElement.dir = "rtl";
  }, []);

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
