// LoadingBar Component for Phase 2
// frontend/src/components/ui/LoadingBar.jsx

import React from 'react'
import { cn } from '../../lib/utils'

const LoadingBar = ({ 
  progress = 0, 
  className,
  color = 'primary',
  animated = false,
  height = 'h-1',
  ...props 
}) => {
  const colorClasses = {
    primary: 'bg-[var(--color-primary-500)]',
    secondary: 'bg-[var(--color-secondary-500)]',
    success: 'bg-[var(--color-success-500)]',
    warning: 'bg-[var(--color-warning-500)]',
    danger: 'bg-[var(--color-danger-500)]',
    gray: 'bg-[var(--color-gray-500)]'
  }

  return (
    <div 
      className={cn(
        "relative w-full bg-[var(--color-gray-200)] overflow-hidden",
        height,
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "h-full transition-all duration-300 ease-out",
          colorClasses[color],
          animated && "animate-pulse"
        )}
        style={{ 
          width: `${Math.min(Math.max(progress, 0), 100)}%`,
          transition: 'width 0.3s ease-out'
        }}
      />
      
      {/* Animated shimmer effect for indeterminate loading */}
      {animated && (
        <div 
          className={cn(
            "absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent",
            "animate-shimmer"
          )}
          style={{
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite'
          }}
        />
      )}
    </div>
  )
}

// Indeterminate loading bar for when progress is unknown
export const IndeterminateLoadingBar = ({ 
  className,
  color = 'primary',
  height = 'h-1',
  ...props 
}) => {
  const colorClasses = {
    primary: 'bg-[var(--color-primary-500)]',
    secondary: 'bg-[var(--color-secondary-500)]',
    success: 'bg-[var(--color-success-500)]',
    warning: 'bg-[var(--color-warning-500)]',
    danger: 'bg-[var(--color-danger-500)]',
    gray: 'bg-[var(--color-gray-500)]'
  }

  return (
    <div 
      className={cn(
        "relative w-full bg-[var(--color-gray-200)] overflow-hidden",
        height,
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "absolute inset-y-0 w-1/3 rounded-full",
          colorClasses[color],
          "animate-indeterminate"
        )}
        style={{
          animation: 'indeterminate 2s infinite ease-in-out'
        }}
      />
    </div>
  )
}

// Circular progress indicator
export const CircularProgress = ({ 
  progress = 0, 
  size = 40,
  strokeWidth = 4,
  color = 'primary',
  showText = false,
  className,
  ...props 
}) => {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDashoffset = circumference - (progress / 100) * circumference

  const colorClasses = {
    primary: 'stroke-[var(--color-primary-500)]',
    secondary: 'stroke-[var(--color-secondary-500)]',
    success: 'stroke-[var(--color-success-500)]',
    warning: 'stroke-[var(--color-warning-500)]',
    danger: 'stroke-[var(--color-danger-500)]',
    gray: 'stroke-[var(--color-gray-500)]'
  }

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} {...props}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--color-gray-200)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className={cn("transition-all duration-300 ease-out", colorClasses[color])}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      
      {showText && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">
            {Math.round(progress)}%
          </span>
        </div>
      )}
    </div>
  )
}

// Multi-step progress indicator
export const StepProgress = ({ 
  steps, 
  currentStep = 0, 
  className,
  ...props 
}) => {
  return (
    <div className={cn("flex items-center", className)} {...props}>
      {steps.map((step, index) => (
        <React.Fragment key={index}>
          <div className="flex flex-col items-center">
            {/* Step circle */}
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors duration-200",
                index < currentStep
                  ? "bg-[var(--color-success-500)] text-white"
                  : index === currentStep
                  ? "bg-[var(--color-primary-500)] text-white"
                  : "bg-[var(--color-gray-200)] text-[var(--color-text-secondary)]"
              )}
            >
              {index < currentStep ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                index + 1
              )}
            </div>
            
            {/* Step label */}
            <div className="mt-2 text-xs text-center max-w-20">
              <div className={cn(
                "font-medium",
                index <= currentStep 
                  ? "text-[var(--color-text-primary)]" 
                  : "text-[var(--color-text-secondary)]"
              )}>
                {step.title}
              </div>
              {step.description && (
                <div className="text-[var(--color-text-tertiary)]">
                  {step.description}
                </div>
              )}
            </div>
          </div>
          
          {/* Connecting line */}
          {index < steps.length - 1 && (
            <div className="flex-1 mx-4">
              <div
                className={cn(
                  "h-0.5 transition-colors duration-200",
                  index < currentStep
                    ? "bg-[var(--color-success-500)]"
                    : "bg-[var(--color-gray-200)]"
                )}
              />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

export default LoadingBar
