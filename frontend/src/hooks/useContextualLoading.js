// Context-Aware Loading States for Phase 2
// frontend/src/hooks/useContextualLoading.js

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryKeys'

// Context-aware loading hook that adapts to user behavior and app state
export const useContextualLoading = (options = {}) => {
  const {
    minimumLoadingTime = 300,
    fastUserThreshold = 150, // User is considered "fast" if they interact within 150ms
    maxSkeletonTime = 2000,
    adaptiveTimeout = true,
    context = 'default'
  } = options

  const [loadingState, setLoadingState] = useState({
    isLoading: false,
    showSkeleton: false,
    showSpinner: false,
    loadingType: 'initial', // 'initial', 'refresh', 'mutation', 'background'
    progress: 0,
    estimatedTime: null
  })

  const timeoutRef = useRef(null)
  const startTimeRef = useRef(null)
  const userInteractionRef = useRef(null)
  const loadingHistoryRef = useRef([])

  // Calculate adaptive timing based on user behavior
  const getAdaptiveTimings = useCallback(() => {
    const recentLoadings = loadingHistoryRef.current.slice(-5)
    
    if (recentLoadings.length === 0) {
      return { minimumTime: minimumLoadingTime, maxTime: maxSkeletonTime }
    }

    const avgLoadTime = recentLoadings.reduce((sum, time) => sum + time, 0) / recentLoadings.length
    const isFastUser = userInteractionRef.current && userInteractionRef.current < fastUserThreshold

    return {
      minimumTime: isFastUser ? Math.max(100, minimumLoadingTime - 100) : minimumLoadingTime,
      maxTime: avgLoadTime > 1000 ? Math.min(maxSkeletonTime + 1000, 5000) : maxSkeletonTime,
      estimatedTime: avgLoadTime
    }
  }, [minimumLoadingTime, fastUserThreshold, maxSkeletonTime])

  // Start loading with context awareness
  const startLoading = useCallback((type = 'initial', metadata = {}) => {
    startTimeRef.current = Date.now()
    const timings = getAdaptiveTimings()

    setLoadingState(prev => ({
      ...prev,
      isLoading: true,
      loadingType: type,
      estimatedTime: timings.estimatedTime,
      progress: 0
    }))

    // Determine loading UI strategy based on context and type
    if (type === 'mutation') {
      // For mutations, show immediate feedback
      setLoadingState(prev => ({ ...prev, showSpinner: true }))
    } else if (type === 'background') {
      // For background updates, minimal UI feedback
      setLoadingState(prev => ({ ...prev, showSkeleton: false, showSpinner: false }))
    } else {
      // For initial/refresh loads, start with skeleton after short delay
      timeoutRef.current = setTimeout(() => {
        setLoadingState(prev => prev.isLoading ? { ...prev, showSkeleton: true } : prev)
      }, timings.minimumTime)

      // Show spinner if taking too long
      setTimeout(() => {
        setLoadingState(prev => prev.isLoading ? { ...prev, showSpinner: true } : prev)
      }, timings.maxTime)
    }

    // Progress simulation for better UX
    if (timings.estimatedTime) {
      simulateProgress(timings.estimatedTime)
    }
  }, [getAdaptiveTimings])

  // Stop loading and record timing
  const stopLoading = useCallback(() => {
    if (startTimeRef.current) {
      const loadTime = Date.now() - startTimeRef.current
      loadingHistoryRef.current.push(loadTime)
      
      // Keep only recent history
      if (loadingHistoryRef.current.length > 10) {
        loadingHistoryRef.current = loadingHistoryRef.current.slice(-5)
      }
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    setLoadingState({
      isLoading: false,
      showSkeleton: false,
      showSpinner: false,
      loadingType: 'initial',
      progress: 100,
      estimatedTime: null
    })
  }, [])

  // Simulate progress for better perceived performance
  const simulateProgress = useCallback((estimatedTime) => {
    const progressInterval = setInterval(() => {
      setLoadingState(prev => {
        if (!prev.isLoading) {
          clearInterval(progressInterval)
          return prev
        }

        const elapsed = Date.now() - startTimeRef.current
        const progress = Math.min(95, (elapsed / estimatedTime) * 100)
        
        return { ...prev, progress }
      })
    }, 100)

    // Cleanup interval after estimated time
    setTimeout(() => clearInterval(progressInterval), estimatedTime + 1000)
  }, [])

  // Track user interaction speed
  const trackUserInteraction = useCallback(() => {
    if (startTimeRef.current) {
      userInteractionRef.current = Date.now() - startTimeRef.current
    }
  }, [])

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    ...loadingState,
    startLoading,
    stopLoading,
    trackUserInteraction,
    loadingHistory: loadingHistoryRef.current
  }
}

