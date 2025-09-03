// Unified Badge Component
// frontend/src/components/ui/Badge.jsx

import React, { forwardRef } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[var(--color-primary-500)] text-white hover:bg-[var(--color-primary-600)]",
        secondary: "border-transparent bg-[var(--color-gray-100)] text-[var(--color-gray-900)] hover:bg-[var(--color-gray-200)]",
        destructive: "border-transparent bg-[var(--color-error-500)] text-white hover:bg-[var(--color-error-600)]",
        success: "border-transparent bg-[var(--color-success-500)] text-white hover:bg-[var(--color-success-600)]",
        warning: "border-transparent bg-[var(--color-warning-500)] text-white hover:bg-[var(--color-warning-600)]",
        outline: "text-[var(--color-text-primary)] border-[var(--color-gray-300)]",
        ghost: "border-transparent bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-gray-100)]"
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        md: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "md"
    }
  }
)

const Badge = forwardRef(({
  className,
  variant,
  size,
  children,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    >
      {children}
    </div>
  )
})

Badge.displayName = "Badge"

export { Badge, badgeVariants }
