// Query utilities and API client for data fetching
// frontend/src/lib/api.js

import { apiHelpers } from './utils'

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000'

// API Client with proper error handling and loading states
class ApiClient {
  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL
    this.defaultHeaders = {
      'Content-Type': 'application/json'
    }
  }

  // Set authorization token
  setAuthToken(token) {
    if (token) {
      this.defaultHeaders.Authorization = `Bearer ${token}`
    } else {
      delete this.defaultHeaders.Authorization
    }
  }

  // Generic request method with comprehensive error handling
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const config = {
      headers: { ...this.defaultHeaders, ...options.headers },
      ...options
    }

    try {
      const response = await fetch(url, config)
      
      // Handle different response types
      const contentType = response.headers.get('content-type')
      let data
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        data = await response.text()
      }

      if (!response.ok) {
        throw new Error(data.message || data || `HTTP error! status: ${response.status}`)
      }

      return apiHelpers.success(data)
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error)
      return apiHelpers.error(error.message)
    }
  }

  // HTTP Methods
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString()
    const url = queryString ? `${endpoint}?${queryString}` : endpoint
    return this.request(url, { method: 'GET' })
  }

  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  async patch(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' })
  }

  // File upload method
  async uploadFile(endpoint, file, additionalData = {}) {
    const formData = new FormData()
    formData.append('file', file)
    
    Object.keys(additionalData).forEach(key => {
      formData.append(key, additionalData[key])
    })

    return this.request(endpoint, {
      method: 'POST',
      body: formData,
      headers: {} // Remove Content-Type header for FormData
    })
  }
}

// Create API client instance
export const apiClient = new ApiClient()

// API endpoints organized by feature
export const endpoints = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    profile: '/auth/profile'
  },
  products: {
    list: '/products',
    detail: (id) => `/products/${id}`,
    create: '/products',
    update: (id) => `/products/${id}`,
    delete: (id) => `/products/${id}`,
    categories: '/products/categories'
  },
  orders: {
    list: '/orders',
    detail: (id) => `/orders/${id}`,
    create: '/orders',
    update: (id) => `/orders/${id}`,
    cancel: (id) => `/orders/${id}/cancel`,
    paypal: '/orders/paypal'
  },
  coupons: {
    list: '/coupons',
    detail: (id) => `/coupons/${id}`,
    validate: '/coupons/validate',
    apply: '/coupons/apply'
  },
  admin: {
    dashboard: '/admin/dashboard',
    users: '/admin/users',
    analytics: '/admin/analytics'
  }
}

// Specific API methods for common operations
export const authAPI = {
  login: (credentials) => apiClient.post(endpoints.auth.login, credentials),
  register: (userData) => apiClient.post(endpoints.auth.register, userData),
  logout: () => apiClient.post(endpoints.auth.logout),
  getProfile: () => apiClient.get(endpoints.auth.profile),
  updateProfile: (data) => apiClient.patch(endpoints.auth.profile, data)
}

export const productsAPI = {
  getProducts: (params) => apiClient.get(endpoints.products.list, params),
  getProduct: (id) => apiClient.get(endpoints.products.detail(id)),
  createProduct: (data) => apiClient.post(endpoints.products.create, data),
  updateProduct: (id, data) => apiClient.put(endpoints.products.update(id), data),
  deleteProduct: (id) => apiClient.delete(endpoints.products.delete(id)),
  getCategories: () => apiClient.get(endpoints.products.categories)
}

export const ordersAPI = {
  getOrders: (params) => apiClient.get(endpoints.orders.list, params),
  getOrder: (id) => apiClient.get(endpoints.orders.detail(id)),
  createOrder: (data) => apiClient.post(endpoints.orders.create, data),
  updateOrder: (id, data) => apiClient.patch(endpoints.orders.update(id), data),
  cancelOrder: (id) => apiClient.post(endpoints.orders.cancel(id)),
  createPayPalOrder: (data) => apiClient.post(endpoints.orders.paypal, data)
}

export const couponsAPI = {
  getCoupons: (params) => apiClient.get(endpoints.coupons.list, params),
  getCoupon: (id) => apiClient.get(endpoints.coupons.detail(id)),
  validateCoupon: (code, orderData) => apiClient.post(endpoints.coupons.validate, { code, ...orderData }),
  applyCoupon: (code, orderData) => apiClient.post(endpoints.coupons.apply, { code, ...orderData })
}

export const adminAPI = {
  getDashboard: () => apiClient.get(endpoints.admin.dashboard),
  getUsers: (params) => apiClient.get(endpoints.admin.users, params),
  getAnalytics: (params) => apiClient.get(endpoints.admin.analytics, params)
}

// Query key factories for React Query
export const queryKeys = {
  auth: {
    profile: ['auth', 'profile']
  },
  products: {
    all: ['products'],
    list: (params) => ['products', 'list', params],
    detail: (id) => ['products', 'detail', id],
    categories: ['products', 'categories']
  },
  orders: {
    all: ['orders'],
    list: (params) => ['orders', 'list', params],
    detail: (id) => ['orders', 'detail', id]
  },
  coupons: {
    all: ['coupons'],
    list: (params) => ['coupons', 'list', params],
    detail: (id) => ['coupons', 'detail', id]
  },
  admin: {
    dashboard: ['admin', 'dashboard'],
    users: (params) => ['admin', 'users', params],
    analytics: (params) => ['admin', 'analytics', params]
  }
}

// Custom hooks for common API operations (will be used with React Query)
export const useApiMutation = (mutationFn, options = {}) => {
  // This will be implemented when we add React Query
  // For now, returning the mutation function directly
  return { mutate: mutationFn, ...options }
}

export const useApiQuery = (queryKey, queryFn, options = {}) => {
  // This will be implemented when we add React Query
  // For now, returning basic structure
  return { data: null, isLoading: true, error: null, ...options }
}
