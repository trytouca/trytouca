// Copyright 2021 Touca, Inc. Subject to Apache-2.0 License.

const colors = require('tailwindcss/colors');

module.exports = {
  mode: 'jit',
  content: ['./src/**/*.{html,scss,ts}'],
  theme: {
    extend: {
      colors: {
        brand: {
          900: '#0d0d2b'
        }
      },
      typography: {
        DEFAULT: {
          css: {
            code: {
              backgroundColor: colors.gray[100],
              borderRadius: '0.25rem',
              color: colors.gray[700],
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
      }
    }
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')]
};
