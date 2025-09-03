// Unified Card Component
// frontend/src/components/ui/Card.jsx

import React, { forwardRef } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const cardVariants = cva(
  "rounded-lg border bg-[var(--color-background-primary)] text-[var(--color-text-primary)] shadow-sm",
  {
    variants: {
      variant: {
        default: "border-[var(--color-gray-200)]",
        elevated: "border-[var(--color-gray-200)] shadow-md",
        outlined: "border-2 border-[var(--color-gray-300)]",
        ghost: "border-transparent shadow-none"
      },
      padding: {
        none: "",
        sm: "p-4",
        md: "p-6",
        lg: "p-8"
      }
    },
    defaultVariants: {
      variant: "default",
      padding: "md"
    }
  }
)

const Card = forwardRef(({
  className,
  variant,
  padding,
  children,
  ...props
}, ref) => (
  <div
    ref={ref}
    className={cn(cardVariants({ variant, padding }), className)}
    {...props}
  >
    {children}
  </div>
))

const CardHeader = forwardRef(({
  className,
  children,
  ...props
}, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 pb-4", className)}
    {...props}
  >
    {children}
  </div>
))

const CardTitle = forwardRef(({
  className,
  children,
  ...props
}, ref) => (
  <h3
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  >
    {children}
  </h3>
))

const CardDescription = forwardRef(({
  className,
  children,
  ...props
}, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-[var(--color-text-secondary)]", className)}
    {...props}
  >
    {children}
  </p>
))

const CardContent = forwardRef(({
  className,
  children,
  ...props
}, ref) => (
  <div
    ref={ref}
    className={cn("", className)}
    {...props}
  >
    {children}
  </div>
))

const CardFooter = forwardRef(({
  className,
  children,
  ...props
}, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center pt-4", className)}
    {...props}
  >
    {children}
  </div>
))

Card.displayName = "Card"
CardHeader.displayName = "CardHeader"
CardTitle.displayName = "CardTitle"
CardDescription.displayName = "CardDescription"
CardContent.displayName = "CardContent"
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
