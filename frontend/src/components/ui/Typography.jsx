// Unified Typography Component
// frontend/src/components/ui/Typography.jsx

import React, { forwardRef } from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const typographyVariants = cva(
  "text-[var(--color-text-primary)]",
  {
    variants: {
      variant: {
        h1: "scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl",
        h2: "scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0",
        h3: "scroll-m-20 text-2xl font-semibold tracking-tight",
        h4: "scroll-m-20 text-xl font-semibold tracking-tight",
        h5: "scroll-m-20 text-lg font-semibold tracking-tight",
        h6: "scroll-m-20 text-base font-semibold tracking-tight",
        p: "leading-7 [&:not(:first-child)]:mt-6",
        lead: "text-xl text-[var(--color-text-secondary)]",
        large: "text-lg font-semibold",
        small: "text-sm font-medium leading-none",
        muted: "text-sm text-[var(--color-text-secondary)]",
        caption: "text-xs text-[var(--color-text-tertiary)]",
        code: "relative rounded bg-[var(--color-gray-100)] px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold",
        kbd: "pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-[var(--color-background-secondary)] px-1.5 font-mono text-[10px] font-medium text-[var(--color-text-secondary)] opacity-100"
      },
      color: {
        default: "text-[var(--color-text-primary)]",
        secondary: "text-[var(--color-text-secondary)]",
        tertiary: "text-[var(--color-text-tertiary)]",
        primary: "text-[var(--color-primary-600)]",
        success: "text-[var(--color-success-600)]",
        warning: "text-[var(--color-warning-600)]",
        error: "text-[var(--color-error-600)]"
      },
      align: {
        left: "text-left",
        center: "text-center",
        right: "text-right",
        justify: "text-justify"
      }
    },
    defaultVariants: {
      variant: "p",
      color: "default",
      align: "left"
    }
  }
)

const elementMap = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  p: 'p',
  lead: 'p',
  large: 'div',
  small: 'small',
  muted: 'p',
  caption: 'span',
  code: 'code',
  kbd: 'kbd'
}

const Typography = forwardRef(({
  className,
  variant = "p",
  color,
  align,
  as,
  children,
  ...props
}, ref) => {
  const Component = as || elementMap[variant] || 'div'
  
  return (
    <Component
      ref={ref}
      className={cn(typographyVariants({ variant, color, align }), className)}
      {...props}
    >
      {children}
    </Component>
  )
})

Typography.displayName = "Typography"

// Convenience components for common use cases
const H1 = forwardRef((props, ref) => (
  <Typography ref={ref} variant="h1" {...props} />
))

const H2 = forwardRef((props, ref) => (
  <Typography ref={ref} variant="h2" {...props} />
))

const H3 = forwardRef((props, ref) => (
  <Typography ref={ref} variant="h3" {...props} />
))

const H4 = forwardRef((props, ref) => (
  <Typography ref={ref} variant="h4" {...props} />
))

const H5 = forwardRef((props, ref) => (
  <Typography ref={ref} variant="h5" {...props} />
))

const H6 = forwardRef((props, ref) => (
  <Typography ref={ref} variant="h6" {...props} />
))

const P = forwardRef((props, ref) => (
  <Typography ref={ref} variant="p" {...props} />
))

const Lead = forwardRef((props, ref) => (
  <Typography ref={ref} variant="lead" {...props} />
))

const Large = forwardRef((props, ref) => (
  <Typography ref={ref} variant="large" {...props} />
))

const Small = forwardRef((props, ref) => (
  <Typography ref={ref} variant="small" {...props} />
))

const Muted = forwardRef((props, ref) => (
  <Typography ref={ref} variant="muted" {...props} />
))

const Caption = forwardRef((props, ref) => (
  <Typography ref={ref} variant="caption" {...props} />
))

const Code = forwardRef((props, ref) => (
  <Typography ref={ref} variant="code" {...props} />
))

const Kbd = forwardRef((props, ref) => (
  <Typography ref={ref} variant="kbd" {...props} />
))

H1.displayName = "H1"
H2.displayName = "H2"
H3.displayName = "H3"
H4.displayName = "H4"
H5.displayName = "H5"
H6.displayName = "H6"
P.displayName = "P"
Lead.displayName = "Lead"
Large.displayName = "Large"
Small.displayName = "Small"
Muted.displayName = "Muted"
Caption.displayName = "Caption"
Code.displayName = "Code"
Kbd.displayName = "Kbd"

export { 
  Typography, 
  H1, H2, H3, H4, H5, H6, 
  P, Lead, Large, Small, Muted, Caption, 
  Code, Kbd 
}
