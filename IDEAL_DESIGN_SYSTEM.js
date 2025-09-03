// Design System Foundation
// frontend/src/styles/design-system.js

export const designTokens = {
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe', 
      500: '#3b82f6',
      600: '#2563eb',
      900: '#1e3a8a'
    },
    semantic: {
      success: '#10b981',
      warning: '#f59e0b', 
      error: '#ef4444',
      info: '#3b82f6'
    }
  },
  typography: {
    fontFamily: {
      display: ['Inter', 'system-ui', 'sans-serif'],
      body: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace']
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem', 
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem'
    }
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem', 
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem'
  },
  borderRadius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem'
  }
}

export const components = {
  Button: {
    baseStyle: {
      fontWeight: '600',
      borderRadius: 'md',
      transition: 'all 0.2s',
      cursor: 'pointer'
    },
    variants: {
      primary: {
        bg: 'primary.600',
        color: 'white',
        _hover: { bg: 'primary.700' },
        _active: { transform: 'scale(0.98)' }
      },
      secondary: {
        bg: 'gray.100',
        color: 'gray.900',
        _hover: { bg: 'gray.200' }
      }
    }
  },
  Card: {
    baseStyle: {
      bg: 'white',
      borderRadius: 'lg',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      overflow: 'hidden'
    }
  }
}