// Smart skeleton hook that adapts to content type
export const useSmartSkeleton = (contentType = 'list', options = {}) => {
  const {
    itemCount = 3,
    showAnimation = true,
    staggerDelay = 50,
    fadeInDuration = 300
  } = options

  const [visibleItems, setVisibleItems] = useState(0)
  const [isRevealing, setIsRevealing] = useState(false)

  const skeletonConfig = useMemo(() => {
    const configs = {
      list: {
        height: 'h-16',
        elements: ['avatar', 'title', 'subtitle'],
        spacing: 'space-y-3'
      },
      card: {
        height: 'h-48',
        elements: ['image', 'title', 'description', 'actions'],
        spacing: 'space-y-4'
      },
      table: {
        height: 'h-12',
        elements: ['columns'],
        spacing: 'space-y-2'
      },
      form: {
        height: 'auto',
        elements: ['labels', 'inputs', 'buttons'],
        spacing: 'space-y-4'
      },
      dashboard: {
        height: 'auto',
        elements: ['metrics', 'charts', 'tables'],
        spacing: 'space-y-6'
      }
    }
    
    return configs[contentType] || configs.list
  }, [contentType])

  // Staggered reveal animation
  useEffect(() => {
    if (showAnimation && !isRevealing) {
      setIsRevealing(true)
      
      const revealItems = () => {
        for (let i = 0; i < itemCount; i++) {
          setTimeout(() => {
            setVisibleItems(i + 1)
          }, i * staggerDelay)
        }
      }
      
      revealItems()
    } else if (!showAnimation) {
      setVisibleItems(itemCount)
    }
  }, [itemCount, staggerDelay, showAnimation, isRevealing])

  const SkeletonElement = ({ type, className = '', delay = 0 }) => {
    const baseClass = "animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded"
    const typeClasses = {
      avatar: 'w-12 h-12 rounded-full',
      title: 'h-6 w-3/4',
      subtitle: 'h-4 w-1/2',
      image: 'h-32 w-full',
      description: 'h-4 w-full',
      button: 'h-8 w-20',
      input: 'h-10 w-full',
      label: 'h-4 w-1/4'
    }

    return (
      <div 
        className={`${baseClass} ${typeClasses[type]} ${className}`}
        style={{ 
          animationDelay: `${delay}ms`,
          background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
          backgroundSize: '200% 100%',
          animation: 'skeleton-wave 1.6s ease-in-out infinite'
        }}
      />
    )
  }

  const generateSkeleton = useCallback(() => {
    const items = []
    
    for (let i = 0; i < Math.min(visibleItems, itemCount); i++) {
      const isVisible = i < visibleItems
      const delay = showAnimation ? i * staggerDelay : 0
      
      switch (contentType) {
        case 'list':
          items.push(
            <div key={i} className={`flex items-center space-x-4 p-4 ${isVisible ? 'opacity-100' : 'opacity-0'} transition-opacity duration-${fadeInDuration}`}>
              <SkeletonElement type="avatar" delay={delay} />
              <div className="flex-1 space-y-2">
                <SkeletonElement type="title" delay={delay + 50} />
                <SkeletonElement type="subtitle" delay={delay + 100} />
              </div>
            </div>
          )
          break
          
        case 'card':
          items.push(
            <div key={i} className={`border rounded-lg p-6 ${isVisible ? 'opacity-100' : 'opacity-0'} transition-opacity duration-${fadeInDuration}`}>
              <SkeletonElement type="image" delay={delay} className="mb-4" />
              <div className="space-y-3">
                <SkeletonElement type="title" delay={delay + 100} />
                <SkeletonElement type="description" delay={delay + 150} />
                <SkeletonElement type="description" delay={delay + 200} className="w-2/3" />
                <div className="flex gap-2 pt-2">
                  <SkeletonElement type="button" delay={delay + 250} />
                  <SkeletonElement type="button" delay={delay + 300} className="w-16" />
                </div>
              </div>
            </div>
          )
          break
          
        case 'table':
          items.push(
            <div key={i} className={`grid grid-cols-4 gap-4 p-4 border-b ${isVisible ? 'opacity-100' : 'opacity-0'} transition-opacity duration-${fadeInDuration}`}>
              <SkeletonElement type="title" delay={delay} />
              <SkeletonElement type="subtitle" delay={delay + 50} />
              <SkeletonElement type="subtitle" delay={delay + 100} />
              <SkeletonElement type="button" delay={delay + 150} />
            </div>
          )
          break
          
        default:
          items.push(
            <div key={i} className={`p-4 ${isVisible ? 'opacity-100' : 'opacity-0'} transition-opacity duration-${fadeInDuration}`}>
              <SkeletonElement type="title" delay={delay} />
            </div>
          )
      }
    }
    
    return items
  }, [contentType, visibleItems, itemCount, showAnimation, staggerDelay, fadeInDuration])

  return {
    SkeletonElement,
    generateSkeleton,
    visibleItems,
    isComplete: visibleItems >= itemCount,
    config: skeletonConfig
  }
}

