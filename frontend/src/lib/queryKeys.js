// Query Keys Factory for Phase 2
// frontend/src/lib/queryKeys.js

// Centralized query key management for React Query
// This ensures consistent cache invalidation and prevents key conflicts

export const queryKeys = {
  // Products
  products: {
    all: ['products'],
    lists: () => [...queryKeys.products.all, 'list'],
    list: (filters) => [...queryKeys.products.lists(), { filters }],
    details: () => [...queryKeys.products.all, 'detail'],
    detail: (id) => [...queryKeys.products.details(), id],
    search: (query) => [...queryKeys.products.all, 'search', query],
    categories: () => [...queryKeys.products.all, 'categories'],
    featured: () => [...queryKeys.products.all, 'featured'],
    trending: () => [...queryKeys.products.all, 'trending'],
  },

  // Orders
  orders: {
    all: ['orders'],
    lists: () => [...queryKeys.orders.all, 'list'],
    list: (filters) => [...queryKeys.orders.lists(), { filters }],
    details: () => [...queryKeys.orders.all, 'detail'],
    detail: (id) => [...queryKeys.orders.details(), id],
    user: (userId) => [...queryKeys.orders.all, 'user', userId],
    admin: () => [...queryKeys.orders.all, 'admin'],
    statistics: () => [...queryKeys.orders.all, 'statistics'],
  },

  // Coupons
  coupons: {
    all: ['coupons'],
    lists: () => [...queryKeys.coupons.all, 'list'],
    list: (filters) => [...queryKeys.coupons.lists(), { filters }],
    details: () => [...queryKeys.coupons.all, 'detail'],
    detail: (id) => [...queryKeys.coupons.details(), id],
    validate: (code) => [...queryKeys.coupons.all, 'validate', code],
    user: (userId) => [...queryKeys.coupons.all, 'user', userId],
    admin: () => [...queryKeys.coupons.all, 'admin'],
  },

  // Users
  users: {
    all: ['users'],
    lists: () => [...queryKeys.users.all, 'list'],
    list: (filters) => [...queryKeys.users.lists(), { filters }],
    details: () => [...queryKeys.users.all, 'detail'],
    detail: (id) => [...queryKeys.users.details(), id],
    profile: () => [...queryKeys.users.all, 'profile'],
    admin: () => [...queryKeys.users.all, 'admin'],
  },

  // Authentication
  auth: {
    all: ['auth'],
    user: () => [...queryKeys.auth.all, 'user'],
    profile: () => [...queryKeys.auth.all, 'profile'],
    permissions: () => [...queryKeys.auth.all, 'permissions'],
  },

  // Stock
  stock: {
    all: ['stock'],
    lists: () => [...queryKeys.stock.all, 'list'],
    list: (filters) => [...queryKeys.stock.lists(), { filters }],
    details: () => [...queryKeys.stock.all, 'detail'],
    detail: (productId) => [...queryKeys.stock.details(), productId],
    alerts: () => [...queryKeys.stock.all, 'alerts'],
    lowStock: () => [...queryKeys.stock.all, 'lowStock'],
  },

  // Analytics
  analytics: {
    all: ['analytics'],
    overview: () => [...queryKeys.analytics.all, 'overview'],
    sales: (period) => [...queryKeys.analytics.all, 'sales', period],
    products: (period) => [...queryKeys.analytics.all, 'products', period],
    users: (period) => [...queryKeys.analytics.all, 'users', period],
    revenue: (period) => [...queryKeys.analytics.all, 'revenue', period],
  },

  // Admin
  admin: {
    all: ['admin'],
    dashboard: () => [...queryKeys.admin.all, 'dashboard'],
    logs: () => [...queryKeys.admin.all, 'logs'],
    settings: () => [...queryKeys.admin.all, 'settings'],
    backups: () => [...queryKeys.admin.all, 'backups'],
  },

  // System
  system: {
    all: ['system'],
    health: () => [...queryKeys.system.all, 'health'],
    version: () => [...queryKeys.system.all, 'version'],
    config: () => [...queryKeys.system.all, 'config'],
  },
}

