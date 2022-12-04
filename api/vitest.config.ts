// Copyright 2022 Touca, Inc. Subject to Apache-2.0 License.

import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  test: {
    coverage: {
      all: true,
      include: ['src/**/*.ts'],
      provider: 'istanbul',
      reportsDirectory: 'local/tests/coverage'
    }
  }
})
