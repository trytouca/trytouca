/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

const colors = require('tailwindcss/colors');

module.exports = {
  mode: process.env.TAILWIND_MODE ? 'jit' : 'aot',
  purge: {
    enabled: true,
    content: ['./src/**/*.html', './src/**/*.ts', './src/**/*.scss']
  },
  theme: {
    extend: {
      colors: {
        sky: colors.sky
      },
      screens: {
        print: { raw: 'print' }
      }
    }
  },
  variants: {
    extend: {}
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')]
};
