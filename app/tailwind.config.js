/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

const defaultTheme = require('tailwindcss/defaultTheme')
const colors = require('tailwindcss/colors')

module.exports = (isProd) => ({
    prefix: '',
    purge: {
      enabled: isProd,
      content: [
        './src/**/*.{html,ts}',
      ]
    },
    darkMode: false,
    theme: {
      extend: {
        colors: {
          lblue: colors.lightBlue
        },
        fontFamily: {
          sans: ['Inter var', ...defaultTheme.fontFamily.sans],
        },
      },
    },
    variants: {
      extend: {},
    },
    plugins: [
      require('@tailwindcss/forms'),
      require('@tailwindcss/typography'),
    ],
});
