// Enhanced React Query Hooks for Phase 2
// frontend/src/hooks/useEnhancedQueries.js

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { queryKeys, invalidateQueries, cacheHelpers } from '../lib/queryKeys'
import { useToast } from '../components/ui/Toast'
import { apiClient } from '../lib/apiClient'

// Products Hooks
export const useProducts = (filters = {}) => {
  return useQuery({
    queryKey: queryKeys.products.list(filters),
    queryFn: () => apiClient.get('/products', { params: filters }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    keepPreviousData: true, // Keep showing old data while fetching new
  })
}

export const useProduct = (productId) => {
  return useQuery({
    queryKey: queryKeys.products.detail(productId),
    queryFn: () => apiClient.get(`/products/${productId}`),
    enabled: !!productId,
    staleTime: 3 * 60 * 1000, // 3 minutes
    retry: (failureCount, error) => {
      // Don't retry on 404
      if (error?.status === 404) return false
      return failureCount < 2
    },
  })
}

export const useInfiniteProducts = (filters = {}) => {
  return useInfiniteQuery({
    queryKey: queryKeys.products.list({ ...filters, infinite: true }),
    queryFn: ({ pageParam = 1 }) => 
      apiClient.get('/products', { 
        params: { ...filters, page: pageParam, limit: 12 } 
      }),
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination || {}
      return page < totalPages ? page + 1 : undefined
    },
    staleTime: 5 * 60 * 1000,
    keepPreviousData: true,
  })
}

export const useCreateProduct = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (productData) => apiClient.post('/products', productData),
    onMutate: async (newProduct) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.products.all })

      // Snapshot previous value
      const previousProducts = queryClient.getQueryData(queryKeys.products.lists())

      // Optimistically update to new value
      const optimisticProduct = {
        id: `temp-${Date.now()}`,
        ...newProduct,
        createdAt: new Date().toISOString(),
        status: 'creating'
      }

      cacheHelpers.addToListCache(
        queryClient, 
        queryKeys.products.lists(), 
        optimisticProduct
      )

      toast({
        title: 'Creating product...',
        description: 'Your product is being created',
        type: 'info'
      })

      return { previousProducts, optimisticProduct }
    },
    onError: (err, newProduct, context) => {
      // Rollback
      if (context?.previousProducts) {
        queryClient.setQueryData(queryKeys.products.lists(), context.previousProducts)
      }

      toast({
        title: 'Failed to create product',
        description: err.message || 'Something went wrong',
        type: 'error'
      })
    },
    onSuccess: (data, variables, context) => {
      // Update with real data
      if (context?.optimisticProduct) {
        cacheHelpers.removeFromListCache(
          queryClient, 
          queryKeys.products.lists(), 
          context.optimisticProduct.id
        )
        cacheHelpers.addToListCache(queryClient, queryKeys.products.lists(), data)
      }

      invalidateQueries.allProducts(queryClient)

      toast({
        title: 'Product created!',
        description: 'Your product has been successfully created',
        type: 'success'
      })
    },
  })
}

export const useUpdateProduct = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, ...data }) => apiClient.put(`/products/${id}`, data),
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.products.detail(id) })

      const previousProduct = queryClient.getQueryData(queryKeys.products.detail(id))

      // Optimistic update
      cacheHelpers.updateProductInCache(queryClient, id, (old) => ({
        ...old,
        ...updates,
        updatedAt: new Date().toISOString()
      }))

      toast({
        title: 'Updating product...',
        description: 'Your changes are being saved',
        type: 'info'
      })

      return { previousProduct }
    },
    onError: (err, { id }, context) => {
      if (context?.previousProduct) {
        queryClient.setQueryData(queryKeys.products.detail(id), context.previousProduct)
      }

      toast({
        title: 'Failed to update product',
        description: err.message || 'Something went wrong',
        type: 'error'
      })
    },
    onSuccess: (data, { id }) => {
      // Update with server response
      queryClient.setQueryData(queryKeys.products.detail(id), data)
      invalidateQueries.productList(queryClient)

      toast({
        title: 'Product updated!',
        description: 'Your changes have been saved',
        type: 'success'
      })
    },
  })
}

// Orders Hooks
export const useOrders = (filters = {}) => {
  return useQuery({
    queryKey: queryKeys.orders.list(filters),
    queryFn: () => apiClient.get('/orders', { params: filters }),
    staleTime: 2 * 60 * 1000, // 2 minutes
    keepPreviousData: true,
  })
}

