// Global Loading Indicator for Phase 2
// frontend/src/components/GlobalLoadingIndicator.jsx

import React from 'react'
import { useSmartLoading } from '../hooks/useSmartLoading'
import { LoadingBar, Spinner } from './ui'
import { cn } from '../lib/utils'

const GlobalLoadingIndicator = ({ className, ...props }) => {
  const { 
    shouldShowLoading, 
    isFetching, 
    isMutating, 
    loadingProgress, 
    operationsCount 
  } = useSmartLoading()

  if (!shouldShowLoading) {
    return null
  }

  return (
    <div 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 bg-[var(--color-background-primary)] border-b border-[var(--color-gray-200)] shadow-sm",
        className
      )}
      {...props}
    >
      {/* Progress bar */}
      <LoadingBar 
        progress={loadingProgress} 
        className="h-1" 
        color="primary"
        animated 
      />
      
      {/* Loading details bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[var(--color-primary-50)]">
        <div className="flex items-center gap-3">
          <Spinner size="sm" color="primary" />
          <div className="text-sm">
            <span className="font-medium text-[var(--color-primary-700)]">
              {isMutating ? 'Saving changes...' : 'Loading...'}
            </span>
            {operationsCount > 1 && (
              <span className="text-[var(--color-primary-600)] ml-2">
                ({operationsCount} operations)
              </span>
            )}
          </div>
        </div>
        
        <div className="text-xs text-[var(--color-primary-600)]">
          {loadingProgress}%
        </div>
      </div>
    </div>
  )
}

// Minimal loading indicator for subtle operations
export const MinimalLoadingIndicator = ({ className, ...props }) => {
  const { shouldShowLoading, loadingProgress } = useSmartLoading()

  if (!shouldShowLoading) {
    return null
  }

  return (
    <div 
      className={cn(
        "fixed top-0 left-0 right-0 z-50",
        className
      )}
      {...props}
    >
      <LoadingBar 
        progress={loadingProgress} 
        className="h-0.5" 
        color="primary"
        animated 
      />
    </div>
  )
}

// Loading indicator for specific components
export const ComponentLoadingIndicator = ({ 
  isLoading, 
  children, 
  loadingComponent,
  className,
  ...props 
}) => {
  if (isLoading) {
    return (
      <div className={cn("relative", className)} {...props}>
        {children}
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center">
          {loadingComponent || (
            <div className="flex flex-col items-center gap-3">
              <Spinner size="lg" color="primary" />
              <span className="text-sm text-[var(--color-text-secondary)]">
                Loading...
              </span>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={className} {...props}>
      {children}
    </div>
  )
}

// Skeleton loading component for list items
export const SkeletonList = ({ count = 3, className }) => {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="animate-pulse">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-[var(--color-gray-200)] rounded"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-[var(--color-gray-200)] rounded w-3/4"></div>
              <div className="h-3 bg-[var(--color-gray-200)] rounded w-1/2"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Card skeleton loading
export const SkeletonCard = ({ className }) => {
  return (
    <div className={cn("border border-[var(--color-gray-200)] rounded-lg p-6 animate-pulse", className)}>
      <div className="space-y-4">
        <div className="h-6 bg-[var(--color-gray-200)] rounded w-1/3"></div>
        <div className="space-y-2">
          <div className="h-4 bg-[var(--color-gray-200)] rounded"></div>
          <div className="h-4 bg-[var(--color-gray-200)] rounded w-5/6"></div>
          <div className="h-4 bg-[var(--color-gray-200)] rounded w-2/3"></div>
        </div>
        <div className="flex gap-3 pt-4">
          <div className="h-8 bg-[var(--color-gray-200)] rounded w-20"></div>
          <div className="h-8 bg-[var(--color-gray-200)] rounded w-16"></div>
        </div>
      </div>
    </div>
  )
}

// Table skeleton loading
export const SkeletonTable = ({ rows = 5, columns = 4, className }) => {
  return (
    <div className={cn("border border-[var(--color-gray-200)] rounded-lg overflow-hidden", className)}>
      {/* Header */}
      <div className="bg-[var(--color-gray-50)] p-4 border-b border-[var(--color-gray-200)]">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }, (_, i) => (
            <div key={i} className="h-4 bg-[var(--color-gray-200)] rounded animate-pulse"></div>
          ))}
        </div>
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div key={rowIndex} className="p-4 border-b border-[var(--color-gray-100)] last:border-b-0">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }, (_, colIndex) => (
              <div 
                key={colIndex} 
                className="h-4 bg-[var(--color-gray-200)] rounded animate-pulse"
                style={{ 
                  animationDelay: `${(rowIndex * columns + colIndex) * 50}ms` 
                }}
              ></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default GlobalLoadingIndicator
