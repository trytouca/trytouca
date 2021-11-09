// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

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
        dark: {
          900: '#0d0d2b'
        },
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
