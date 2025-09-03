// Form Components for Complete UI Library
// frontend/src/components/ui/Select.jsx

import React, { forwardRef, useState, useRef, useEffect } from 'react'
import { cva } from 'class-variance-authority'
import { cn, createFocusTrap } from '../../lib/utils'

const selectVariants = cva(
  "flex h-10 w-full items-center justify-between rounded-md border border-[var(--color-gray-300)] bg-[var(--color-background-primary)] px-3 py-2 text-sm ring-offset-background placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-[var(--color-gray-300)]",
        error: "border-[var(--color-error-500)] focus:ring-[var(--color-error-500)]",
        success: "border-[var(--color-success-500)] focus:ring-[var(--color-success-500)]"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
)

const Select = forwardRef(({
  className,
  variant,
  children,
  placeholder = "Select an option...",
  value,
  onValueChange,
  disabled = false,
  error,
  label,
  helper,
  required,
  ...props
}, ref) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedOption, setSelectedOption] = useState(null)
  const selectRef = useRef(null)
  const listRef = useRef(null)

  const actualVariant = error ? 'error' : variant

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
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

    const cleanup = isOpen && listRef.current ? createFocusTrap(listRef.current) : null

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
      if (cleanup) cleanup()
    }
  }, [isOpen])

  const handleSelect = (option) => {
    setSelectedOption(option)
    onValueChange?.(option.value)
    setIsOpen(false)
  }

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
          {label}
          {required && <span className="text-[var(--color-error-500)] ml-1">*</span>}
        </label>
      )}
      
      <div ref={selectRef} className="relative">
        <button
          ref={ref}
          type="button"
          className={cn(selectVariants({ variant: actualVariant }), className)}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          {...props}
        >
          <span className={cn(!selectedOption && "text-[var(--color-text-tertiary)]")}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <svg 
            className={cn("h-4 w-4 transition-transform", isOpen && "transform rotate-180")} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div
            ref={listRef}
            className="absolute z-50 top-full mt-1 w-full rounded-md border border-[var(--color-gray-200)] bg-[var(--color-background-primary)] shadow-lg"
            role="listbox"
          >
            <div className="max-h-60 overflow-auto p-1">
              {React.Children.map(children, (child, index) =>
                React.cloneElement(child, {
                  onSelect: handleSelect,
                  isSelected: selectedOption?.value === child.props.value
                })
              )}
            </div>
          </div>
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

const SelectItem = forwardRef(({
  className,
  children,
  value,
  onSelect,
  isSelected,
  disabled = false,
  ...props
}, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
      "hover:bg-[var(--color-gray-100)] focus:bg-[var(--color-gray-100)]",
      isSelected && "bg-[var(--color-primary-50)] text-[var(--color-primary-600)]",
      disabled && "cursor-not-allowed opacity-50",
      className
    )}
    onClick={() => !disabled && onSelect?.({ value, label: children })}
    {...props}
  >
    {children}
    {isSelected && (
      <svg className="ml-auto h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    )}
  </div>
))

Select.displayName = "Select"
SelectItem.displayName = "SelectItem"

export { Select, SelectItem }
