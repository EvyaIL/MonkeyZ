// Design Tokens - Central source of truth for all design values
// frontend/src/styles/tokens.js

export const tokens = {
  // Color System
  colors: {
    // Brand Colors
    brand: {
      primary: '#2563eb',      // Main blue
      secondary: '#64748b',    // Slate gray
      accent: '#f59e0b',       // Amber accent
    },
    
    // Semantic Colors
    semantic: {
      success: '#10b981',      // Green
      warning: '#f59e0b',      // Amber
      error: '#ef4444',        // Red
      info: '#3b82f6',         // Blue
    },
    
    // Neutral Palette
    gray: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
    
    // Background Colors
    background: {
      primary: '#ffffff',
      secondary: '#f8fafc',
      dark: '#0f172a',
      darkSecondary: '#1e293b',
    },
    
    // Text Colors
    text: {
      primary: '#0f172a',
      secondary: '#64748b',
      inverse: '#ffffff',
      muted: '#94a3b8',
    }
  },

  // Typography System
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      display: ['Inter', 'system-ui', 'sans-serif'],
    },
    
    fontSize: {
      xs: '0.75rem',      // 12px
      sm: '0.875rem',     // 14px
      base: '1rem',       // 16px
      lg: '1.125rem',     // 18px
      xl: '1.25rem',      // 20px
      '2xl': '1.5rem',    // 24px
      '3xl': '1.875rem',  // 30px
      '4xl': '2.25rem',   // 36px
      '5xl': '3rem',      // 48px
    },
    
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
    
    letterSpacing: {
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
    }
  },

  // Spacing System (8px base unit)
  spacing: {
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
    24: '6rem',     // 96px
  },

  // Border Radius
  borderRadius: {
    none: '0',
    sm: '0.25rem',    // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    full: '9999px',
  },

  // Shadows
  boxShadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },

  // Transitions
  transition: {
    fast: '150ms ease-in-out',
    normal: '200ms ease-in-out',
    slow: '300ms ease-in-out',
  },

  // Breakpoints (Mobile-first)
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // Z-Index Scale
  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    dropdown: 1000,
    sticky: 1020,
    banner: 1030,
    overlay: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
    toast: 1080,
  }
}

// CSS Custom Properties Generator
export const generateCSSVars = (tokens) => {
  const vars = {}
  
  const processTokens = (obj, prefix = '') => {
    Object.entries(obj).forEach(([key, value]) => {
      const varName = prefix ? `${prefix}-${key}` : key
      
      if (typeof value === 'object' && value !== null) {
        processTokens(value, varName)
      } else {
        vars[`--${varName}`] = value
      }
    })
  }
  
  processTokens(tokens)
  return vars
}

export const cssVars = generateCSSVars(tokens)
