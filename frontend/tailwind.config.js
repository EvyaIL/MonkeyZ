/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#222831',       // Dark blue/black
        secondary: '#393E46',     // Dark grey
        accent: '#3182CE',        // Professional blue accent (replacing brown/gold)
        'accent-dark': '#2C5282', // Darker variant of accent
        'accent-light': '#4299E1', // Lighter variant of accent
        'base-100': '#ffffff',    // Main background (white)
        'base-200': '#f8f9fa',    // Secondary background (light grey)
        'base-300': '#e9ecef',    // Border color (lighter grey)
        'base-content': '#212529', // Main text color
        error: '#DC2626',         // Error red
        success: '#16A34A',       // Success green
        info: '#12c2e9',
        warning: '#ffd803',
      },      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['Fira Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      borderRadius: {
        'xl': '1.25rem',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
      keyframes: {
        'slide-in': {
          '0%': {
            transform: 'translateX(100%)',
            opacity: '0'
          },
          '100%': {
            transform: 'translateX(0)',
            opacity: '1'
          }
        },
        'slide-out': {
          '0%': {
            transform: 'translateX(0)',
            opacity: '1'
          },
          '100%': {
            transform: 'translateX(100%)',
            opacity: '0'
          }
        },
        'fade-in': {
          '0%': {
            opacity: '0'
          },
          '100%': {
            opacity: '1'
          }
        },
        'fade-out': {
          '0%': {
            opacity: '1'
          },
          '100%': {
            opacity: '0'
          }
        },
        'pulse-light': {
          '0%, 100%': {
            opacity: '1'
          },
          '50%': {
            opacity: '0.7'
          }
        },
        'bounce-light': {
          '0%, 100%': {
            transform: 'translateY(0)'
          },
          '50%': {
            transform: 'translateY(-5px)'
          }
        }
      },
      animation: {
        'slide-in': 'slide-in 0.3s ease-out',
        'slide-out': 'slide-out 0.3s ease-in',
        'fade-in': 'fade-in 0.3s ease-out',
        'fade-out': 'fade-out 0.3s ease-in',
        'pulse-light': 'pulse-light 2s infinite',
        'bounce-light': 'bounce-light 2s infinite'      },      
      backgroundImage: {
        'gradient-accent': 'linear-gradient(90deg, var(--color-accent-dark) 0%, var(--color-accent) 100%)',
      },
    },
  },
  variants: {
    extend: {
      opacity: ['disabled'],
      cursor: ['disabled'],
      backgroundColor: ['disabled', 'active', 'hover'],
      textColor: ['disabled', 'active', 'hover'],
      borderColor: ['disabled', 'active', 'hover', 'focus'],
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
};