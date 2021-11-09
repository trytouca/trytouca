const colors = require('tailwindcss/colors');

module.exports = {
  mode: 'jit',
  purge: {
    content: [
      './pages/**/*.{js,ts,jsx,tsx}',
      './components/**/*.{js,ts,jsx,tsx}'
    ]
  },
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        'dark-blue': {
          900: '#0d0d2b',
          800: '#0d2040',
          700: colors.sky[900]
        },
        sky: colors.sky
      },
      typography: {
        DEFAULT: {
          css: {
            blockquote: {
              fontWeight: 400
            },
            a: {
              color: colors.sky[400],
              '&:hover': {
                color: colors.sky[300]
              },
              textDecoration: 'none'
            }
          }
        }
      }
    }
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')]
};
