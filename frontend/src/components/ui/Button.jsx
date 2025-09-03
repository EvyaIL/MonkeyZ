// Unified Button Component
// frontend/src/components/ui/Button.jsx

import React, { forwardRef } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'

// Button variants using class-variance-authority for type-safe variants
const buttonVariants = cva(
  // Base styles
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-[var(--color-brand-primary)] text-white hover:bg-blue-700 focus-visible:ring-blue-500",
        secondary: "bg-[var(--color-gray-100)] text-[var(--color-text-primary)] hover:bg-[var(--color-gray-200)] focus-visible:ring-gray-500",
        outline: "border border-[var(--color-gray-300)] bg-transparent hover:bg-[var(--color-gray-50)] focus-visible:ring-gray-500",
        ghost: "hover:bg-[var(--color-gray-100)] focus-visible:ring-gray-500",
        destructive: "bg-[var(--color-semantic-error)] text-white hover:bg-red-600 focus-visible:ring-red-500",
        success: "bg-[var(--color-semantic-success)] text-white hover:bg-green-600 focus-visible:ring-green-500",
        warning: "bg-[var(--color-semantic-warning)] text-white hover:bg-amber-600 focus-visible:ring-amber-500"
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 py-2",
        lg: "h-12 px-6 text-base",
        xl: "h-14 px-8 text-lg"
      },
      fullWidth: {
        true: "w-full"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "md"
    }
  }
)

const Button = forwardRef(({
  className,
  variant,
  size,
  fullWidth,
  loading,
  leftIcon,
  rightIcon,
  children,
  disabled,
  ...props
}, ref) => {
  const isDisabled = disabled || loading

  return (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      disabled={isDisabled}
      {...props}
    >
      {loading && (
        <svg
          className="mr-2 h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {!loading && leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {!loading && rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  )
})

Button.displayName = "Button"

export { Button, buttonVariants }