// Helper functions for cache invalidation
export const invalidateQueries = {
  // Products
  allProducts: (queryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.products.all })
  },
  productList: (queryClient, filters) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.products.list(filters) })
  },
  productDetail: (queryClient, id) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(id) })
  },

  // Orders
  allOrders: (queryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.orders.all })
  },
  userOrders: (queryClient, userId) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.orders.user(userId) })
  },
  orderDetail: (queryClient, id) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(id) })
  },

  // Coupons
  allCoupons: (queryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.coupons.all })
  },
  couponValidation: (queryClient, code) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.coupons.validate(code) })
  },

  // Users
  allUsers: (queryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
  },
  userProfile: (queryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.users.profile() })
  },

  // Auth
  authUser: (queryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.auth.user() })
  },

  // Stock
  allStock: (queryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.stock.all })
  },
  productStock: (queryClient, productId) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.stock.detail(productId) })
  },
}

// Cache helpers for optimistic updates
export const cacheHelpers = {
  // Update product in cache
  updateProductInCache: (queryClient, productId, updater) => {
    queryClient.setQueryData(
      queryKeys.products.detail(productId),
      (oldData) => oldData ? updater(oldData) : oldData
    )
    
    // Also update in lists
    queryClient.setQueriesData(
      { queryKey: queryKeys.products.lists() },
      (oldData) => {
        if (!oldData?.items) return oldData
        
        return {
          ...oldData,
          items: oldData.items.map(item => 
            item.id === productId ? updater(item) : item
          )
        }
      }
    )
  },

  // Update order in cache
  updateOrderInCache: (queryClient, orderId, updater) => {
    queryClient.setQueryData(
      queryKeys.orders.detail(orderId),
      (oldData) => oldData ? updater(oldData) : oldData
    )
    
    // Update in lists
    queryClient.setQueriesData(
      { queryKey: queryKeys.orders.lists() },
      (oldData) => {
        if (!oldData?.items) return oldData
        
        return {
          ...oldData,
          items: oldData.items.map(item => 
            item.id === orderId ? updater(item) : item
          )
        }
      }
    )
  },

  // Add new item to list cache
  addToListCache: (queryClient, queryKey, newItem) => {
    queryClient.setQueriesData(
      { queryKey },
      (oldData) => {
        if (!oldData?.items) return oldData
        
        return {
          ...oldData,
          items: [newItem, ...oldData.items],
          total: (oldData.total || 0) + 1
        }
      }
    )
  },

  // Remove item from list cache
  removeFromListCache: (queryClient, queryKey, itemId) => {
    queryClient.setQueriesData(
      { queryKey },
      (oldData) => {
        if (!oldData?.items) return oldData
        
        return {
          ...oldData,
          items: oldData.items.filter(item => item.id !== itemId),
          total: Math.max((oldData.total || 0) - 1, 0)
        }
      }
    )
  },
}

// Prefetching helpers
export const prefetchHelpers = {
  // Prefetch product details when hovering over product card
  prefetchProduct: async (queryClient, productId) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.products.detail(productId),
      queryFn: () => fetch(`/api/products/${productId}`).then(res => res.json()),
      staleTime: 5 * 60 * 1000, // 5 minutes
    })
  },

  // Prefetch user orders when visiting profile
  prefetchUserOrders: async (queryClient, userId) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.orders.user(userId),
      queryFn: () => fetch(`/api/orders/user/${userId}`).then(res => res.json()),
      staleTime: 2 * 60 * 1000, // 2 minutes
    })
  },

  // Prefetch related products
  prefetchRelatedProducts: async (queryClient, category) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.products.list({ category, limit: 4 }),
      queryFn: () => fetch(`/api/products?category=${category}&limit=4`).then(res => res.json()),
      staleTime: 10 * 60 * 1000, // 10 minutes
    })
  },
}

export default queryKeys
