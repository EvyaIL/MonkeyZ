import { Routes, Route, useLocation } from "react-router-dom";
import * as React from "react";
import { pageView } from "./lib/analytics";
import Navbar from "./components/Navbar";
import ErrorBoundary from "./components/ErrorBoundary";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import LoadingSpinner from "./components/Spinner";

// Lazy load pages for better code splitting and performance
const Home = React.lazy(() => import("./pages/Home"));
const Profile = React.lazy(() => import("./pages/Profile"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const SignUp = React.lazy(() => import("./pages/SignUp"));
const SignIn = React.lazy(() => import("./pages/SignIn"));
const AllProducts = React.lazy(() => import("./pages/AllProducts"));
const ProductPage = React.lazy(() => import("./pages/ProductPage"));
const Checkout = React.lazy(() => import("./pages/Checkout"));
const PaymentSuccess = React.lazy(() => import("./pages/PaymentSuccess"));
const PaymentFailed = React.lazy(() => import("./pages/PaymentFailed"));
const FAQ = React.lazy(() => import("./pages/FAQ"));
const AboutUs = React.lazy(() => import("./pages/AboutUs"));
const Contact = React.lazy(() => import("./pages/Contact"));
const ResetPassword = React.lazy(() => import("./pages/ResetPassword"));
const BlogPage = React.lazy(() => import("./pages/BlogPage"));
const BlogPostPage = React.lazy(() => import("./pages/BlogPostPage"));
const PrivacyPolicy = React.lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = React.lazy(() => import("./pages/TermsOfService"));

// Lazy load admin components (heavy components for admin panel)
const AdminProducts = React.lazy(() => import("./pages/dashboard/admin/AdminProducts"));
const AdminOrders = React.lazy(() => import("./pages/dashboard/admin/AdminOrdersSimple"));
const AdminCoupons = React.lazy(() => import("./pages/dashboard/admin/AdminCoupons"));
const AdminStock = React.lazy(() => import("./pages/dashboard/admin/AdminStock"));
const AdminOrderCreate = React.lazy(() => import("./pages/dashboard/admin/AdminOrderCreate"));

// Phase 2: Modern UX Demo (Development only)
const Phase2Demo = React.lazy(() => import("./pages/Phase2Demo"));

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
      <React.Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner />
        </div>
      }>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/sign-up" element={<SignUp />} />
          <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected user routes */}
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/account" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        
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
                        <AdminProducts /> 
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
        {/* Changed route to /product/:productIdentifier */}
        <Route path="/product/:productIdentifier" element={<ProductPage />} /> 
        <Route path="/faq" element={<FAQ />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        
        {/* Blog routes */}
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        
        {/* Analytics test - Disabled for production */}
        {/* <Route path="/analytics-test" element={<AnalyticsTest />} /> */}
        
        {/* Phase 2: Modern UX Demo - Development only */}
        {process.env.NODE_ENV === 'development' && (
          <Route path="/phase2-demo" element={<Phase2Demo />} />
        )}
        
        {/* Payment routes */}
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/success" element={<PaymentSuccess />} />
        <Route path="/fail" element={<PaymentFailed />} />
        
        {/* Privacy Policy and Terms of Service */}
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        
        {/* 404 Not Found */}
        <Route path="*" element={<NotFound />} />
        </Routes>
      </React.Suspense>
    </>
  );
}

export default AppRouter;
