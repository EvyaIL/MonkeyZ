// Smart Loading States Hook
// frontend/src/hooks/useSmartLoading.js

import { useState, useEffect, useCallback } from 'react'
import { useIsFetching, useIsMutating } from '@tanstack/react-query'

// Smart loading hook that provides context-aware loading states
export const useSmartLoading = (options = {}) => {
  const {
    minimumLoadingTime = 300, // Prevent flash of loading state
    globalTimeout = 10000, // Global timeout for loading states
    showGlobalLoading = true // Whether to show global loading indicator
  } = options

  const [isMinimumTimeMet, setIsMinimumTimeMet] = useState(false)
  const [startTime, setStartTime] = useState(null)

  // Get global loading states from React Query
  const isFetching = useIsFetching()
  const isMutating = useIsMutating()

  // Calculate if we're in a loading state
  const isLoading = isFetching > 0 || isMutating > 0

  // Handle minimum loading time
  useEffect(() => {
    if (isLoading && !startTime) {
      setStartTime(Date.now())
      setIsMinimumTimeMet(false)
      
      const timer = setTimeout(() => {
        setIsMinimumTimeMet(true)
      }, minimumLoadingTime)
      
      return () => clearTimeout(timer)
    } else if (!isLoading && startTime) {
      const elapsedTime = Date.now() - startTime
      
      if (elapsedTime >= minimumLoadingTime) {
        setIsMinimumTimeMet(true)
        setStartTime(null)
      } else {
        const remainingTime = minimumLoadingTime - elapsedTime
        const timer = setTimeout(() => {
          setIsMinimumTimeMet(true)
          setStartTime(null)
        }, remainingTime)
        
        return () => clearTimeout(timer)
      }
    }
  }, [isLoading, startTime, minimumLoadingTime])

  // Should show loading indicator
  const shouldShowLoading = isLoading && (!startTime || isMinimumTimeMet)

  // Loading progress calculation
  const getLoadingProgress = useCallback(() => {
    if (!startTime) return 0
    const elapsed = Date.now() - startTime
    const progress = Math.min((elapsed / globalTimeout) * 100, 90) // Never reach 100% until complete
    return Math.round(progress)
  }, [startTime, globalTimeout])

  return {
    isLoading,
    shouldShowLoading,
    isFetching: isFetching > 0,
    isMutating: isMutating > 0,
    loadingProgress: getLoadingProgress(),
    operationsCount: isFetching + isMutating
  }
}

// Hook for component-specific loading states
export const useComponentLoading = (queryKeys = [], options = {}) => {
  const { minimumLoadingTime = 200 } = options
  const [isMinimumTimeMet, setIsMinimumTimeMet] = useState(false)

  // Get loading state for specific query keys
  const isFetching = useIsFetching({
    predicate: (query) => queryKeys.some(key => 
      JSON.stringify(query.queryKey).includes(JSON.stringify(key))
    )
  })

  const isMutating = useIsMutating({
    predicate: (mutation) => queryKeys.some(key =>
      mutation.meta?.queryKey && 
      JSON.stringify(mutation.meta.queryKey).includes(JSON.stringify(key))
    )
  })

  const isLoading = isFetching > 0 || isMutating > 0

  useEffect(() => {
    if (isLoading) {
      setIsMinimumTimeMet(false)
      const timer = setTimeout(() => {
        setIsMinimumTimeMet(true)
      }, minimumLoadingTime)
      
      return () => clearTimeout(timer)
    } else {
      setIsMinimumTimeMet(false)
    }
  }, [isLoading, minimumLoadingTime])

  return {
    isLoading,
    shouldShowLoading: isLoading && isMinimumTimeMet,
    isFetching: isFetching > 0,
    isMutating: isMutating > 0
  }
}

// Loading state context for different operations
export const LoadingContext = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error'
}

// Hook for managing operation states with transitions
export const useOperationState = (initialState = LoadingContext.IDLE) => {
  const [state, setState] = useState(initialState)
  const [error, setErrorState] = useState(null)
  const [data, setData] = useState(null)

  const startLoading = useCallback(() => {
    setState(LoadingContext.LOADING)
    setErrorState(null)
  }, [])

  const setSuccess = useCallback((result) => {
    setState(LoadingContext.SUCCESS)
    setData(result)
    setErrorState(null)
  }, [])

  const setError = useCallback((err) => {
    setState(LoadingContext.ERROR)
    setErrorState(err)
  }, [])

  const reset = useCallback(() => {
    setState(LoadingContext.IDLE)
    setErrorState(null)
    setData(null)
  }, [])

  return {
    state,
    error,
    data,
    isLoading: state === LoadingContext.LOADING,
    isSuccess: state === LoadingContext.SUCCESS,
    isError: state === LoadingContext.ERROR,
    isIdle: state === LoadingContext.IDLE,
    startLoading,
    setSuccess,
    setError,
    reset
  }
}

// Hook for staggered loading animations
export const useStaggeredLoading = (itemCount, delay = 100) => {
  const [visibleItems, setVisibleItems] = useState(0)

  useEffect(() => {
    if (itemCount === 0) {
      setVisibleItems(0)
      return
    }

    setVisibleItems(0)
    const timers = []

    for (let i = 0; i < itemCount; i++) {
      const timer = setTimeout(() => {
        setVisibleItems(prev => prev + 1)
      }, i * delay)
      timers.push(timer)
    }

    return () => timers.forEach(clearTimeout)
  }, [itemCount, delay])

  return visibleItems
}

// Hook for intelligent prefetching
export const usePrefetch = () => {
  const prefetchActions = []

  const addPrefetchAction = useCallback((action) => {
    prefetchActions.push(action)
  }, [])

  const triggerPrefetch = useCallback(() => {
    prefetchActions.forEach(action => action())
  }, [])

  return {
    addPrefetchAction,
    triggerPrefetch
  }
}
