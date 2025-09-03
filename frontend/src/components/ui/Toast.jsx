// Toast Notification System
// frontend/src/components/ui/Toast.jsx

import React, { createContext, useContext, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'

// Toast variants
const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-4 pr-8 shadow-lg transition-all",
  {
    variants: {
      variant: {
        default: "border-[var(--color-gray-200)] bg-[var(--color-background-primary)]",
        success: "border-[var(--color-success-200)] bg-[var(--color-success-50)] text-[var(--color-success-800)]",
        warning: "border-[var(--color-warning-200)] bg-[var(--color-warning-50)] text-[var(--color-warning-800)]",
        error: "border-[var(--color-error-200)] bg-[var(--color-error-50)] text-[var(--color-error-800)]",
        info: "border-[var(--color-primary-200)] bg-[var(--color-primary-50)] text-[var(--color-primary-800)]"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
)

// Toast Context
const ToastContext = createContext({})

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// Toast Provider
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const addToast = (toast) => {
    const id = Math.random().toString(36).substring(2, 15)
    const newToast = {
      id,
      ...toast,
      createdAt: Date.now()
    }
    
    setToasts(prev => [...prev, newToast])
    
    // Auto dismiss after duration
    const duration = toast.duration || 5000
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
    
    return id
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const toast = {
    success: (title, description, options = {}) => 
      addToast({ title, description, variant: 'success', ...options }),
    error: (title, description, options = {}) => 
      addToast({ title, description, variant: 'error', ...options }),
    warning: (title, description, options = {}) => 
      addToast({ title, description, variant: 'warning', ...options }),
    info: (title, description, options = {}) => 
      addToast({ title, description, variant: 'info', ...options }),
    default: (title, description, options = {}) => 
      addToast({ title, description, variant: 'default', ...options })
  }

  return (
    <ToastContext.Provider value={{ toast, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

// Toast Container
const ToastContainer = ({ toasts, removeToast }) => {
  if (toasts.length === 0) return null

  return createPortal(
    <div className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
      ))}
    </div>,
    document.body
  )
}

// Individual Toast Component
const Toast = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  const handleRemove = () => {
    setIsExiting(true)
    setTimeout(onRemove, 150) // Wait for exit animation
  }

  return (
    <div
      className={cn(
        "mb-2 transform transition-all duration-200 ease-in-out",
        isVisible && !isExiting ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      )}
    >
      <div className={cn(toastVariants({ variant: toast.variant }))}>
        <div className="grid gap-1">
          {toast.title && (
            <div className="text-sm font-semibold">{toast.title}</div>
          )}
          {toast.description && (
            <div className="text-sm opacity-90">{toast.description}</div>
          )}
          {toast.action && (
            <div className="mt-2">{toast.action}</div>
          )}
        </div>
        
        <button
          className="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100"
          onClick={handleRemove}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// Toast icons for different variants
export const ToastIcons = {
  success: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  warning: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  ),
  info: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
