// Advanced Error Handling for Phase 2
// frontend/src/hooks/useAdvancedErrorHandling.js

import { useState, useCallback, useRef, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useToast } from '../components/ui/Toast'

// Error classification system
const ErrorTypes = {
  NETWORK: 'network',
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  VALIDATION: 'validation',
  SERVER: 'server',
  CLIENT: 'client',
  TIMEOUT: 'timeout',
  RATE_LIMIT: 'rate_limit',
  MAINTENANCE: 'maintenance',
  UNKNOWN: 'unknown'
}

// Error severity levels
const ErrorSeverity = {
  LOW: 'low',        // Non-blocking, background errors
  MEDIUM: 'medium',  // Affects functionality but not critical
  HIGH: 'high',      // Blocks important functionality
  CRITICAL: 'critical' // Blocks core app functionality
}

// Classify error based on status code and context
const classifyError = (error) => {
  const status = error?.status || error?.response?.status
  const message = error?.message || error?.response?.data?.message || ''

  let type = ErrorTypes.UNKNOWN
  let severity = ErrorSeverity.MEDIUM
  let recoverable = true
  let retryable = true

  switch (status) {
    case 400:
      type = ErrorTypes.VALIDATION
      severity = ErrorSeverity.LOW
      retryable = false
      break
    case 401:
      type = ErrorTypes.AUTHENTICATION
      severity = ErrorSeverity.HIGH
      retryable = false
      break
    case 403:
      type = ErrorTypes.AUTHORIZATION
      severity = ErrorSeverity.HIGH
      retryable = false
      break
    case 404:
      type = ErrorTypes.CLIENT
      severity = ErrorSeverity.MEDIUM
      retryable = false
      break
    case 408:
      type = ErrorTypes.TIMEOUT
      severity = ErrorSeverity.MEDIUM
      retryable = true
      break
    case 429:
      type = ErrorTypes.RATE_LIMIT
      severity = ErrorSeverity.MEDIUM
      retryable = true
      break
    case 500:
    case 502:
    case 503:
      type = ErrorTypes.SERVER
      severity = ErrorSeverity.HIGH
      retryable = true
      break
    case 504:
      type = ErrorTypes.TIMEOUT
      severity = ErrorSeverity.MEDIUM
      retryable = true
      break
    default:
      if (!status) {
        if (message.toLowerCase().includes('network')) {
          type = ErrorTypes.NETWORK
          severity = ErrorSeverity.MEDIUM
          retryable = true
        } else if (message.toLowerCase().includes('timeout')) {
          type = ErrorTypes.TIMEOUT
          severity = ErrorSeverity.MEDIUM
          retryable = true
        }
      }
  }

  // Check for maintenance mode
  if (message.toLowerCase().includes('maintenance')) {
    type = ErrorTypes.MAINTENANCE
    severity = ErrorSeverity.CRITICAL
    retryable = false
    recoverable = false
  }

  return {
    type,
    severity,
    recoverable,
    retryable,
    originalError: error,
    timestamp: new Date().toISOString()
  }
}

