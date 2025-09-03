// Unified Input Component
// frontend/src/components/ui/Input.jsx

import React, { forwardRef, useState } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const inputVariants = cva(
  "flex w-full rounded-md border bg-[var(--color-background-primary)] px-3 py-2 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[var(--color-text-tertiary)] focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-[var(--color-gray-300)] focus-visible:ring-[var(--color-primary-500)] focus-visible:border-[var(--color-primary-500)]",
        error: "border-[var(--color-error-500)] focus-visible:ring-[var(--color-error-500)] focus-visible:border-[var(--color-error-500)]",
        success: "border-[var(--color-success-500)] focus-visible:ring-[var(--color-success-500)] focus-visible:border-[var(--color-success-500)]"
      },
      size: {
        sm: "h-8 px-2 text-xs",
        md: "h-10 px-3 text-sm",
        lg: "h-12 px-4 text-base"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "md"
    }
  }
)

const Input = forwardRef(({
  className,
  variant,
  size,
  type,
  error,
  label,
  helper,
  required,
  showPasswordToggle,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  
  const inputType = type === 'password' && showPassword ? 'text' : type
  const actualVariant = error ? 'error' : variant
  
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
          {label}
          {required && <span className="text-[var(--color-error-500)] ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          type={inputType}
          className={cn(inputVariants({ variant: actualVariant, size }), className)}
          ref={ref}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        
        {type === 'password' && showPasswordToggle && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        )}
      </div>
      
      {(helper || error) && (
        <p className={cn(
          "mt-2 text-xs",
          error ? "text-[var(--color-error-500)]" : "text-[var(--color-text-secondary)]"
        )}>
          {error || helper}
        </p>
      )}
    </div>
  )
})

Input.displayName = "Input"

export { Input }
