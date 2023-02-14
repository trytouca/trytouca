// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

module.exports = {
  mode: 'jit',
  darkMode: 'class',
  content: ['./src/**/*.{html,scss,ts}'],
  theme: {
    extend: {}
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')]
};
