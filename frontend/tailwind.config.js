/** @type {import('tailwindcss').Config} */
module.exports = {
  // Use 'content' instead of deprecated 'purge'
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html'
  ],
  // Enable dark mode with class strategy
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#222831', // This will be overridden by daisyUI themes but can be a fallback
        secondary: '#393E46',
        accent: '#A27B5C',
        border: '#EEEEEE',
        danger: '#DC2626',
        success: '#16A34A',
      },
      fontFamily: {
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
    },
  },
  variants: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
    require('daisyui'),
  ],
  // daisyUI config (optional - good for specifying themes)
  daisyui: {
    themes: [
      "light", 
      "dark", 
      "cupcake", 
      "bumblebee", 
      "emerald", 
      "corporate", 
      "synthwave", 
      "retro", 
      "cyberpunk", 
      "valentine", 
      "halloween", 
      "garden", 
      "forest", 
      "aqua", 
      "lofi", 
      "pastel", 
      "fantasy", 
      "wireframe", 
      "black", 
      "luxury", 
      "dracula", 
      "cmyk", 
      "autumn", 
      "business", 
      "acid", 
      "lemonade", 
      "night", 
      "coffee", 
      "winter"
    ], // You can specify which themes you want to include
    darkTheme: "dark", // name of one of the included themes for dark mode
    base: true, // applies background color and foreground color for root element by default
    styled: true, // include daisyUI colors and design decisions for all components
    utils: true, // adds responsive and modifier utility classes
    rtl: true, // Changed to true for RTL support
    prefix: "", // prefix for daisyUI classnames (components, modifiers and responsive class names. Not colors)
    logs: true, // Shows info about daisyUI version and used config in the console when building your CSS
  },
};