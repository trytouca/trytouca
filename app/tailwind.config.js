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
    gradientColorStops: () => ({
      primary: '#0369A1',
      secondary: '#0284C7'
    }),
    keyframes: false,
    order: false,
    roate: false,
    scale: false,
    skew: false,
    transform: false,
    transformOrigin: false,
    translate: false,
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      black: colors.black,
      white: colors.white,
      gray: colors.coolGray,
      red: colors.red,
      yellow: colors.amber,
      green: colors.emerald,
      blue: colors.blue,
      // indigo: colors.indigo,
      // purple: colors.violet,
      // pink: colors.pink,
      lblue: colors.lightBlue
    },
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      print: { raw: 'print' }
    },
    extend: {
      container: {
        screens: {
          lg: '1200px'
        }
      }
    }
  },
  variants: {
    extend: {
      backgroundColor: ['disabled'],
      textColor: ['disabled'],
      visibility: ['group-hover', 'hover']
    }
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')]
});
