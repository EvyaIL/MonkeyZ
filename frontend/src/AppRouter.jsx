import { Routes, Route } from "react-router-dom";
// import { useTranslation } from "react-i18next"; // Not used directly here
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import Navbar from "./components/Navbar";
// Footer is likely handled in App.jsx or a higher-level component
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import AllProducts from "./pages/AllProducts";
import ProductPage from "./pages/ProductPage";
import Checkout from "./pages/Checkout";
import FAQ from "./pages/FAQ";
import AboutUs from "./pages/AboutUs";
import Contact from "./pages/Contact";
import ResetPassword from "./pages/ResetPassword";
import BlogPage from "./pages/BlogPage";
import BlogPostPage from "./pages/BlogPostPage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";

const AppRouter = () => {
  return (
    <>
      {/* Navbar is rendered here, Footer is likely in App.jsx or similar parent component */}
      <Navbar />
      <Routes>
        {/* Main pages */}
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/account" element={<Profile />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/products" element={<AllProducts />} />
        <Route path="/product/:name" element={<ProductPage />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<Contact />} />

        {/* Blog routes */}
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />

        {/* Legal routes */}
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />

        {/* Payment routes */}
        <Route path="/checkout" element={<Checkout />} />
        <Route
          path="/success"
          element={
            <div
              className="p-4 text-green-600 dark:text-green-400 text-center text-xl flex items-center justify-center h-full"
              aria-live="polite"
              role="status"
            >
              Payment Successful!
            </div>
          }
        />
        <Route
          path="/fail"
          element={
            <div
              className="p-4 text-red-600 dark:text-red-400 text-center text-xl flex items-center justify-center h-full"
              aria-live="polite"
              role="status"
            >
              Payment Failed. Please try again.
            </div>
          }
        />

        {/* 404 Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      {/* Footer is typically rendered in App.jsx or a main layout component after the Routes */}
    </>
  );
};

export default AppRouter;
