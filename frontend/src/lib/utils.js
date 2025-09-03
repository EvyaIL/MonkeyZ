// Utility function for class name merging
// frontend/src/lib/utils.js

import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// Animation utilities
export const animations = {
  fadeIn: 'animate-in fade-in-0 duration-200',
  fadeOut: 'animate-out fade-out-0 duration-200',
  slideIn: 'animate-in slide-in-from-bottom-2 duration-200',
  slideOut: 'animate-out slide-out-to-bottom-2 duration-200',
  scaleIn: 'animate-in zoom-in-95 duration-200',
  scaleOut: 'animate-out zoom-out-95 duration-200'
}

// Focus trap utility for modals and dropdowns
export function createFocusTrap(element) {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )
  
  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]

  function trapFocus(e) {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus()
          e.preventDefault()
        }
      }
    }
  }

  element.addEventListener('keydown', trapFocus)
  
  return () => {
    element.removeEventListener('keydown', trapFocus)
  }
}

// Debounce utility for performance optimization
export function debounce(func, wait, immediate) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      timeout = null
      if (!immediate) func(...args)
    }
    const callNow = immediate && !timeout
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    if (callNow) func(...args)
  }
}

// Throttle utility for performance optimization
export function throttle(func, limit) {
  let inThrottle
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Format currency utility
export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(amount)
}

// Format date utility
export function formatDate(date, options = {}) {
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }
  
  return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(new Date(date))
}

// Truncate text utility
export function truncateText(text, maxLength, suffix = '...') {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + suffix
}

// Generate unique ID utility
export function generateId(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
}

// Copy to clipboard utility
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    console.error('Failed to copy text: ', err)
    return false
  }
}

// Local storage utilities with error handling
export const storage = {
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.error(`Error reading from localStorage: ${error}`)
      return defaultValue
    }
  },
  
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.error(`Error writing to localStorage: ${error}`)
      return false
    }
  },
  
  remove(key) {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error(`Error removing from localStorage: ${error}`)
      return false
    }
  },
  
  clear() {
    try {
      localStorage.clear()
      return true
    } catch (error) {
      console.error(`Error clearing localStorage: ${error}`)
      return false
    }
  }
}

// Validation utilities
export const validators = {
  email: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },
  
  phone: (phone) => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
    return phoneRegex.test(phone.replace(/\s/g, ''))
  },
  
  url: (url) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  },
  
  strongPassword: (password) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    return strongPasswordRegex.test(password)
  }
}

// API response helpers
export const apiHelpers = {
  success: (data, message = 'Success') => ({
    success: true,
    data,
    message
  }),
  
  error: (error, message = 'An error occurred') => ({
    success: false,
    error,
    message
  }),
  
  loading: (message = 'Loading...') => ({
    loading: true,
    message
  })
}
