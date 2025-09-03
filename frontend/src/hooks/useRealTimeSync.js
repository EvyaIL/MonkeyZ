// Real-time Synchronization for Phase 2
// frontend/src/hooks/useRealTimeSync.js

import { useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys, invalidateQueries, cacheHelpers } from '../lib/queryKeys'
import { useToast } from '../components/ui/Toast'

// WebSocket connection manager
class WebSocketManager {
  constructor() {
    this.ws = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 1000
    this.listeners = new Map()
    this.isConnecting = false
  }

  connect(url) {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.CONNECTING)) {
      return
    }

    this.isConnecting = true

    try {
      this.ws = new WebSocket(url)

      this.ws.onopen = () => {
        console.log('🔗 WebSocket connected')
        this.isConnecting = false
        this.reconnectAttempts = 0
        this.notifyListeners('connection', { status: 'connected' })
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.handleMessage(data)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      this.ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.reason)
        this.isConnecting = false
        this.notifyListeners('connection', { status: 'disconnected', reason: event.reason })
        
        if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect(url)
        }
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        this.isConnecting = false
        this.notifyListeners('error', { error })
      }
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      this.isConnecting = false
    }
  }

  scheduleReconnect(url) {
    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
    
    console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
    
    setTimeout(() => {
      this.connect(url)
    }, delay)
  }

  handleMessage(data) {
    const { type, payload } = data
    this.notifyListeners(type, payload)
  }

  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event).add(callback)

    // Return unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(event)
      if (eventListeners) {
        eventListeners.delete(callback)
      }
    }
  }

  notifyListeners(event, data) {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in WebSocket listener for ${event}:`, error)
        }
      })
    }
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    } else {
      console.warn('WebSocket is not connected')
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnecting')
      this.ws = null
    }
    this.listeners.clear()
  }

  getConnectionStatus() {
    if (!this.ws) return 'disconnected'
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting'
      case WebSocket.OPEN:
        return 'connected'
      case WebSocket.CLOSING:
        return 'disconnecting'
      case WebSocket.CLOSED:
        return 'disconnected'
      default:
        return 'unknown'
    }
  }
}

// Singleton WebSocket manager
const wsManager = new WebSocketManager()

// Real-time sync hook
export const useRealTimeSync = (options = {}) => {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { 
    enabled = true, 
    wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8000/ws',
    showToasts = true 
  } = options

  const connectionStatus = useRef('disconnected')

  // Handle real-time events
  const handleProductUpdate = useCallback((data) => {
    const { product, action } = data
    
    switch (action) {
      case 'created':
        cacheHelpers.addToListCache(queryClient, queryKeys.products.lists(), product)
        if (showToasts) {
          toast({
            title: 'New Product Added',
            description: `${product.name} is now available`,
            type: 'info'
          })
        }
        break
        
      case 'updated':
        cacheHelpers.updateProductInCache(queryClient, product.id, () => product)
        invalidateQueries.productDetail(queryClient, product.id)
        break
        
      case 'deleted':
        cacheHelpers.removeFromListCache(queryClient, queryKeys.products.lists(), product.id)
        queryClient.removeQueries({ queryKey: queryKeys.products.detail(product.id) })
        break
        
      case 'stock_updated':
        invalidateQueries.productStock(queryClient, product.id)
        if (product.stock <= 5 && showToasts) {
          toast({
            title: 'Low Stock Alert',
            description: `${product.name} is running low (${product.stock} left)`,
            type: 'warning'
          })
        }
        break
    }
  }, [queryClient, toast, showToasts])

  const handleOrderUpdate = useCallback((data) => {
    const { order, action } = data
    
    switch (action) {
      case 'created':
        cacheHelpers.addToListCache(queryClient, queryKeys.orders.lists(), order)
        invalidateQueries.allStock(queryClient) // Orders affect stock
        if (showToasts) {
          toast({
            title: 'New Order',
            description: `Order #${order.id} has been placed`,
            type: 'success'
          })
        }
        break
        
      case 'status_updated':
        cacheHelpers.updateOrderInCache(queryClient, order.id, () => order)
        invalidateQueries.orderDetail(queryClient, order.id)
        
        if (order.status === 'completed' && showToasts) {
          toast({
            title: 'Order Completed',
            description: `Order #${order.id} has been completed`,
            type: 'success'
          })
        }
        break
        
      case 'payment_received':
        cacheHelpers.updateOrderInCache(queryClient, order.id, (old) => ({
          ...old,
          paymentStatus: 'paid',
          paidAt: new Date().toISOString()
        }))
        break
    }
  }, [queryClient, toast, showToasts])

  const handleStockUpdate = useCallback((data) => {
    const { productId, stock, action } = data
    
    // Update stock cache
    queryClient.setQueryData(queryKeys.stock.detail(productId), (oldData) => ({
      ...oldData,
      quantity: stock.quantity,
      available: stock.available,
      reserved: stock.reserved,
      updatedAt: new Date().toISOString()
    }))
    
    // Update product cache if it includes stock info
    cacheHelpers.updateProductInCache(queryClient, productId, (old) => ({
      ...old,
      stock: stock.quantity,
      available: stock.available
    }))
    
    if (action === 'low_stock' && showToasts) {
      toast({
        title: 'Low Stock Alert',
        description: `Product stock is running low (${stock.quantity} left)`,
        type: 'warning'
      })
    }
  }, [queryClient, toast, showToasts])

  const handleCouponUpdate = useCallback((data) => {
    const { coupon, action } = data
    
    switch (action) {
      case 'usage_updated':
        cacheHelpers.updateProductInCache(queryClient, coupon.id, () => coupon)
        // Invalidate coupon validation cache
        queryClient.removeQueries({ 
          queryKey: queryKeys.coupons.validate(coupon.code) 
        })
        break
        
      case 'expired':
        if (showToasts) {
          toast({
            title: 'Coupon Expired',
            description: `Coupon "${coupon.code}" has expired`,
            type: 'warning'
          })
        }
        break
    }
  }, [queryClient, toast, showToasts])

  const handleConnectionStatus = useCallback((data) => {
    connectionStatus.current = data.status
    
    if (data.status === 'connected' && showToasts) {
      toast({
        title: 'Connected',
        description: 'Real-time updates are now active',
        type: 'success'
      })
    } else if (data.status === 'disconnected' && showToasts) {
      toast({
        title: 'Disconnected',
        description: 'Real-time updates are temporarily unavailable',
        type: 'warning'
      })
    }
  }, [toast, showToasts])

  useEffect(() => {
    if (!enabled) return

    // Subscribe to WebSocket events
    const unsubscribers = [
      wsManager.subscribe('product_update', handleProductUpdate),
      wsManager.subscribe('order_update', handleOrderUpdate),
      wsManager.subscribe('stock_update', handleStockUpdate),
      wsManager.subscribe('coupon_update', handleCouponUpdate),
      wsManager.subscribe('connection', handleConnectionStatus),
    ]

    // Connect WebSocket
    wsManager.connect(wsUrl)

    // Cleanup
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe())
    }
  }, [
    enabled, 
    wsUrl, 
    handleProductUpdate, 
    handleOrderUpdate, 
    handleStockUpdate, 
    handleCouponUpdate,
    handleConnectionStatus
  ])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (!enabled) {
        wsManager.disconnect()
      }
    }
  }, [enabled])

  // Public API
  const sendMessage = useCallback((type, data) => {
    wsManager.send({ type, data })
  }, [])

  const subscribe = useCallback((event, callback) => {
    return wsManager.subscribe(event, callback)
  }, [])

  const getConnectionStatus = useCallback(() => {
    return wsManager.getConnectionStatus()
  }, [])

  return {
    connectionStatus: connectionStatus.current,
    sendMessage,
    subscribe,
    getConnectionStatus,
    isConnected: connectionStatus.current === 'connected'
  }
}

// Hook for subscribing to specific real-time events
export const useRealTimeEvent = (event, callback, dependencies = []) => {
  useEffect(() => {
    const unsubscribe = wsManager.subscribe(event, callback)
    return unsubscribe
  }, [event, ...dependencies])
}

// Hook for real-time product updates
export const useRealTimeProduct = (productId) => {
  const queryClient = useQueryClient()
  
  useRealTimeEvent('product_update', (data) => {
    if (data.product.id === productId) {
      cacheHelpers.updateProductInCache(queryClient, productId, () => data.product)
    }
  }, [productId, queryClient])
}

// Hook for real-time order tracking
export const useRealTimeOrder = (orderId) => {
  const queryClient = useQueryClient()
  
  useRealTimeEvent('order_update', (data) => {
    if (data.order.id === orderId) {
      cacheHelpers.updateOrderInCache(queryClient, orderId, () => data.order)
    }
  }, [orderId, queryClient])
}

// Export WebSocket manager for advanced usage
export { wsManager }

export default useRealTimeSync
