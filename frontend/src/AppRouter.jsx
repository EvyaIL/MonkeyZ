import { Routes, Route, Navigate } from "react-router-dom";
import { useGlobalProvider } from "./context/GlobalProvider";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";
import Navbar from "./components/Navbar";
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
import UserDashboard from "./pages/UserDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminRoute from "./components/wrapper/AdminRoute";

// Protected Route component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, isAuthenticated } = useGlobalProvider();

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" />;
  }

  if (adminOnly && (!user || user.role !== 0)) {
    return <Navigate to="/" />;
  }

  return children;
};

const AppRouter = () => {
  return (
    <>
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

        {/* Protected Dashboard Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        {/* Additional Admin Route */}
        <Route
          path="/admin"
          element={<Navigate to="/admin/dashboard" replace />}
        />

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

        {/* Unauthorized Access Page */}
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* 404 Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

export default AppRouter;
