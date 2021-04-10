const colors = require('tailwindcss/colors');

module.exports = {
  mode: 'jit',
  purge: {
    content: [
      './pages/**/*.{js,ts,jsx,tsx}',
      './components/**/*.{js,ts,jsx,tsx}'
    ],
    options: { safelist: ['text-red-400', 'text-green-400', 'text-yellow-400'] }
  },
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        'dark-blue': {
          900: '#0d0d2b',
          800: '#0d2040',
          700: colors.lightBlue[900]
        },
        'light-blue': colors.lightBlue
      }
    }
  },
  variants: {
    extend: {}
  },
  plugins: [require('@tailwindcss/forms')]
};
