// Unified Dropdown Component
// frontend/src/components/ui/Dropdown.jsx

import React, { forwardRef, useState, useRef, useEffect } from 'react'
import { cva } from 'class-variance-authority'
import { cn, createFocusTrap } from '../../lib/utils'

const dropdownTriggerVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[var(--color-background-primary)] hover:bg-[var(--color-gray-100)] border border-[var(--color-gray-300)]",
        outline: "border border-[var(--color-gray-300)] bg-transparent hover:bg-[var(--color-gray-50)]",
        ghost: "hover:bg-[var(--color-gray-100)] hover:text-[var(--color-text-primary)]"
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-9 px-4 py-2",
        lg: "h-10 px-8"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "md"
    }
  }
)

const Dropdown = forwardRef(({
  children,
  className,
  ...props
}, ref) => {
  return (
    <div ref={ref} className={cn("relative inline-block text-left", className)} {...props}>
      {children}
    </div>
  )
})

const DropdownTrigger = forwardRef(({
  className,
  variant,
  size,
  children,
  asChild = false,
  ...props
}, ref) => {
  if (asChild) {
    return React.cloneElement(children, {
      ref,
      className: cn(dropdownTriggerVariants({ variant, size }), className),
      ...props
    })
  }

  return (
    <button
      ref={ref}
      className={cn(dropdownTriggerVariants({ variant, size }), className)}
      {...props}
    >
      {children}
      <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  )
})

const DropdownContent = forwardRef(({
  className,
  align = "start",
  sideOffset = 4,
  children,
  ...props
}, ref) => {
  const alignmentClasses = {
    start: "left-0",
    center: "left-1/2 transform -translate-x-1/2",
    end: "right-0"
  }

  return (
    <div
      ref={ref}
      className={cn(
        "absolute z-50 min-w-[8rem] overflow-hidden rounded-md border border-[var(--color-gray-200)] bg-[var(--color-background-primary)] p-1 shadow-md animate-in data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        alignmentClasses[align],
        className
      )}
      style={{ top: `calc(100% + ${sideOffset}px)` }}
      {...props}
    >
      {children}
    </div>
  )
})

const DropdownItem = forwardRef(({
  className,
  inset,
  children,
  ...props
}, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-[var(--color-gray-100)] focus:text-[var(--color-text-primary)] data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      inset && "pl-8",
      className
    )}
    {...props}
  >
    {children}
  </div>
))

const DropdownSeparator = forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-[var(--color-gray-200)]", className)}
    {...props}
  />
))

const DropdownLabel = forwardRef(({ className, inset, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold text-[var(--color-text-primary)]",
      inset && "pl-8",
      className
    )}
    {...props}
  >
    {children}
  </div>
))

// Hook for dropdown functionality
export const useDropdown = () => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    // Create focus trap
    const cleanup = isOpen && dropdownRef.current ? createFocusTrap(dropdownRef.current) : null

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
      if (cleanup) cleanup()
    }
  }, [isOpen])

  return {
    isOpen,
    setIsOpen,
    dropdownRef,
    toggle: () => setIsOpen(!isOpen),
    open: () => setIsOpen(true),
    close: () => setIsOpen(false)
  }
}

Dropdown.displayName = "Dropdown"
DropdownTrigger.displayName = "DropdownTrigger"
DropdownContent.displayName = "DropdownContent"
DropdownItem.displayName = "DropdownItem"
DropdownSeparator.displayName = "DropdownSeparator"
DropdownLabel.displayName = "DropdownLabel"

export {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
  DropdownLabel
}
