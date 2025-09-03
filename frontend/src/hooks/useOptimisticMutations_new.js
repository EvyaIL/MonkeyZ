// Simplified React Query Hooks for Phase 2 Demo
// frontend/src/hooks/useOptimisticMutations.js

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '../components/ui/Toast'

// Mock API for demo purposes
const mockAPI = {
  createProduct: async (data) => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    return { id: Date.now(), ...data, createdAt: new Date().toISOString() }
  },
  updateProduct: async ({ id, ...data }) => {
    await new Promise(resolve => setTimeout(resolve, 800))
    return { id, ...data, updatedAt: new Date().toISOString() }
  },
  createOrder: async (data) => {
    await new Promise(resolve => setTimeout(resolve, 1200))
    return { id: Date.now(), ...data, status: 'pending', createdAt: new Date().toISOString() }
  }
}

// Query Keys
export const queryKeys = {
  products: {
    all: ['products'],
    list: (params) => ['products', 'list', params],
    detail: (id) => ['products', 'detail', id]
  },
  orders: {
    all: ['orders'],
    list: (params) => ['orders', 'list', params],
    detail: (id) => ['orders', 'detail', id]
  }
}

// Create Product Hook with Optimistic Updates
export const useCreateProduct = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: mockAPI.createProduct,
    onMutate: async (newProduct) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.products.all })

      const previousProducts = queryClient.getQueryData(queryKeys.products.list({}))

      const optimisticProduct = {
        id: `temp-${Date.now()}`,
        ...newProduct,
        createdAt: new Date().toISOString(),
        status: 'creating'
      }

      queryClient.setQueryData(queryKeys.products.list({}), (old = []) => {
        return [optimisticProduct, ...old]
      })

      toast({
        title: 'Creating product...',
        description: 'Your product is being created',
        type: 'info'
      })

      return { previousProducts, optimisticProduct }
    },
    onError: (err, newProduct, context) => {
      queryClient.setQueryData(queryKeys.products.list({}), context?.previousProducts)
      
      toast({
        title: 'Failed to create product',
        description: err.message || 'Something went wrong',
        type: 'error'
      })
    },
    onSuccess: (data, variables, context) => {
      queryClient.setQueryData(queryKeys.products.list({}), (old = []) => {
        return old.map(product => 
          product.id === context?.optimisticProduct?.id ? data : product
        )
      })

      toast({
        title: 'Product created successfully!',
        description: `${data.name} has been added to your catalog`,
        type: 'success'
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all })
    },
  })
}

// Update Product Hook
export const useUpdateProduct = () => {
  const { toast } = useToast()

  return useMutation({
    mutationFn: mockAPI.updateProduct,
    onSuccess: (data) => {
      toast({
        title: 'Product updated!',
        description: 'Your changes have been saved',
        type: 'success'
      })
    },
    onError: (err) => {
      toast({
        title: 'Failed to update product',
        description: err.message || 'Something went wrong',
        type: 'error'
      })
    }
  })
}

// Create Order Hook
export const useCreateOrder = () => {
  const { toast } = useToast()

  return useMutation({
    mutationFn: mockAPI.createOrder,
    onMutate: async (newOrder) => {
      toast({
        title: 'Creating order...',
        description: 'Your order is being processed',
        type: 'info'
      })

      return { optimisticOrder: { id: `temp-${Date.now()}`, ...newOrder } }
    },
    onSuccess: (data) => {
      toast({
        title: 'Order created!',
        description: `Order #${data.id} has been created successfully`,
        type: 'success'
      })
    },
    onError: (err) => {
      toast({
        title: 'Failed to create order',
        description: err.message || 'Something went wrong',
        type: 'error'
      })
    }
  })
}

// Placeholder hooks for compatibility
export const useProducts = () => useQuery({ queryKey: ['products'], queryFn: () => [] })
export const useProduct = () => useQuery({ queryKey: ['product'], queryFn: () => null })
export const useOrders = () => useQuery({ queryKey: ['orders'], queryFn: () => [] })
export const useOrder = () => useQuery({ queryKey: ['order'], queryFn: () => null })
export const useCoupons = () => useQuery({ queryKey: ['coupons'], queryFn: () => [] })
export const useValidateCoupon = () => useMutation({ mutationFn: () => Promise.resolve() })
export const useProfile = () => useQuery({ queryKey: ['profile'], queryFn: () => null })
export const useUpdateProfile = () => useMutation({ mutationFn: () => Promise.resolve() })
export const useDeleteProduct = () => useMutation({ mutationFn: () => Promise.resolve() })
