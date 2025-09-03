// Checkbox Component
// frontend/src/components/ui/Checkbox.jsx

import React, { forwardRef } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const checkboxVariants = cva(
  "peer h-4 w-4 shrink-0 rounded-sm border border-[var(--color-gray-300)] ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "data-[state=checked]:bg-[var(--color-primary-600)] data-[state=checked]:text-white data-[state=checked]:border-[var(--color-primary-600)]",
        success: "data-[state=checked]:bg-[var(--color-success-600)] data-[state=checked]:text-white data-[state=checked]:border-[var(--color-success-600)]",
        warning: "data-[state=checked]:bg-[var(--color-warning-600)] data-[state=checked]:text-white data-[state=checked]:border-[var(--color-warning-600)]",
        error: "data-[state=checked]:bg-[var(--color-error-600)] data-[state=checked]:text-white data-[state=checked]:border-[var(--color-error-600)]"
      },
      size: {
        sm: "h-3 w-3",
        md: "h-4 w-4",
        lg: "h-5 w-5"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "md"
    }
  }
)

const Checkbox = forwardRef(({
  className,
  variant,
  size,
  checked,
  onCheckedChange,
  label,
  helper,
  error,
  required,
  indeterminate = false,
  ...props
}, ref) => {
  const actualVariant = error ? 'error' : variant

  return (
    <div className="flex items-start space-x-2">
      <div className="relative flex items-center">
        <input
          ref={ref}
          type="checkbox"
          className={cn(checkboxVariants({ variant: actualVariant, size }), className)}
          checked={checked}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          data-state={checked ? "checked" : "unchecked"}
          {...props}
        />
        {checked && !indeterminate && (
          <svg
            className="absolute inset-0 h-full w-full text-current pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
        {indeterminate && (
          <svg
            className="absolute inset-0 h-full w-full text-current pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 12h12" />
          </svg>
        )}
      </div>
      
      {label && (
        <div className="grid gap-1.5 leading-none">
          <label 
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            onClick={() => onCheckedChange?.(!checked)}
          >
            {label}
            {required && <span className="text-[var(--color-error-500)] ml-1">*</span>}
          </label>
          {(helper || error) && (
            <p className={cn(
              "text-xs",
              error ? "text-[var(--color-error-500)]" : "text-[var(--color-text-secondary)]"
            )}>
              {error || helper}
            </p>
          )}
        </div>
      )}
    </div>
  )
})

Checkbox.displayName = "Checkbox"

export { Checkbox }
