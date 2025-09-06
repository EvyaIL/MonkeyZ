import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

// Import performance optimizers
import { reactOptimizer, OptimizedImage, VirtualizedList } from './utils/reactOptimizer';
import { performanceOptimizer } from './utils/performanceOptimizerNew';

// Lazy load components for better performance
const HomePage = lazy(() => import('./components/HomePage'));
const ProductPage = lazy(() => import('./components/ProductPage'));
const CartPage = lazy(() => import('./components/CartPage'));
const CheckoutPage = lazy(() => import('./components/CheckoutPage'));

// Configure Redux store (if using Redux)
const store = configureStore({
  reducer: {
    // Your reducers here
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for better performance
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

// Performance monitoring component
const PerformanceMonitor = () => {
  useEffect(() => {
    // Initialize performance monitoring
    performanceOptimizer.initializePerformanceMonitoring();
    
    // Log performance metrics every 30 seconds in development
    if (process.env.NODE_ENV === 'development') {
      const interval = setInterval(() => {
        console.log('Performance Metrics:', reactOptimizer.getPerformanceMetrics());
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, []);
  
  return null;
};

// Loading component for Suspense
const LoadingSpinner = () => (
  <div className="loading-container" style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '50vh'
  }}>
    <div className="loading-spinner">Loading...</div>
  </div>
);

// Error boundary for better error handling
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // You could send this to an error reporting service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong.</h2>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            {this.state.error && this.state.error.toString()}
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

// Main App component with all optimizations
function App() {
  useEffect(() => {
    // Initialize performance optimizations
    performanceOptimizer.initializePerformanceMonitoring();
    performanceOptimizer.optimizeImages();
    performanceOptimizer.preloadCriticalResources();
    
    // Register service worker for caching
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw-optimized.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    }

    // Cleanup function
    return () => {
      reactOptimizer.cleanup();
    };
  }, []);

  return (
    <ErrorBoundary>
      <Provider store={store}>
        <Router>
          <div className="app">
            <PerformanceMonitor />
            
            {/* Navigation component would go here */}
            <nav className="navigation">
              {/* Navigation items */}
            </nav>
            
            {/* Main content with lazy loading */}
            <main className="main-content">
              <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/products/:id" element={<ProductPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </main>
            
            {/* Footer component would go here */}
            <footer className="footer">
              {/* Footer content */}
            </footer>
          </div>
        </Router>
      </Provider>
    </ErrorBoundary>
  );
}

export default reactOptimizer.optimizeComponent(App);
