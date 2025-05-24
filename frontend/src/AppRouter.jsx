import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import { pageView } from "./lib/analytics";
import Navbar from "./components/Navbar";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import AllProducts from "./pages/AllProducts";
import ProductPage from "./pages/ProductPage";
import Checkout from "./pages/Checkout";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailed from "./pages/PaymentFailed";
import AnalyticsTest from "./pages/AnalyticsTest";
import FAQ from "./pages/FAQ";
import AboutUs from "./pages/AboutUs";
import Contact from "./pages/Contact";
import ResetPassword from "./pages/ResetPassword";
import BlogPage from "./pages/BlogPage";
import BlogPostPage from "./pages/BlogPostPage";
import UserDashboard from "./pages/UserDashboard";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";

// Lazy load admin routes
const AdminOverview = lazy(() => import("./pages/dashboard/admin/AdminOverview"));
const AdminProducts = lazy(() => import("./pages/dashboard/admin/AdminProducts"));
const AdminOrders = lazy(() => import("./pages/dashboard/admin/AdminOrders")); 
const AdminCoupons = lazy(() => import("./pages/dashboard/admin/AdminCoupons"));

const AppRouter = () => {
  const location = useLocation();

  // Track page views when the route changes
  useEffect(() => {
    const path = location.pathname;
    const title = document.title || `MonkeyZ - ${path.slice(1) || 'Home'}`;
    pageView(path, title);
  }, [location]);
  
  return (
    <>
      <Navbar />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />

        {/* Protected user routes */}
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/account" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />        {/* Protected admin routes */}        <Route path="/dashboard/admin/*" element={
          <ProtectedRoute requireAdmin={true}>
            <DashboardLayout isAdmin={true}>
              <Suspense fallback={
                <div className="flex justify-center items-center h-screen">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
                </div>
              }>
                <Routes>
                  <Route path="" element={<AdminOverview />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="coupons" element={<AdminCoupons />} />
                  <Route path="*" element={<AdminOverview />} />
                </Routes>
              </Suspense>
            </DashboardLayout>
          </ProtectedRoute>
        } />

        {/* Other routes */}
        <Route path="/products" element={<AllProducts />} />
        <Route path="/product/:name" element={<ProductPage />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<Contact />} />

        {/* Blog routes */}
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />

        {/* Analytics test (for development) */}
        <Route path="/analytics-test" element={<AnalyticsTest />} />

        {/* Payment routes */}
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/success" element={<PaymentSuccess />} />
        <Route path="/fail" element={<PaymentFailed />} />

        {/* 404 Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

export default AppRouter;