// Performance-aware loading hook
export const usePerformanceAwareLoading = () => {
  const [performanceMetrics, setPerformanceMetrics] = useState({
    connectionType: 'unknown',
    effectiveType: 'unknown',
    isSlowConnection: false,
    memoryUsage: 0
  })

  useEffect(() => {
    // Detect connection type
    if ('connection' in navigator) {
      const connection = navigator.connection
      setPerformanceMetrics(prev => ({
        ...prev,
        connectionType: connection.type || 'unknown',
        effectiveType: connection.effectiveType || 'unknown',
        isSlowConnection: connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g'
      }))
    }

    // Monitor memory usage
    if ('memory' in performance) {
      setPerformanceMetrics(prev => ({
        ...prev,
        memoryUsage: performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit
      }))
    }
  }, [])

  const getOptimalLoadingStrategy = useCallback((dataSize = 'medium') => {
    const { isSlowConnection, memoryUsage } = performanceMetrics
    
    if (isSlowConnection || memoryUsage > 0.8) {
      return {
        useInfiniteScroll: true,
        pageSize: 5,
        preloadNext: false,
        useSkeleton: true,
        enableProgressBar: true
      }
    }
    
    if (dataSize === 'large') {
      return {
        useInfiniteScroll: true,
        pageSize: 20,
        preloadNext: true,
        useSkeleton: true,
        enableProgressBar: true
      }
    }
    
    return {
      useInfiniteScroll: false,
      pageSize: 50,
      preloadNext: true,
      useSkeleton: false,
      enableProgressBar: false
    }
  }, [performanceMetrics])

  return {
    performanceMetrics,
    getOptimalLoadingStrategy,
    isSlowConnection: performanceMetrics.isSlowConnection,
    isLowMemory: performanceMetrics.memoryUsage > 0.7
  }
}

export default useContextualLoading
