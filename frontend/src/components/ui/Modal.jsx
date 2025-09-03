// Unified Modal Component
// frontend/src/components/ui/Modal.jsx

import React, { forwardRef, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const modalVariants = cva(
  "fixed inset-0 z-50 flex items-center justify-center",
  {
    variants: {
      overlay: {
        default: "bg-black/50",
        blur: "bg-black/20 backdrop-blur-sm",
        dark: "bg-black/70"
      }
    },
    defaultVariants: {
      overlay: "default"
    }
  }
)

const modalContentVariants = cva(
  "relative bg-[var(--color-background-primary)] rounded-lg shadow-lg border border-[var(--color-gray-200)] max-h-[90vh] overflow-auto",
  {
    variants: {
      size: {
        sm: "max-w-sm w-full mx-4",
        md: "max-w-md w-full mx-4",
        lg: "max-w-lg w-full mx-4",
        xl: "max-w-xl w-full mx-4",
        "2xl": "max-w-2xl w-full mx-4",
        "3xl": "max-w-3xl w-full mx-4",
        "4xl": "max-w-4xl w-full mx-4",
        full: "max-w-[95vw] w-full mx-4 h-[95vh]"
      }
    },
    defaultVariants: {
      size: "md"
    }
  }
)

const Modal = forwardRef(({
  isOpen,
  onClose,
  children,
  className,
  overlayClassName,
  size,
  overlay,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  ...props
}, ref) => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e) => {
      if (e.key === 'Escape' && closeOnEscape) {
        onClose?.()
      }
    }

    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose, closeOnEscape])

  if (!mounted || !isOpen) {
    return null
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose?.()
    }
  }

  return createPortal(
    <div
      className={cn(modalVariants({ overlay }), overlayClassName)}
      onClick={handleOverlayClick}
    >
      <div
        ref={ref}
        className={cn(modalContentVariants({ size }), className)}
        {...props}
      >
        {children}
      </div>
    </div>,
    document.body
  )
})

const ModalHeader = forwardRef(({
  className,
  children,
  ...props
}, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center justify-between p-6 border-b border-[var(--color-gray-200)]", className)}
    {...props}
  >
    {children}
  </div>
))

const ModalTitle = forwardRef(({
  className,
  children,
  ...props
}, ref) => (
  <h2
    ref={ref}
    className={cn("text-lg font-semibold text-[var(--color-text-primary)]", className)}
    {...props}
  >
    {children}
  </h2>
))

const ModalDescription = forwardRef(({
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

const ModalContent = forwardRef(({
  className,
  children,
  ...props
}, ref) => (
  <div
    ref={ref}
    className={cn("p-6", className)}
    {...props}
  >
    {children}
  </div>
))

const ModalFooter = forwardRef(({
  className,
  children,
  ...props
}, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center justify-end gap-3 p-6 border-t border-[var(--color-gray-200)]", className)}
    {...props}
  >
    {children}
  </div>
))

const ModalCloseButton = forwardRef(({
  className,
  onClose,
  ...props
}, ref) => (
  <button
    ref={ref}
    type="button"
    className={cn(
      "absolute top-4 right-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none",
      className
    )}
    onClick={onClose}
    {...props}
  >
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
    <span className="sr-only">Close</span>
  </button>
))

Modal.displayName = "Modal"
ModalHeader.displayName = "ModalHeader"
ModalTitle.displayName = "ModalTitle"
ModalDescription.displayName = "ModalDescription"
ModalContent.displayName = "ModalContent"
ModalFooter.displayName = "ModalFooter"
ModalCloseButton.displayName = "ModalCloseButton"

export { 
  Modal, 
  ModalHeader, 
  ModalTitle, 
  ModalDescription, 
  ModalContent, 
  ModalFooter, 
  ModalCloseButton 
}
