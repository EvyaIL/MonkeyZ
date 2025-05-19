/** @type {import('tailwindcss').Config} */
module.exports = {
  purge: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  darkMode: false, 
  theme: {
    extend: {
      colors: {
        primary: '#222831', 
        secondary: '#393E46',
        accent: '#A27B5C',
        border: '#EEEEEE',
        danger: '#DC2626', 
        success: '#16A34A',
      }
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
