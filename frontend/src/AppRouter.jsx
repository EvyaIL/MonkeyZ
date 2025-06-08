import { Routes, Route, useLocation } from "react-router-dom";
import * as React from "react";
import { Suspense } from "react";
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
import ErrorBoundary from "./components/ErrorBoundary";
import AdminOverview from "./pages/dashboard/admin/AdminOverview";
import AdminProducts from "./pages/dashboard/admin/AdminProducts";
import FAQ from "./pages/FAQ";
import AboutUs from "./pages/AboutUs";
import Contact from "./pages/Contact";
import ResetPassword from "./pages/ResetPassword";
import BlogPage from "./pages/BlogPage";
import BlogPostPage from "./pages/BlogPostPage";
import UserDashboard from "./pages/UserDashboard";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

// Import other admin components directly
import AdminOrders from "./pages/dashboard/admin/AdminOrdersSimple";
import AdminCoupons from "./pages/dashboard/admin/AdminCoupons";
import AdminStock from "./pages/dashboard/admin/AdminStock";
import AdminOrderCreate from "./pages/dashboard/admin/AdminOrderCreate";

// Removed LazyComponentWrapper - now using direct imports with ErrorBoundary

// Loading spinner component
const LoadingSpinner = () => (
  <div className="flex justify-center items-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
  </div>
);

function AppRouter() {
  const location = useLocation();

  React.useEffect(() => {
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

        {/* Protected user routes */}
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/account" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
        
        {/* Protected admin routes */}
        <Route
          path="/dashboard/admin/*"
          element={
            <ProtectedRoute requireAdmin>
              <DashboardLayout isAdmin>
                <Routes>
                  <Route 
                    index
                    element={
                      <ErrorBoundary>
                        <AdminOverview />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="products"
                    element={
                      <ErrorBoundary>
                        <AdminProducts />
                      </ErrorBoundary>
                    }
                  />                  <Route
                    path="orders"
                    element={
                      <ErrorBoundary>
                        <AdminOrders />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="orders/create"
                    element={
                      <ErrorBoundary>
                        <AdminOrderCreate />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="coupons"
                    element={
                      <ErrorBoundary>
                        <AdminCoupons />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="stock"
                    element={
                      <ErrorBoundary>
                        <AdminStock />
                      </ErrorBoundary>
                    }
                  />
                </Routes>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Other routes */}
        <Route path="/products" element={<AllProducts />} />
        <Route path="/product/:name" element={<ProductPage />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<Contact />} />
        
        {/* Blog routes */}
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
          {/* Analytics test */}
        <Route path="/analytics-test" element={<AnalyticsTest />} />
        
        {/* Product tags test page */}
        <Route path="/test-product-tags" element={
          <ErrorBoundary>
            <React.Suspense fallback={<LoadingSpinner />}>
              {/* Dynamic import to avoid issues if file is missing */}
              {React.createElement(React.lazy(() => import('./pages/ProductTagTestPage')))}
            </React.Suspense>
          </ErrorBoundary>
        } />
        
        {/* Payment routes */}
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/success" element={<PaymentSuccess />} />
        <Route path="/fail" element={<PaymentFailed />} />
        
        {/* 404 Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default AppRouter;