// Advanced error handling hook
export const useAdvancedErrorHandling = (options = {}) => {
  const {
    maxRetries = 3,
    baseRetryDelay = 1000,
    maxRetryDelay = 30000,
    enableAutomaticRecovery = true,
    showToasts = true,
    logErrors = true
  } = options

  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [errorState, setErrorState] = useState({
    errors: [],
    isRecovering: false,
    lastRecoveryAttempt: null,
    recoveryStrategies: []
  })

  const retryAttempts = useRef(new Map())
  const errorLog = useRef([])

  // Calculate retry delay with exponential backoff and jitter
  const calculateRetryDelay = useCallback((attempt, errorType) => {
    const baseDelay = errorType === ErrorTypes.RATE_LIMIT ? 5000 : baseRetryDelay
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1)
    const jitter = Math.random() * 0.1 * exponentialDelay // 10% jitter
    return Math.min(exponentialDelay + jitter, maxRetryDelay)
  }, [baseRetryDelay, maxRetryDelay])

  // Handle error with classification and recovery
  const handleError = useCallback(async (error, context = {}) => {
    const classifiedError = classifyError(error)
    const errorId = `${Date.now()}-${Math.random()}`
    
    const enrichedError = {
      ...classifiedError,
      id: errorId,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: context.userId || 'anonymous'
    }

    // Log error
    if (logErrors) {
      errorLog.current.push(enrichedError)
      console.error('Classified Error:', enrichedError)
    }

    // Update error state
    setErrorState(prev => ({
      ...prev,
      errors: [...prev.errors.slice(-9), enrichedError] // Keep last 10 errors
    }))

    // Show user notification based on severity
    if (showToasts) {
      showErrorToast(enrichedError)
    }

    // Attempt automatic recovery if enabled
    if (enableAutomaticRecovery && classifiedError.recoverable) {
      await attemptRecovery(enrichedError)
    }

    return enrichedError
  }, [logErrors, showToasts, enableAutomaticRecovery])

  // Show appropriate error toast based on error type and severity
  const showErrorToast = useCallback((error) => {
    const { type, severity, originalError } = error
    
    let title = 'Error'
    let description = 'Something went wrong'
    let toastType = 'error'

    switch (type) {
      case ErrorTypes.NETWORK:
        title = 'Connection Error'
        description = 'Please check your internet connection and try again'
        toastType = 'warning'
        break
      case ErrorTypes.AUTHENTICATION:
        title = 'Authentication Required'
        description = 'Please sign in to continue'
        toastType = 'warning'
        break
      case ErrorTypes.AUTHORIZATION:
        title = 'Access Denied'
        description = 'You don\'t have permission to perform this action'
        break
      case ErrorTypes.VALIDATION:
        title = 'Invalid Input'
        description = originalError.message || 'Please check your input and try again'
        toastType = 'warning'
        break
      case ErrorTypes.RATE_LIMIT:
        title = 'Too Many Requests'
        description = 'Please wait a moment before trying again'
        toastType = 'warning'
        break
      case ErrorTypes.MAINTENANCE:
        title = 'Maintenance Mode'
        description = 'The system is temporarily unavailable for maintenance'
        break
      case ErrorTypes.TIMEOUT:
        title = 'Request Timeout'
        description = 'The request took too long to complete. Please try again'
        toastType = 'warning'
        break
      default:
        title = 'Unexpected Error'
        description = originalError.message || 'An unexpected error occurred'
    }

    // Only show critical and high severity errors to users
    if (severity === ErrorSeverity.CRITICAL || severity === ErrorSeverity.HIGH) {
      toast({
        title,
        description,
        type: toastType,
        duration: severity === ErrorSeverity.CRITICAL ? 0 : 5000 // Critical errors don't auto-dismiss
      })
    }
  }, [toast])

  // Attempt automatic error recovery
  const attemptRecovery = useCallback(async (error) => {
    const { type, id, context } = error
    const recoveryKey = `${type}-${context.operation || 'unknown'}`
    
    setErrorState(prev => ({ ...prev, isRecovering: true }))

    try {
      switch (type) {
        case ErrorTypes.NETWORK:
          // Wait and retry network requests
          await new Promise(resolve => setTimeout(resolve, 2000))
          if (context.queryKey) {
            await queryClient.refetchQueries({ queryKey: context.queryKey })
          }
          break

        case ErrorTypes.AUTHENTICATION:
          // Try to refresh authentication
          try {
            await queryClient.refetchQueries({ queryKey: ['auth', 'user'] })
          } catch (authError) {
            // Redirect to login if refresh fails
            window.location.href = '/sign-in'
          }
          break

        case ErrorTypes.TIMEOUT:
          // Retry with exponential backoff
          const attempt = retryAttempts.current.get(recoveryKey) || 0
          if (attempt < maxRetries) {
            const delay = calculateRetryDelay(attempt + 1, type)
            retryAttempts.current.set(recoveryKey, attempt + 1)
            
            await new Promise(resolve => setTimeout(resolve, delay))
            
            if (context.queryKey) {
              await queryClient.refetchQueries({ queryKey: context.queryKey })
            }
          }
          break

        case ErrorTypes.RATE_LIMIT:
          // Wait longer for rate limit errors
          await new Promise(resolve => setTimeout(resolve, 10000))
          if (context.queryKey) {
            await queryClient.refetchQueries({ queryKey: context.queryKey })
          }
          break

        default:
          // Generic recovery: invalidate and refetch
          if (context.queryKey) {
            queryClient.invalidateQueries({ queryKey: context.queryKey })
          }
      }

      // Recovery successful
      setErrorState(prev => ({
        ...prev,
        isRecovering: false,
        lastRecoveryAttempt: new Date().toISOString(),
        recoveryStrategies: [...prev.recoveryStrategies, { errorId: id, strategy: type, success: true }]
      }))

      if (showToasts) {
        toast({
          title: 'Recovered',
          description: 'The issue has been resolved automatically',
          type: 'success'
        })
      }

    } catch (recoveryError) {
      // Recovery failed
      setErrorState(prev => ({
        ...prev,
        isRecovering: false,
        recoveryStrategies: [...prev.recoveryStrategies, { errorId: id, strategy: type, success: false }]
      }))

      console.error('Recovery failed:', recoveryError)
    }
  }, [queryClient, maxRetries, calculateRetryDelay, showToasts, toast])

  // Manual retry function
  const retryOperation = useCallback(async (operation, context = {}) => {
    const operationKey = context.operationKey || 'manual-retry'
    const attempt = retryAttempts.current.get(operationKey) || 0
    
    if (attempt >= maxRetries) {
      throw new Error(`Maximum retry attempts (${maxRetries}) exceeded`)
    }

    try {
      retryAttempts.current.set(operationKey, attempt + 1)
      const result = await operation()
      retryAttempts.current.delete(operationKey) // Reset on success
      return result
    } catch (error) {
      if (attempt + 1 >= maxRetries) {
        retryAttempts.current.delete(operationKey)
        throw error
      }
      
      const delay = calculateRetryDelay(attempt + 1, classifyError(error).type)
      await new Promise(resolve => setTimeout(resolve, delay))
      
      return retryOperation(operation, context)
    }
  }, [maxRetries, calculateRetryDelay])

  // Clear specific error
  const clearError = useCallback((errorId) => {
    setErrorState(prev => ({
      ...prev,
      errors: prev.errors.filter(error => error.id !== errorId)
    }))
  }, [])

  // Clear all errors
  const clearAllErrors = useCallback(() => {
    setErrorState(prev => ({
      ...prev,
      errors: []
    }))
  }, [])

  // Get error statistics
  const getErrorStats = useCallback(() => {
    const errors = errorLog.current
    const now = Date.now()
    const oneHour = 60 * 60 * 1000

    const recentErrors = errors.filter(error => 
      now - new Date(error.timestamp).getTime() < oneHour
    )

    const errorsByType = recentErrors.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1
      return acc
    }, {})

    const errorsBySeverity = recentErrors.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1
      return acc
    }, {})

    return {
      total: recentErrors.length,
      byType: errorsByType,
      bySeverity: errorsBySeverity,
      recoveryRate: errorState.recoveryStrategies.filter(s => s.success).length / 
                   Math.max(errorState.recoveryStrategies.length, 1)
    }
  }, [errorState.recoveryStrategies])

  // Cleanup old errors periodically
  useEffect(() => {
    const cleanup = setInterval(() => {
      const oneHour = 60 * 60 * 1000
      const now = Date.now()
      
      errorLog.current = errorLog.current.filter(error => 
        now - new Date(error.timestamp).getTime() < oneHour
      )
      
      setErrorState(prev => ({
        ...prev,
        errors: prev.errors.filter(error => 
          now - new Date(error.timestamp).getTime() < oneHour
        )
      }))
    }, 5 * 60 * 1000) // Cleanup every 5 minutes

    return () => clearInterval(cleanup)
  }, [])

  return {
    ...errorState,
    handleError,
    retryOperation,
    clearError,
    clearAllErrors,
    getErrorStats,
    ErrorTypes,
    ErrorSeverity
  }
}

// Hook for wrapping async operations with error handling
export const useErrorBoundary = (options = {}) => {
  const { handleError } = useAdvancedErrorHandling(options)

  const wrapAsync = useCallback((asyncFn, context = {}) => {
    return async (...args) => {
      try {
        return await asyncFn(...args)
      } catch (error) {
        const handledError = await handleError(error, {
          ...context,
          operation: asyncFn.name || 'unknown',
          arguments: args
        })
        throw handledError
      }
    }
  }, [handleError])

  const wrapPromise = useCallback((promise, context = {}) => {
    return promise.catch(async (error) => {
      const handledError = await handleError(error, context)
      throw handledError
    })
  }, [handleError])

  return {
    wrapAsync,
    wrapPromise,
    handleError
  }
}

export default useAdvancedErrorHandling