export const useOrder = (orderId) => {
  return useQuery({
    queryKey: queryKeys.orders.detail(orderId),
    queryFn: () => apiClient.get(`/orders/${orderId}`),
    enabled: !!orderId,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: (data) => {
      // Refetch pending orders more frequently
      return data?.status === 'pending' ? 30 * 1000 : false
    },
  })
}

export const useCreateOrder = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (orderData) => apiClient.post('/orders', orderData),
    onMutate: async (newOrder) => {
      const optimisticOrder = {
        id: `temp-${Date.now()}`,
        ...newOrder,
        status: 'pending',
        createdAt: new Date().toISOString()
      }

      cacheHelpers.addToListCache(
        queryClient, 
        queryKeys.orders.lists(), 
        optimisticOrder
      )

      toast({
        title: 'Creating order...',
        description: 'Your order is being processed',
        type: 'info'
      })

      return { optimisticOrder }
    },
    onSuccess: (data, variables, context) => {
      if (context?.optimisticOrder) {
        cacheHelpers.removeFromListCache(
          queryClient, 
          queryKeys.orders.lists(), 
          context.optimisticOrder.id
        )
      }

      invalidateQueries.allOrders(queryClient)
      
      // Invalidate stock data as it may have changed
      invalidateQueries.allStock(queryClient)

      toast({
        title: 'Order created!',
        description: `Order #${data.id} has been created successfully`,
        type: 'success'
      })
    },
    onError: (err, variables, context) => {
      if (context?.optimisticOrder) {
        cacheHelpers.removeFromListCache(
          queryClient, 
          queryKeys.orders.lists(), 
          context.optimisticOrder.id
        )
      }

      toast({
        title: 'Failed to create order',
        description: err.message || 'Something went wrong',
        type: 'error'
      })
    },
  })
}

// Coupons Hooks
export const useCoupons = (filters = {}) => {
  return useQuery({
    queryKey: queryKeys.coupons.list(filters),
    queryFn: () => apiClient.get('/coupons', { params: filters }),
    staleTime: 3 * 60 * 1000, // 3 minutes
  })
}

export const useValidateCoupon = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ code, cartTotal }) => 
      apiClient.post('/coupons/validate', { code, cartTotal }),
    onSuccess: (data, { code }) => {
      // Cache the validation result
      queryClient.setQueryData(queryKeys.coupons.validate(code), data)
    },
    retry: false, // Don't retry coupon validation
  })
}

// Stock Hooks
export const useStock = (productId) => {
  return useQuery({
    queryKey: queryKeys.stock.detail(productId),
    queryFn: () => apiClient.get(`/stock/${productId}`),
    enabled: !!productId,
    staleTime: 30 * 1000, // 30 seconds for stock data
    refetchOnWindowFocus: true, // Always refetch stock on window focus
  })
}

export const useLowStockAlerts = () => {
  return useQuery({
    queryKey: queryKeys.stock.lowStock(),
    queryFn: () => apiClient.get('/stock/alerts/low'),
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  })
}

// Authentication Hooks
export const useAuth = () => {
  return useQuery({
    queryKey: queryKeys.auth.user(),
    queryFn: () => apiClient.get('/auth/me'),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useLogout = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: () => apiClient.post('/auth/logout'),
    onSuccess: () => {
      // Clear all cached data on logout
      queryClient.clear()
      
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out',
        type: 'success'
      })
    },
  })
}

// Search Hooks
export const useSearch = (query, options = {}) => {
  return useQuery({
    queryKey: queryKeys.products.search(query),
    queryFn: () => apiClient.get('/search', { params: { q: query, ...options } }),
    enabled: !!query && query.length > 2, // Only search if query is more than 2 characters
    staleTime: 30 * 1000, // 30 seconds
    keepPreviousData: true,
  })
}

// Analytics Hooks (for admin)
export const useAnalytics = (period = '7d') => {
  return useQuery({
    queryKey: queryKeys.analytics.overview(period),
    queryFn: () => apiClient.get('/admin/analytics', { params: { period } }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!period,
  })
}

// Background sync hooks
export const useBackgroundSync = () => {
  const queryClient = useQueryClient()

  // Sync critical data in background
  const syncCriticalData = () => {
    queryClient.refetchQueries({ 
      queryKey: queryKeys.auth.user(),
      type: 'active' 
    })
    queryClient.refetchQueries({ 
      queryKey: queryKeys.stock.lowStock(),
      type: 'active' 
    })
  }

  return { syncCriticalData }
}
