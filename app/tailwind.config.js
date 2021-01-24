/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

const colors = require('tailwindcss/colors');

module.exports = (isProd) => ({
  prefix: '',
  purge: {
    enabled: isProd,
    content: ['./src/**/*.{html,ts}']
  },
  darkMode: false,
  theme: {
    extend: {
      colors: {
        lblue: colors.lightBlue
      },
      container: {
        screens: {
          lg: '1200px'
        }
      },
      screens: {
        print: { raw: 'print' }
      }
    }
  },
  variants: {
    extend: {
      visibility: ['group-hover', 'hover']
    }
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')]
});
