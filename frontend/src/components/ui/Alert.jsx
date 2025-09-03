// Unified Alert/Notification Component
// frontend/src/components/ui/Alert.jsx

import React, { forwardRef } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-[var(--color-background-primary)] text-[var(--color-text-primary)] border-[var(--color-gray-200)]",
        success: "border-[var(--color-success-200)] bg-[var(--color-success-50)] text-[var(--color-success-800)] [&>svg]:text-[var(--color-success-600)]",
        warning: "border-[var(--color-warning-200)] bg-[var(--color-warning-50)] text-[var(--color-warning-800)] [&>svg]:text-[var(--color-warning-600)]",
        error: "border-[var(--color-error-200)] bg-[var(--color-error-50)] text-[var(--color-error-800)] [&>svg]:text-[var(--color-error-600)]",
        info: "border-[var(--color-primary-200)] bg-[var(--color-primary-50)] text-[var(--color-primary-800)] [&>svg]:text-[var(--color-primary-600)]"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
)

const Alert = forwardRef(({ className, variant, children, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  >
    {children}
  </div>
))

const AlertTitle = forwardRef(({ className, children, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  >
    {children}
  </h5>
))

const AlertDescription = forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  >
    {children}
  </div>
))

// Icon components for different alert types
const AlertIcons = {
  success: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  warning: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  ),
  error: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  info: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

Alert.displayName = "Alert"
AlertTitle.displayName = "AlertTitle"
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription, AlertIcons }
