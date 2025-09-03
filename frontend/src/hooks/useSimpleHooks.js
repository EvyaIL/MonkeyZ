// Simple test hooks for Phase 2 Demo
// frontend/src/hooks/useSimpleHooks.js

import { useMutation, useQuery } from '@tanstack/react-query'

// Simple mock functions
const mockCreateProduct = async (data) => {
  await new Promise(resolve => setTimeout(resolve, 1000))
  return { id: Date.now(), ...data, createdAt: new Date().toISOString() }
}

const mockUpdateProduct = async ({ id, ...data }) => {
  await new Promise(resolve => setTimeout(resolve, 800))
  return { id, ...data, updatedAt: new Date().toISOString() }
}

const mockCreateOrder = async (data) => {
  await new Promise(resolve => setTimeout(resolve, 1200))
  return { id: Date.now(), ...data, status: 'pending', createdAt: new Date().toISOString() }
}

// Simple hooks without toast for testing
export const useCreateProduct = () => {
  return useMutation({
    mutationFn: mockCreateProduct,
    onSuccess: (data) => {
      console.log('Product created:', data)
    },
    onError: (err) => {
      console.error('Failed to create product:', err)
    }
  })
}

export const useUpdateProduct = () => {
  return useMutation({
    mutationFn: mockUpdateProduct,
    onSuccess: (data) => {
      console.log('Product updated:', data)
    },
    onError: (err) => {
      console.error('Failed to update product:', err)
    }
  })
}

export const useCreateOrder = () => {
  return useMutation({
    mutationFn: mockCreateOrder,
    onSuccess: (data) => {
      console.log('Order created:', data)
    },
    onError: (err) => {
      console.error('Failed to create order:', err)
    }
  })
}
