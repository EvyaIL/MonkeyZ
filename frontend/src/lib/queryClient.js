import { QueryClient } from '@tanstack/react-query';

// Create a query client with optimized defaults
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes before considering it stale
      staleTime: 5 * 60 * 1000,
      // Keep data in cache for 10 minutes after component unmounts
      cacheTime: 10 * 60 * 1000,
      // Retry failed requests twice
      retry: 2,
      // Don't refetch on window focus (better UX)
      refetchOnWindowFocus: false,
      // Enable background updates
      refetchOnMount: true,
      // Refetch interval for real-time data (disabled by default)
      refetchInterval: false,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
    },
  },
});

// Query keys factory for consistent naming
export const queryKeys = {
  // Products
  products: {
    all: ['products'],
    list: (filters) => ['products', 'list', filters],
    detail: (id) => ['products', 'detail', id],
    search: (query) => ['products', 'search', query],
  },
  // Orders
  orders: {
    all: ['orders'],
    list: (filters) => ['orders', 'list', filters],
    detail: (id) => ['orders', 'detail', id],
    user: (userId) => ['orders', 'user', userId],
  },
  // Admin
  admin: {
    analytics: ['admin', 'analytics'],
    stock: ['admin', 'stock'],
    coupons: ['admin', 'coupons'],
    users: ['admin', 'users'],
  },
  // User
  user: {
    profile: ['user', 'profile'],
    orders: ['user', 'orders'],
    preferences: ['user', 'preferences'],
  },
};

// Prefetch common data
export const prefetchCommonData = async () => {
  // Prefetch products list on app load
  await queryClient.prefetchQuery({
    queryKey: queryKeys.products.list(),
    queryFn: () => import('../lib/apiService').then(api => api.default.getProducts()),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Performance optimizations
export const optimizeQueries = () => {
  // Remove inactive queries after 5 minutes
  queryClient.getQueryCache().subscribe((event) => {
    if (event?.type === 'observerRemoved' && event.query.getObserversCount() === 0) {
      setTimeout(() => {
        if (event.query.getObserversCount() === 0) {
          queryClient.removeQueries(event.query.queryKey);
        }
      }, 5 * 60 * 1000);
    }
  });
};

export default queryClient;
