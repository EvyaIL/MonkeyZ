// Unified Loading Component
// frontend/src/components/ui/Loading.jsx

import React, { forwardRef } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const loadingVariants = cva(
  "animate-spin rounded-full border-2 border-solid border-current border-r-transparent",
  {
    variants: {
      size: {
        xs: "h-3 w-3 border",
        sm: "h-4 w-4 border",
        md: "h-6 w-6 border-2",
        lg: "h-8 w-8 border-2",
        xl: "h-12 w-12 border-2",
        "2xl": "h-16 w-16 border-4"
      },
      color: {
        default: "text-[var(--color-text-primary)]",
        primary: "text-[var(--color-primary-500)]",
        secondary: "text-[var(--color-text-secondary)]",
        white: "text-white",
        success: "text-[var(--color-success-500)]",
        warning: "text-[var(--color-warning-500)]",
        error: "text-[var(--color-error-500)]"
      }
    },
    defaultVariants: {
      size: "md",
      color: "default"
    }
  }
)

const Spinner = forwardRef(({
  className,
  size,
  color,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn(loadingVariants({ size, color }), className)}
      {...props}
    />
  )
})

const LoadingDots = forwardRef(({
  className,
  size = "md",
  color = "default",
  ...props
}, ref) => {
  const dotSizes = {
    xs: "h-1 w-1",
    sm: "h-1.5 w-1.5",
    md: "h-2 w-2",
    lg: "h-2.5 w-2.5",
    xl: "h-3 w-3",
    "2xl": "h-4 w-4"
  }

  const colorClasses = {
    default: "bg-[var(--color-text-primary)]",
    primary: "bg-[var(--color-primary-500)]",
    secondary: "bg-[var(--color-text-secondary)]",
    white: "bg-white",
    success: "bg-[var(--color-success-500)]",
    warning: "bg-[var(--color-warning-500)]",
    error: "bg-[var(--color-error-500)]"
  }

  return (
    <div
      ref={ref}
      className={cn("flex items-center space-x-1", className)}
      {...props}
    >
      <div 
        className={cn(
          "rounded-full animate-pulse",
          dotSizes[size],
          colorClasses[color]
        )}
        style={{ animationDelay: '0ms' }}
      />
      <div 
        className={cn(
          "rounded-full animate-pulse",
          dotSizes[size],
          colorClasses[color]
        )}
        style={{ animationDelay: '150ms' }}
      />
      <div 
        className={cn(
          "rounded-full animate-pulse",
          dotSizes[size],
          colorClasses[color]
        )}
        style={{ animationDelay: '300ms' }}
      />
    </div>
  )
})

const LoadingBar = forwardRef(({
  className,
  progress,
  color = "primary",
  animated = true,
  ...props
}, ref) => {
  const colorClasses = {
    default: "bg-[var(--color-text-primary)]",
    primary: "bg-[var(--color-primary-500)]",
    secondary: "bg-[var(--color-text-secondary)]",
    white: "bg-white",
    success: "bg-[var(--color-success-500)]",
    warning: "bg-[var(--color-warning-500)]",
    error: "bg-[var(--color-error-500)]"
  }

  return (
    <div
      ref={ref}
      className={cn("w-full bg-[var(--color-gray-200)] rounded-full h-2", className)}
      {...props}
    >
      <div
        className={cn(
          "h-2 rounded-full transition-all duration-300 ease-in-out",
          colorClasses[color],
          animated && "animate-pulse"
        )}
        style={{ width: progress ? `${Math.min(100, Math.max(0, progress))}%` : '0%' }}
      />
    </div>
  )
})

const LoadingOverlay = forwardRef(({
  className,
  children,
  isLoading,
  spinnerSize = "lg",
  spinnerColor = "primary",
  overlay = true,
  ...props
}, ref) => {
  if (!isLoading) {
    return children
  }

  return (
    <div
      ref={ref}
      className={cn("relative", className)}
      {...props}
    >
      {children}
      <div className={cn(
        "absolute inset-0 flex items-center justify-center",
        overlay && "bg-white/70 backdrop-blur-sm"
      )}>
        <Spinner size={spinnerSize} color={spinnerColor} />
      </div>
    </div>
  )
})

const LoadingCard = forwardRef(({
  className,
  lines = 3,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn("animate-pulse space-y-4 p-4", className)}
      {...props}
    >
      <div className="h-4 bg-[var(--color-gray-200)] rounded w-3/4"></div>
      {Array.from({ length: lines }).map((_, i) => (
        <div 
          key={i} 
          className="h-3 bg-[var(--color-gray-200)] rounded"
          style={{ width: `${Math.random() * 40 + 60}%` }}
        ></div>
      ))}
    </div>
  )
})

Spinner.displayName = "Spinner"
LoadingDots.displayName = "LoadingDots"
LoadingBar.displayName = "LoadingBar"
LoadingOverlay.displayName = "LoadingOverlay"
LoadingCard.displayName = "LoadingCard"

export { 
  Spinner, 
  LoadingDots, 
  LoadingBar, 
  LoadingOverlay, 
  LoadingCard 
}
