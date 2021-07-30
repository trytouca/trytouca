/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

const colors = require('tailwindcss/colors');

module.exports = {
  mode: process.env.TAILWIND_MODE ? 'jit' : 'aot',
  purge: {
    enabled: true,
    content: ['./src/**/*.{html,scss,ts}']
  },
  theme: {
    extend: {
      colors: {
        sky: colors.sky
      },
      screens: {
        print: { raw: 'print' }
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            code: {
              backgroundColor: theme('colors.gray.100'),
              borderRadius: '0.25rem',
              color: theme('colors.gray.700'),
              fontWeight: '500',
              padding: '0.25rem'
            },
            'code::before': {
              content: ''
            },
            'code::after': {
              content: ''
            }
          }
        }
      })
    }
  },
  variants: {
    extend: {}
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')]
};
